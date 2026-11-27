// Studio session tokens, stored client-side (localStorage) since the portal is a static SPA calling
// the API directly. TEMPORARY for the build phase: tokens are set by the dev sign-in gate; the real
// login flow (phone/Google — decided later) will set them the same way, so nothing above this layer
// changes when login lands.

const ACCESS_KEY = "tripsync.studio.accessToken";
const REFRESH_KEY = "tripsync.studio.refreshToken";
export const STUDIO_AUTH_CHANGED = "tripsync:auth-changed";

// Identity only; this is not token verification or an authorization check.
export function getSessionAccountId(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
  window.dispatchEvent(new Event(STUDIO_AUTH_CHANGED));
}

export function clearTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new Event(STUDIO_AUTH_CHANGED));
}

export function isSignedIn(): boolean {
  return Boolean(getAccessToken());
}
