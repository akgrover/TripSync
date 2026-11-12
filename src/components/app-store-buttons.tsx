"use client";

import { useEffect, useState } from "react";
import { Apple, Play } from "lucide-react";

import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/links";

type OS = "ios" | "android" | "other" | "unknown";

// Detect the device OS from the UA so we can show only the relevant store. iPadOS reports a Mac UA,
// so we also treat touch-capable Macs as iOS. Returns "other" for desktop (→ show both).
function detectOS(): OS {
  if (typeof navigator === "undefined") {
    return "unknown";
  }
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) {
    return "android";
  }
  // iPhone/iPod report directly; modern iPadOS reports a Mac UA, so detect it as a "Mac" with real
  // touch points (desktop Macs report maxTouchPoints 0, iPads report >1).
  const isIPadOS = /Macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  if (/iphone|ipad|ipod/i.test(ua) || isIPadOS) {
    return "ios";
  }
  return "other";
}

// App-download buttons. Both stores are live; we show only the detected OS's store, and both when we
// can't tell (desktop, or before hydration). Used on the guest album and reusable elsewhere.
export function AppStoreButtons({ className = "" }: { className?: string }) {
  // Start "unknown" (matches SSR/export output) so hydration is stable; resolve on mount.
  const [os, setOs] = useState<OS>("unknown");
  useEffect(() => {
    // Resolve after mount (export/SSR output is "unknown", so this avoids a hydration mismatch).
    void (async () => {
      setOs(detectOS());
    })();
  }, []);

  const showIos = os === "ios" || os === "other" || os === "unknown";
  const showAndroid = os === "android" || os === "other" || os === "unknown";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {showIos ? (
        <a
          href={APP_STORE_URL}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Apple className="h-4 w-4" />
          App Store
        </a>
      ) : null}
      {showAndroid ? (
        <a
          href={PLAY_STORE_URL}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Play className="h-4 w-4" />
          Google Play
        </a>
      ) : null}
    </div>
  );
}
