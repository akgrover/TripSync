"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, LogOut } from "lucide-react";

import { clearTokens, getAccessToken } from "@/lib/studio/auth";

// Client-side auth gate + chrome for the Studio portal. The login route renders bare (no gate, no
// header); every other /studio route requires a token or bounces to /studio/login.
//
// Auth is resolved AFTER mount (tri-state: "checking" → "in"/"out"). localStorage isn't readable
// during static prerender, so the page renders "checking" first and only redirects once we've
// actually confirmed on the client that there's no token — never on a transient null, which would
// bounce a logged-in user to login on every reload.
export function StudioShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === "/studio/login";

  const [auth, setAuth] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only auth read on mount
    setAuth(getAccessToken() ? "in" : "out");
    // Keep in sync with sign-out in another tab.
    const onStorage = () => setAuth(getAccessToken() ? "in" : "out");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (auth === "out" && !isLoginRoute) {
      router.replace("/studio/login");
    }
  }, [auth, isLoginRoute, router]);

  function signOut() {
    clearTokens();
    setAuth("out");
    router.replace("/studio/login");
  }

  if (isLoginRoute) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">{children}</main>
    );
  }

  // Still resolving, or unauthenticated (while the redirect above runs) — neutral placeholder.
  if (auth !== "in") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/studio" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Camera className="h-4 w-4" />
            </span>
            TripSync Studio
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
