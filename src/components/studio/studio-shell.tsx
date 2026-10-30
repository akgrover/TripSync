"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Home, LogOut, Settings } from "lucide-react";

import { clearTokens, getAccessToken } from "@/lib/studio/auth";
import { clearCachedMe, getCachedMe } from "@/lib/studio/profile";

const NAV = [
  { href: "/studio", label: "Home", icon: Home },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];

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
  // Static export runs with trailingSlash:true, so usePathname() returns "/studio/login/" (with the
  // trailing slash). Strip it before comparing, or a logged-out visitor to /studio/login/ fails the
  // login-route check, hits the auth gate, and gets stuck on "Loading…" in a redirect loop.
  const isLoginRoute = (pathname ?? "").replace(/\/+$/, "") === "/studio/login";

  const [auth, setAuth] = useState<"checking" | "in" | "out">("checking");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only auth read on mount
    setAuth(getAccessToken() ? "in" : "out");
    // Keep in sync with sign-out in another tab.
    const onStorage = () => setAuth(getAccessToken() ? "in" : "out");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Load the signed-in user's name for the persistent sidebar identity (shared cache with Home).
  useEffect(() => {
    if (auth !== "in") {
      return;
    }
    let active = true;
    void getCachedMe()
      .then((user) => {
        if (active) setUserName(user.name);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [auth]);

  useEffect(() => {
    if (auth === "out" && !isLoginRoute) {
      router.replace("/studio/login");
    }
  }, [auth, isLoginRoute, router]);

  function signOut() {
    clearTokens();
    clearCachedMe();
    setUserName(null);
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

  // Settings owns /studio/settings*; Home owns everything else under /studio (incl. group pages).
  const current = (pathname ?? "").replace(/\/+$/, "");
  const activeHref = current.startsWith("/studio/settings") ? "/studio/settings" : "/studio";

  return (
    <div className="flex min-h-dvh bg-slate-50">
      {/* Desktop left sidebar — sticky full-height so the footer (identity + sign out) stays pinned
          while the main content scrolls. */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <Link
          href="/studio"
          className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-100 px-4 font-semibold text-slate-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Camera className="h-4 w-4" />
          </span>
          TripSync Studio
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-slate-100 p-3">
          {userName ? (
            <div className="mb-1 flex items-center gap-2.5 px-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                {(userName.trim()[0] ?? "?").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
                <p className="text-xs text-slate-400">Signed in</p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (sidebar is hidden below md) */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur md:hidden">
          <Link href="/studio" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Camera className="h-4 w-4" />
            </span>
            Studio
          </Link>
          <div className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={`rounded-lg p-2 transition ${
                    active ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              );
            })}
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
