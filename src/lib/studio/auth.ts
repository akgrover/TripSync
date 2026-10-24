// Studio session tokens, stored client-side (localStorage) since the portal is a static SPA calling
// the API directly. TEMPORARY for the build phase: tokens are set by the dev sign-in gate; the real
// login flow (phone/Google — decided later) will set them the same way, so nothing above this layer
// changes when login lands.

const ACCESS_KEY = "tripsync.studio.accessToken";
const REFRESH_KEY = "tripsync.studio.refreshToken";

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
}

export function clearTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function isSignedIn(): boolean {
  return Boolean(getAccessToken());
}
