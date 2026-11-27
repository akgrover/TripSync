"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { formatRupeesPrecise } from "@/lib/studio/money";
import type { ReferralSummary } from "@/lib/studio/types";
import { CopyButton } from "@/components/studio/copy-button";

export default function StudioReferralsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getReferrals();
        if (!active) return;
        setSummary(res);
        if (res.code && typeof window !== "undefined") {
          setShareUrl(`${window.location.origin}/studio/login/?ref=${encodeURIComponent(res.code)}`);
        }
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          window.location.replace("/studio/login");
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          // Not a photographer — this tab isn't for them.
          router.replace("/studio");
          return;
        }
        setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          <Gift className="h-3.5 w-3.5" />
          Refer &amp; Earn
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
          Invite photographers, earn credit
        </h1>
        <p className="mt-2 text-base leading-7 text-slate-500">
          Share your code. When someone you invite pays for an event, you earn{" "}
          <span className="font-semibold text-slate-700">10% as credit</span> — use it toward your own
          event fees.
        </p>
      </header>

      {status === "loading" ? (
        <div className="mt-8 flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : status === "error" ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex items-center gap-1.5 text-red-600"
        >
          <RefreshCw className="h-4 w-4" />
          Couldn&apos;t load Refer &amp; Earn. Retry.
        </button>
      ) : summary ? (
        <div className="mt-8 space-y-6">
          {/* Balance + referred count */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="shadow-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Wallet className="h-4 w-4" /> Credit balance
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {formatRupeesPrecise(summary.balancePaise)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Applied automatically at your next event checkout.
              </p>
            </div>
            <div className="shadow-card rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <Users className="h-4 w-4" /> Photographers referred
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {summary.referredCount}
              </p>
              <p className="mt-1 text-sm text-slate-500">You earn each time they pay for an event.</p>
            </div>
          </div>

          {/* Code + share link */}
          <div className="shadow-card rounded-2xl border border-slate-200/80 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Your referral code
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <code className="rounded-xl bg-slate-900 px-4 py-2 text-lg font-bold tracking-[0.18em] text-white">
                {summary.code ?? "—"}
              </code>
              <div className="flex flex-wrap gap-2">
                {summary.code ? <CopyButton value={summary.code} label="Copy code" /> : null}
                {shareUrl ? <CopyButton value={shareUrl} label="Copy invite link" /> : null}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              The code can only be entered by a new user during sign-up. Share your invite link so it&apos;s
              filled in for them.
            </p>
          </div>

          {/* How credit works */}
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:p-5">
            <p className="flex items-start gap-2 text-sm leading-6 text-teal-900">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              Credit is applied toward your own event fees — it isn&apos;t withdrawable as cash, and it
              never expires.
            </p>
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">Credit history</h2>
            {summary.history.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                <Gift className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">No credit yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Share your code — you&apos;ll see earnings here when a photographer you invited pays
                  for an event.
                </p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                {summary.history.map((entry) => {
                  const earn = entry.type === "earn";
                  return (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          earn ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {earn ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {earn ? "Referral credit earned" : "Credit used on an event"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {entry.status === "reserved" ? " · pending" : ""}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${earn ? "text-emerald-600" : "text-slate-700"}`}
                      >
                        {earn ? "+" : "−"}
                        {formatRupeesPrecise(entry.amountPaise)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
