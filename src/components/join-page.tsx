"use client";

import { useState } from "react";
import { Apple, PlayCircle, Sparkles } from "lucide-react";
import { Logo } from "./logo";

type Platform = "ios" | "android" | "other";

// TODO: replace with real store URLs once the app is published.
const APP_STORE_URL = "#";
const PLAY_STORE_URL = "#";

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

// This component is only ever mounted client-side (from `not-found.tsx`,
// after it resolves a /join/<code> path post-hydration), so it's safe to
// read `navigator` directly during the initial render.
export function JoinPage({ code }: { code: string }) {
  const [platform] = useState<Platform>(() => detectPlatform());

  const showIOS = platform === "ios" || platform === "other";
  const showAndroid = platform === "android" || platform === "other";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-glow px-6 py-16 text-center">
      <Logo />

      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
        <Sparkles className="h-3.5 w-3.5" />
        TripSync is currently in Private Beta
      </span>

      <h1 className="mt-6 max-w-md text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        You&apos;ve been invited to a trip
      </h1>

      <p className="mt-4 max-w-md text-slate-600">
        Get the TripSync app to view and add photos for this trip. If you
        already have it installed, this link should have opened it
        automatically.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {showIOS && (
          <a
            href={APP_STORE_URL}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Apple className="h-4 w-4" />
            Download on the App Store
          </a>
        )}
        {showAndroid && (
          <a
            href={PLAY_STORE_URL}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700"
          >
            <PlayCircle className="h-4 w-4" />
            Get it on Google Play
          </a>
        )}
      </div>

      <p className="mt-8 text-xs text-slate-400">Invite code: {code}</p>
    </div>
  );
}
