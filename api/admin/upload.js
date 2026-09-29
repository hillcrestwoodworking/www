// Admin: upload one photo. The admin page shrinks photos in the browser first,
// so uploads stay well under Vercel's 4.5 MB request limit.
import { isAdmin, fromAdminPage } from "../_lib/auth.js";
import { savePhoto, storageConfigured } from "../_lib/gallery-store.js";
import { json, error } from "../_lib/http.js";

const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request) {
  if (!isAdmin(request)) return error("Please sign in again.", 401);
  if (!fromAdminPage(request)) return error("Request blocked.", 403);
  if (!storageConfigured()) return error("Photo storage isn't connected yet (connect a Blob store in Vercel → Storage).", 503);

  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!TYPES.has(type)) return error("Photos must be JPEG, PNG or WebP.", 415);

  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length) return error("The photo was empty.", 400);
  if (bytes.length > MAX_BYTES) return error("That photo is too large.", 413);

  try {
    return json({ url: await savePhoto(bytes, type) });
  } catch (e) {
    console.error("photo upload failed", e);
    return error("Couldn't upload the photo. Please try again.", 500);
  }
}
