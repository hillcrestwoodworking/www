import { clearedCookie } from "../_lib/auth.js";
import { json } from "../_lib/http.js";

export function POST(request) {
  return json({ ok: true }, 200, { "Set-Cookie": clearedCookie(request) });
}
