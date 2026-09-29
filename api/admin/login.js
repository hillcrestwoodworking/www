import { checkPassword, passwordConfigured, sessionCookie, clientIp, tooManyAttempts, recordFailure } from "../_lib/auth.js";
import { json, error } from "../_lib/http.js";

export async function POST(request) {
  if (!passwordConfigured()) {
    return error("The admin password hasn't been set up yet (ADMIN_PASSWORD).", 503);
  }
  const ip = clientIp(request);
  if (tooManyAttempts(ip)) return error("Too many wrong tries. Wait 15 minutes and try again.", 429);

  const { password } = await request.json().catch(() => ({}));
  if (!checkPassword(password)) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return error("That password isn't right.", 401);
  }
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(request) });
}
