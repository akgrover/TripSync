import { studioApi } from "./api";
import type { StudioUser } from "./types";

// One shared /me fetch per session, so the sidebar and the Home greeting don't each call it. The
// module resets on a full reload (login does a hard navigation) and on sign-out via clearCachedMe().
let cached: Promise<StudioUser> | null = null;

export function getCachedMe(): Promise<StudioUser> {
  if (!cached) {
    cached = studioApi
      .getMe()
      .then((res) => res.user)
      .catch((err) => {
        cached = null; // let the next caller retry
        throw err;
      });
  }
  return cached;
}

export function clearCachedMe(): void {
  cached = null;
}

/** First name for greetings — the part before the first space, trimmed. */
export function firstNameOf(name: string | undefined | null): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}
