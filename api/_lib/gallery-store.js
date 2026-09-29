// Gallery items live in one JSON file in Vercel Blob; photos are separate blobs under gallery/.
import crypto from "node:crypto";
import { get, put, list, del, BlobPreconditionFailedError } from "@vercel/blob";

const DATA_PATH = "data/gallery.json";
const PHOTO_PREFIX = "gallery/";
const BLOB_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/gallery\/[\w\-./]+$/i;
const isBlobUrl = (u) => typeof u === "string" && BLOB_URL.test(u) && !u.includes("..");

export const storageConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export class ValidationError extends Error {}

// fresh: bypass the CDN cache (admin edits); otherwise may be up to a minute old.
export async function readGallery({ fresh = false } = {}) {
  const result = await get(DATA_PATH, { access: "public", useCache: !fresh });
  if (!result || result.statusCode !== 200) return { items: [], etag: null };
  const data = JSON.parse(await new Response(result.stream).text());
  return { items: Array.isArray(data.items) ? data.items : [], etag: result.blob.etag };
}

export class ConflictError extends Error {}

// etag guards against two browser tabs overwriting each other's changes. With no etag
// (the gallery was empty when the page loaded) the save only succeeds if nobody has
// created the gallery file since.
export async function writeGallery(items, etag) {
  const body = JSON.stringify({ items, updatedAt: new Date().toISOString() });
  try {
    const result = await put(DATA_PATH, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
      ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
    });
    return result.etag;
  } catch (e) {
    if (e instanceof BlobPreconditionFailedError) throw new ConflictError();
    if (!etag && (await get(DATA_PATH, { access: "public", useCache: false }))) throw new ConflictError();
    throw e;
  }
}

export async function savePhoto(bytes, contentType) {
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[contentType];
  const pathname = `${PHOTO_PREFIX}${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const result = await put(pathname, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365, // photo URLs never change, so cache for a year
  });
  return result.url;
}

// Delete photos no item uses any more. Skips photos uploaded in the last day so an
// item still being edited in another tab doesn't lose its fresh uploads.
export async function deleteUnusedPhotos(items) {
  const used = new Set(items.flatMap((it) => it.photos.flatMap((p) => [p.src, p.thumb])));
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const unused = [];
  let cursor;
  do {
    const page = await list({ prefix: PHOTO_PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      if (!used.has(b.url) && new Date(b.uploadedAt).getTime() < cutoff) unused.push(b.url);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  if (unused.length) await del(unused);
  return unused.length;
}

const text = (v, max) => String(v ?? "").trim().slice(0, max);

export function cleanItem(raw) {
  if (!raw || typeof raw !== "object") throw new ValidationError("Invalid item.");
  const title = text(raw.title, 80);
  if (!title) throw new ValidationError("Every item needs a title.");
  const category = text(raw.category, 40);
  if (!/^[a-z0-9-]+$/.test(category)) throw new ValidationError(`Pick a category for "${title}".`);

  let price = null;
  if (raw.price !== null && raw.price !== undefined && raw.price !== "") {
    price = Number(raw.price);
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
      throw new ValidationError(`The price for "${title}" isn't a valid amount.`);
    }
    price = Math.round(price * 100) / 100;
  }

  const photos = (Array.isArray(raw.photos) ? raw.photos : [])
    .filter((p) => p && isBlobUrl(p.src))
    .slice(0, 12)
    .map((p) => ({ src: p.src, thumb: isBlobUrl(p.thumb) ? p.thumb : p.src }));
  if (!photos.length) throw new ValidationError(`Add at least one photo to "${title}".`);

  const created = new Date(raw.createdAt);
  return {
    id: typeof raw.id === "string" && /^[\w-]{8,64}$/.test(raw.id) ? raw.id : crypto.randomUUID(),
    title,
    category,
    price,
    priceFrom: price !== null && raw.priceFrom === true,
    description: text(raw.description, 600),
    photos,
    hidden: raw.hidden === true,
    createdAt: isNaN(created) ? new Date().toISOString() : created.toISOString(),
  };
}
