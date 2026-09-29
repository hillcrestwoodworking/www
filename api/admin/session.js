import { isAdmin, passwordConfigured } from "../_lib/auth.js";
import { storageConfigured } from "../_lib/gallery-store.js";
import { json } from "../_lib/http.js";

export function GET(request) {
  return json({
    signedIn: isAdmin(request),
    passwordConfigured: passwordConfigured(),
    storageConfigured: storageConfigured(),
  });
}
