"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, Gift, Headphones, Home, LogOut, Settings, User, Wallet } from "lucide-react";

import { clearTokens, getAccessToken, STUDIO_AUTH_CHANGED } from "@/lib/studio/auth";
import { clearCachedMe, getCachedMe } from "@/lib/studio/profile";

const NAV_BASE = [
  { href: "/studio", label: "Home", icon: Home },
  { href: "/studio/profile", label: "Profile", icon: User },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];
// Earnings tab is PARKED (no revenue share / payouts in the platform-fee model). Kept here but never
// added to the nav — `showEarnings` is forced false below. Revive by restoring that condition.
const EARNINGS_ITEM = { href: "/studio/earnings", label: "Earnings", icon: Wallet };
// Refer & Earn — shown to photographers only (they're the ones who earn/spend credit).
const REFERRALS_ITEM = { href: "/studio/referrals", label: "Refer & Earn", icon: Gift };

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
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  // Plan label for the badge by the logo (shown only for paid plans).
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  // Earnings tab is parked (always hidden) — see EARNINGS_ITEM note above.
  const [showEarnings, setShowEarnings] = useState(false);
  // Refer & Earn tab — photographers only.
  const [showReferrals, setShowReferrals] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only auth read on mount
    setAuth(getAccessToken() ? "in" : "out");
    // Keep in sync with sign-out in another tab.
    const onStorage = () => {
      if (!getAccessToken()) clearCachedMe();
      setAuth(getAccessToken() ? "in" : "out");
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(STUDIO_AUTH_CHANGED, onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STUDIO_AUTH_CHANGED, onStorage);
    };
  }, []);

  // Load the signed-in user's name for the persistent sidebar identity (shared cache with Home).
  useEffect(() => {
    if (auth !== "in") {
      return;
    }
    let active = true;
    void getCachedMe()
      .then((user) => {
        if (!active) return;
        setUserName(user.name);
        setUserAvatar(user.avatarUrl ?? null);
        // Show the plan badge only for a paid plan (free → no badge).
        setPlanLabel(user.plan && user.plan !== "free" ? (user.planLabel ?? user.plan) : null);
        // Earnings/withdrawals are parked: TripSync no longer collects client money or pays
        // photographers out — the per-event charge is just our platform fee (photographers bill
        // clients directly). Keep the page/plumbing but hide the tab. (Was: rev_share || hasEarnings.)
        setShowEarnings(false);
        // Refer & Earn is for photographers (self-declared, or anyone who already hosts an event).
        setShowReferrals(user.role === "photographer" || Boolean(user.isHost));
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
    setUserAvatar(null);
    setPlanLabel(null);
    setAuth("out");
    router.replace("/studio/login");
  }

  if (isLoginRoute) {
    return <main className="min-h-dvh bg-studio">{children}</main>;
  }

  // Still resolving, or unauthenticated (while the redirect above runs) — neutral placeholder.
  if (auth !== "in") {
    return (
      <div className="bg-studio flex min-h-dvh items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  // Profile/Settings/Earnings/Refer&Earn own their own subtrees; Home owns everything else under
  // /studio (incl. groups). Order: Home, Profile, [Earnings], [Refer & Earn], Settings.
  const nav = [
    NAV_BASE[0],
    NAV_BASE[1],
    ...(showEarnings ? [EARNINGS_ITEM] : []),
    ...(showReferrals ? [REFERRALS_ITEM] : []),
    NAV_BASE[2],
  ];
  const current = (pathname ?? "").replace(/\/+$/, "");
  const activeHref = current.startsWith("/studio/settings")
    ? "/studio/settings"
    : current.startsWith("/studio/profile")
      ? "/studio/profile"
      : current.startsWith("/studio/earnings")
        ? "/studio/earnings"
        : current.startsWith("/studio/referrals")
          ? "/studio/referrals"
          : "/studio";

  return (
    <div className="bg-studio flex min-h-dvh">
      {/* Desktop left sidebar — sticky full-height so the footer (identity + sign out) stays pinned
          while the main content scrolls. */}
      <aside className="studio-sidebar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col md:flex">
        <Link
          href="/studio"
          className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5 font-semibold text-white"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-lg shadow-black/10">
            <Camera className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate tracking-tight">TripSync</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/60">
              Studio workspace
            </span>
          </span>
        </Link>
        <div className="px-5 pb-3 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/45">
          Workspace
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-teal-950 shadow-sm"
                    : "text-teal-50/70 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    active ? "bg-teal-100 text-teal-800" : "bg-white/6 text-teal-50/70 group-hover:bg-white/10"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.href === "/studio/earnings" && planLabel ? (
                  <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
                    {planLabel}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-3">
          <a
            href="tel:+918789330638"
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-teal-50/70 transition hover:bg-white/8 hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/6">
              <Headphones className="h-4 w-4 shrink-0" />
            </span>
            <span className="min-w-0 leading-tight">
              Help &amp; support
              <span className="mt-0.5 block text-[11px] font-normal text-teal-100/45">+91 87893 30638</span>
            </span>
          </a>
          {userName ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-200 text-xs font-bold text-teal-950">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed user avatar URL
                  <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (userName.trim()[0] ?? "?").toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="text-[11px] text-teal-100/50">Studio account</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
                className="ml-auto rounded-lg p-2 text-teal-50/55 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar + thumb-friendly bottom navigation. */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <Link href="/studio" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="bg-brand flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm">
              <Camera className="h-4 w-4" />
            </span>
            TripSync <span className="font-medium text-slate-400">Studio</span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10 lg:px-10 xl:px-12">
          {children}
        </main>
        <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl md:hidden">
          {nav.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                  active ? "bg-teal-50 text-teal-800" : "text-slate-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
