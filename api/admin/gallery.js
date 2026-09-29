// Admin: read and save the full list of gallery items (including hidden ones).
import { isAdmin, fromAdminPage } from "../_lib/auth.js";
import { readGallery, writeGallery, cleanItem, deleteUnusedPhotos, storageConfigured, ValidationError, ConflictError } from "../_lib/gallery-store.js";
import { json, error } from "../_lib/http.js";

function guard(request, { write = false } = {}) {
  if (!isAdmin(request)) return error("Please sign in again.", 401);
  if (write && !fromAdminPage(request)) return error("Request blocked.", 403);
  if (!storageConfigured()) return error("Photo storage isn't connected yet (BLOB_READ_WRITE_TOKEN).", 503);
  return null;
}

export async function GET(request) {
  const denied = guard(request);
  if (denied) return denied;
  const { items, etag } = await readGallery({ fresh: true });
  return json({ items, etag });
}

export async function PUT(request) {
  const denied = guard(request, { write: true });
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return error("Invalid request.", 400);
  if (body.items.length > 500) return error("That's more items than the gallery supports.", 400);

  let items;
  try {
    items = body.items.map(cleanItem);
  } catch (e) {
    if (e instanceof ValidationError) return error(e.message, 400);
    throw e;
  }
  if (new Set(items.map((it) => it.id)).size !== items.length) return error("Duplicate items.", 400);

  let etag;
  try {
    etag = await writeGallery(items, body.etag || null);
  } catch (e) {
    if (e instanceof ConflictError) {
      return error("The gallery was changed somewhere else (another tab or device). Reload the page and try again.", 409);
    }
    console.error("gallery save failed", e);
    return error("Couldn't save. Please try again.", 500);
  }

  // Tidy up photos from deleted items; never fail the save over it.
  await deleteUnusedPhotos(items).catch((e) => console.error("photo cleanup failed", e));

  return json({ items, etag });
}
