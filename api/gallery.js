// Public: the gallery items shown on the site (hidden items left out).
import { readGallery, storageConfigured } from "./_lib/gallery-store.js";
import { json, error } from "./_lib/http.js";

export async function GET() {
  if (!storageConfigured()) return error("Photo storage isn't connected yet.", 503);
  try {
    const { items } = await readGallery();
    return json(
      { items: items.filter((it) => !it.hidden).map(({ hidden, ...it }) => it) },
      200,
      // Vercel's CDN serves this for a minute, so new items show up within about a minute.
      { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" }
    );
  } catch (e) {
    console.error("gallery read failed", e);
    return error("Couldn't load the gallery.", 500);
  }
}
