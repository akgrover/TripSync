// Base URL for the TripSync API. Override for local API dev via NEXT_PUBLIC_API_BASE_URL; defaults
// to production. (Trailing slashes trimmed so `${API_BASE_URL}${path}` is always clean.)
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.thetripsync.in"
).replace(/\/+$/, "");

// Invite links must point at api.thetripsync.in/join/<code> — that exact host is what the mobile
// app's iOS Universal Links / Android App Links are verified against, so a joiner's tap opens the
// app. Not configurable: changing the host would break deep-link verification.
export function joinLink(code: string): string {
  return `https://api.thetripsync.in/join/${code}`;
}
