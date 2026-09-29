// Admin login: one shared password (ADMIN_PASSWORD env var) and a signed, HttpOnly session cookie.
// Changing ADMIN_PASSWORD signs everyone out, because the cookie signature is derived from it.
import crypto from "node:crypto";

const COOKIE = "hw_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 14; // stay signed in for 14 days
const PLACEHOLDER = "change-this-password";

export function passwordConfigured() {
  const p = process.env.ADMIN_PASSWORD || "";
  return p.length >= 8 && p !== PLACEHOLDER;
}

const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));
const signingKey = () => sha256("hillcrest-admin-session:" + process.env.ADMIN_PASSWORD);
const sign = (value) => crypto.createHmac("sha256", signingKey()).update(value).digest("base64url");

export function checkPassword(input) {
  return passwordConfigured() && typeof input === "string" && safeEqual(input, process.env.ADMIN_PASSWORD);
}

function cookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function sessionCookie(request) {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return cookie(request, `${expires}.${sign(expires)}`, SESSION_SECONDS);
}

export const clearedCookie = (request) => cookie(request, "", 0);

export function isAdmin(request) {
  if (!passwordConfigured()) return false;
  const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)hw_admin=([^;]+)/);
  if (!match) return false;
  const [expires, sig] = match[1].split(".");
  if (!expires || !sig || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(expires));
}

// Changes must come from the admin page's own scripts. Browsers won't send this custom
// header cross-site without a CORS preflight (which we never allow), blocking CSRF.
export const fromAdminPage = (request) => request.headers.get("x-hw-admin") === "1";

// Best-effort brute-force brake. Serverless instances are short-lived, so this only slows
// guessing down; a long, unique password is the real protection.
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

export function tooManyAttempts(ip) {
  const f = failures.get(ip);
  return !!f && Date.now() - f.first < WINDOW_MS && f.count >= MAX_FAILURES;
}

export function recordFailure(ip) {
  const f = failures.get(ip);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(ip, { first: Date.now(), count: 1 });
  else f.count++;
}

export const clientIp = (request) =>
  (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
