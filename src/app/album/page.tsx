"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { getAccessToken, setTokens, clearTokens } from "@/lib/studio/auth";
import { GOOGLE_CLIENT_ID } from "@/lib/studio/config";
import type { PublicEvent, StudioTrip, StudioUser } from "@/lib/studio/types";
import { GoogleSignInButton } from "@/components/studio/google-signin-button";
import { SelfieCapture } from "@/components/studio/selfie-capture";
import { AppStoreButtons } from "@/components/app-store-buttons";
import { AlbumPhotos } from "@/components/album/album-photos";

type Phase = "loading" | "error" | "signedout" | "setup" | "ready";

// Remember (per user, per browser) that we've already offered the optional first-time setup, so a
// guest who skipped the selfie isn't re-prompted on every reload. Name is still forced when missing.
function setupSeenKey(userId: string): string {
  return `ts_album_setup:${userId}`;
}
function hasSeenSetup(userId: string): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(setupSeenKey(userId)) === "1";
  } catch {
    return false;
  }
}
function markSetupSeen(userId: string): void {
  try {
    window.localStorage.setItem(setupSeenKey(userId), "1");
  } catch {
    // ignore (private mode / storage disabled)
  }
}

// Branded header: cover banner (if provided) + logo + company/event title. Pure presentational.
function BrandHeader({ event }: { event: PublicEvent | null }) {
  const company = event?.photographer.companyName?.trim() || "";
  const logo = event?.photographer.logoUrl || "";
  const cover = event?.photographer.coverUrl || "";
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
        <img src={cover} alt="" className="h-32 w-full object-cover sm:h-40" />
      ) : (
        <div className="h-20 w-full bg-gradient-to-br from-teal-700 via-teal-500 to-teal-300" />
      )}
      <div className="flex items-center gap-3 px-5 py-4">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
          <img src={logo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain ring-1 ring-slate-200" />
        ) : null}
        <div className="min-w-0">
          {company ? (
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-teal-600">{company}</p>
          ) : null}
          <h1 className="truncate text-lg font-bold text-slate-900">
            {event?.eventTitle || "Your event photos"}
          </h1>
        </div>
      </div>
    </div>
  );
}

function AlbumInner() {
  const code = useSearchParams().get("code") ?? "";
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<StudioUser | null>(null);
  const [trip, setTrip] = useState<StudioTrip | null>(null);

  const [name, setName] = useState("");
  const [savingSetup, setSavingSetup] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Join the event (idempotent if already a member), then show the album.
  async function joinAndReady(): Promise<void> {
    const res = await studioApi.joinGroup(code);
    setTrip(res.trip);
    setPhase("ready");
  }

  // After auth: force the setup step when the name is missing, or offer it once (per user/browser)
  // when there's no face profile yet — so Google guests (who arrive with a name) still get the
  // optional selfie up front. Returning guests who skipped it aren't re-prompted.
  async function routeAfterAuth(u: StudioUser): Promise<void> {
    if (u.needsName || (!u.hasReferenceSelfie && !hasSeenSetup(u.id))) {
      setPhase("setup");
      return;
    }
    await joinAndReady();
  }

  // Decide what to show for an already-authenticated visitor.
  async function proceedAuthed(): Promise<void> {
    try {
      const me = await studioApi.getMe();
      setUser(me.user);
      setName(me.user.name ?? "");
      await routeAfterAuth(me.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        setPhase("signedout");
        return;
      }
      setPhase("error");
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!code) {
        setPhase("error");
        return;
      }
      try {
        const res = await studioApi.getPublicEvent(code);
        if (!active) return;
        setEvent(res.event);
      } catch {
        if (active) setPhase("error");
        return;
      }
      if (!getAccessToken()) {
        if (active) setPhase("signedout");
        return;
      }
      if (active) await proceedAuthed();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per code; handlers are stable enough
  }, [code]);

  async function handleGoogle(idToken: string) {
    setAuthError(null);
    try {
      const res = await studioApi.oauthLogin("google", idToken);
      setTokens(res);
      setUser(res.user);
      setName(res.user.name ?? "");
      await routeAfterAuth(res.user);
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : "Couldn't sign in. Please try again.");
    }
  }

  // Finish the one-time setup step: save a name if one is required, remember we've offered setup,
  // then open the album. The selfie (if added) was uploaded in place by SelfieCapture.
  async function finishSetup() {
    if (savingSetup) {
      return;
    }
    const value = name.trim();
    if (user?.needsName && value.length < 2) {
      return;
    }
    setSavingSetup(true);
    setAuthError(null);
    try {
      let current = user;
      if (user?.needsName) {
        const res = await studioApi.updateName(value);
        current = res.user;
        setUser(res.user);
      }
      if (current) {
        markSetupSeen(current.id);
      }
      await joinAndReady();
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : "Couldn't continue. Please try again.");
      setSavingSetup(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {phase === "error" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">This album link isn&apos;t valid</h1>
          <p className="mt-1 text-sm text-slate-500">
            Double-check the link from your photographer, or get the app to join with the code.
          </p>
          <div className="mt-4 flex justify-center">
            <AppStoreButtons />
          </div>
        </div>
      ) : phase === "loading" ? (
        <p className="flex items-center gap-2 py-16 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </p>
      ) : (
        <>
          <BrandHeader event={event} />

          <div className="mt-6">
            {phase === "signedout" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <h2 className="text-base font-semibold text-slate-900">See your photos</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sign in to view this event&apos;s photos and find the ones you&apos;re in.
                </p>
                <div className="mt-4 flex justify-center">
                  {GOOGLE_CLIENT_ID ? (
                    <GoogleSignInButton onCredential={(idToken) => void handleGoogle(idToken)} />
                  ) : (
                    <p className="text-sm text-slate-500">Get the app to continue.</p>
                  )}
                </div>
                {authError ? <p className="mt-3 text-sm text-red-600">{authError}</p> : null}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs text-slate-400">Prefer the app?</p>
                  <div className="flex justify-center">
                    <AppStoreButtons />
                  </div>
                </div>
              </div>
            ) : phase === "setup" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  {user?.needsName ? "Finish setting up" : "Add a selfie"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {user?.needsName
                    ? "Tell us your name, and add a selfie so we can find the photos you're in."
                    : "Add a selfie so TripSync can find the photos you're in. Optional — you can skip."}
                </p>

                {user?.needsName ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void finishSetup()}
                    placeholder="Your name"
                    maxLength={80}
                    autoFocus
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                ) : null}

                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Selfie <span className="font-normal text-slate-400">— optional</span>
                  </p>
                  <SelfieCapture user={user} onUpdated={setUser} />
                </div>

                <button
                  type="button"
                  onClick={() => void finishSetup()}
                  disabled={savingSetup || (Boolean(user?.needsName) && name.trim().length < 2)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {savingSetup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Continue
                </button>
                {authError ? <p className="mt-3 text-sm text-red-600">{authError}</p> : null}
              </div>
            ) : phase === "ready" && trip ? (
              <>
                <AlbumPhotos
                  tripId={trip.id}
                  user={user}
                  onUserUpdated={setUser}
                  matchedOnly={trip.photoVisibility === "matched_only"}
                />
                <div className="mt-10 border-t border-slate-100 pt-6 text-center">
                  <p className="mb-2 text-xs text-slate-400">Get the full experience in the app</p>
                  <div className="flex justify-center">
                    <AppStoreButtons />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default function AlbumPage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-slate-400">Loading…</p>}>
      <AlbumInner />
    </Suspense>
  );
}
