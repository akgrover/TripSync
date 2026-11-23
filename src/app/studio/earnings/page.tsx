"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Info, Wallet } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { formatRupees } from "@/lib/studio/money";
import type { StudioEarnings } from "@/lib/studio/types";

// Format an ISO date as e.g. "12 Nov 2026" (guest-facing, India English).
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudioEarningsPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<StudioEarnings | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getEarnings();
        if (!active) return;
        setData(res);
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          window.location.replace("/studio/login");
          return;
        }
        setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <p className="text-slate-400">Loading…</p>;
  }
  if (status === "error" || !data) {
    return (
      <button type="button" onClick={() => window.location.reload()} className="text-red-600">
        Couldn&apos;t load earnings. Retry.
      </button>
    );
  }

  const hasEvents = data.events.length > 0;

  return (
    <div className="max-w-4xl">
      <div className="flex items-start gap-3">
        <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Earnings</h1>
          <p className="mt-1 text-slate-500">
            What you&apos;ve collected through TripSync from your pay-to-unlock events.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total collected"
          value={formatRupees(data.totalCollectedPaise)}
          accent
        />
        <StatCard label="Available to withdraw" value={formatRupees(data.availablePaise)} />
        <StatCard label="Withdrawn" value={formatRupees(data.withdrawnPaise)} muted />
      </div>

      {/* Withdrawals are P1 (11b) — set expectations without a dead button. */}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>
          To withdraw your balance, contact us on{" "}
          <a href="tel:+918789330638" className="font-medium text-teal-700 hover:text-teal-800">
            +91 87893 30638
          </a>
          . Self-serve withdrawals are coming soon.
        </span>
      </div>

      {/* Per-event breakdown */}
      <h2 className="mt-8 text-sm font-semibold text-slate-900">By event</h2>
      {hasEvents ? (
        <div className="shadow-card mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Paid on</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.tripId} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-900">{e.title}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(e.paidAt)}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {formatRupees(e.amountPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <span className="bg-studio mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-teal-600">
            <IndianRupee className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-900">No payments yet</p>
          <p className="mt-1 text-sm text-slate-500">
            When a client pays to unlock one of your events, it shows up here.
          </p>
        </div>
      )}

      {/* Reconciliation: unlocked-without-a-TripSync-payment events (free / comp / paid offline). */}
      {data.offlineUnlockCount > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {data.offlineUnlockCount === 1
            ? "1 event was unlocked without a TripSync payment (free, comped, or paid to you directly) — not included above."
            : `${data.offlineUnlockCount} events were unlocked without a TripSync payment (free, comped, or paid to you directly) — not included above.`}
        </p>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`shadow-card rounded-2xl border p-5 ${
        accent ? "bg-brand border-transparent text-white" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs font-medium ${accent ? "text-white/80" : "text-slate-400"}`}>{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          accent ? "text-white" : muted ? "text-slate-400" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
