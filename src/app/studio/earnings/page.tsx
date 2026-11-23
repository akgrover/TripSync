"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Loader2, Wallet } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { formatRupees } from "@/lib/studio/money";
import { Dialog } from "@/components/studio/dialog";
import type { StudioEarnings, StudioWithdrawal } from "@/lib/studio/types";

// Format an ISO date as e.g. "12 Nov 2026" (India English).
function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Loose client-side UPI check (server is the source of truth); mirrors utils/upi.ts.
function looksLikeUpi(v: string): boolean {
  return /^[a-z0-9][a-z0-9.\-_]{1,255}@[a-z]{2,64}$/.test(v.trim().toLowerCase());
}

export default function StudioEarningsPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<StudioEarnings | null>(null);

  // Withdraw dialog.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upi, setUpi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      const res = await studioApi.getEarnings();
      setData(res);
      setStatus("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        window.location.replace("/studio/login");
        return;
      }
      setStatus("error");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; load is stable enough
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
  const openRequest = data.withdrawals.find((w) => w.status === "requested") ?? null;
  const canWithdraw = !openRequest && data.availablePaise > 0;

  function openDialog() {
    setUpi(data?.payoutUpiId ?? "");
    setSubmitError(null);
    setDialogOpen(true);
  }

  async function submitWithdrawal() {
    if (submitting) {
      return;
    }
    const value = upi.trim();
    if (!looksLikeUpi(value)) {
      setSubmitError("Enter a valid UPI id (e.g. name@bank).");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await studioApi.requestWithdrawal(value);
      setDialogOpen(false);
      await load(); // refresh balances + history
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Couldn't request the withdrawal. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
        <StatCard label="Total collected" value={formatRupees(data.totalCollectedPaise)} accent />
        <StatCard label="Available to withdraw" value={formatRupees(data.availablePaise)} />
        <StatCard label="Withdrawn" value={formatRupees(data.withdrawnPaise)} muted />
      </div>

      {/* Withdraw action / pending state */}
      <div className="mt-4">
        {openRequest ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Withdrawal of <span className="font-semibold">{formatRupees(openRequest.amountPaise)}</span>{" "}
            requested on {formatDate(openRequest.requestedAt)} to{" "}
            <span className="font-medium">{openRequest.payoutUpiId}</span>. We&apos;ll process it
            shortly — reach us on{" "}
            <a href="tel:+918789330638" className="font-medium underline">
              +91 87893 30638
            </a>{" "}
            if you need help.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openDialog}
              disabled={!canWithdraw}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              Withdraw {formatRupees(data.availablePaise)}
            </button>
            {!canWithdraw ? (
              <span className="text-sm text-slate-400">Nothing to withdraw yet.</span>
            ) : null}
          </div>
        )}
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

      {/* Withdrawal history */}
      {data.withdrawals.length > 0 ? (
        <>
          <h2 className="mt-8 text-sm font-semibold text-slate-900">Withdrawals</h2>
          <div className="shadow-card mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Requested</th>
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 text-slate-500">{formatDate(w.requestedAt)}</td>
                    <td className="px-5 py-3 text-slate-600">{w.payoutUpiId}</td>
                    <td className="px-5 py-3">
                      <WithdrawalStatus w={w} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatRupees(w.amountPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} title="Withdraw earnings">
        <p className="text-sm text-slate-600">
          You&apos;re withdrawing your full available balance of{" "}
          <span className="font-semibold text-slate-900">{formatRupees(data.availablePaise)}</span>.
          We&apos;ll transfer it to the UPI id below.
        </p>
        <label className="mt-4 mb-1 block text-sm font-medium text-slate-700">Payout UPI id</label>
        <input
          value={upi}
          onChange={(e) => {
            setSubmitError(null);
            setUpi(e.target.value);
          }}
          onKeyDown={(e) => e.key === "Enter" && void submitWithdrawal()}
          placeholder="name@bank"
          maxLength={256}
          autoFocus
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Double-check this — we pay out to exactly this UPI id.
        </p>
        {submitError ? <p className="mt-2 text-sm text-red-600">{submitError}</p> : null}
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submitWithdrawal()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Request withdrawal
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function WithdrawalStatus({ w }: { w: StudioWithdrawal }) {
  if (w.status === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        Paid{w.reference ? ` · ${w.reference}` : ""}
      </span>
    );
  }
  if (w.status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      Requested
    </span>
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
