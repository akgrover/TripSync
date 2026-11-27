"use client";

import { useEffect, useState } from "react";
import { Check, Copy, CreditCard, Loader2, Lock, LockOpen, TimerOff } from "lucide-react";

import { ApiError, studioApi } from "@/lib/studio/api";
import { startAuthedGroupCheckout } from "@/lib/studio/billing";
import { formatBytes, formatDate } from "@/lib/studio/format";
import { formatRupees, formatRupeesPrecise } from "@/lib/studio/money";
import type { GroupPaymentLink, StudioTrip } from "@/lib/studio/types";

// Owner-facing panel for a pay-to-unlock event group. The per-event charge is TripSync's PLATFORM FEE
// (AI face matching + hosting), paid by the photographer — not a client purchase, and TripSync no
// longer shares revenue or pays photographers out. Shows the lock/expiry state, the fee, and a link
// to TripSync's secure payment page (/pay?token=…, no login); the group unlocks via the webhook.
export function GroupPaywall({ trip, reload = 0 }: { trip: StudioTrip; reload?: number }) {
  // `expired` = paid once, term since lapsed (re-locked by the clock). `unlocked` = paid and still
  // live. The stored lock flag alone can't tell these apart, so check `expired` first.
  const expired = trip.revShare?.expired === true;
  const unlocked = trip.revShare?.locked === false && !expired;
  const [link, setLink] = useState<GroupPaymentLink | null>(null);
  const [loading, setLoading] = useState(!unlocked);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Fetch the pay link + price for both the locked (unlock) and expired (renew) cases; only a live
    // event needs nothing.
    if (unlocked) {
      return;
    }
    let active = true;
    void studioApi
      .getPaymentLink(trip.id)
      .then((res) => {
        if (active) { setLink(res); setError(null); }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Couldn't load the payment link.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trip.id, unlocked, reload]);

  const payUrl =
    link?.payToken && typeof window !== "undefined"
      ? `${window.location.origin}/pay?token=${encodeURIComponent(link.payToken)}`
      : "";

  async function copyLink() {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Select and copy it manually.");
    }
  }

  // Authenticated, credit-aware checkout (applies the owner's referral credit). Reloads on success so
  // the now-unlocked state renders; a dismissed widget just clears the busy state.
  async function pay() {
    setError(null);
    setBusy(true);
    try {
      const outcome = await startAuthedGroupCheckout(trip.id);
      if (outcome === "success") {
        window.location.reload();
        return;
      }
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment couldn't be completed. Please try again.");
      setBusy(false);
    }
  }

  if (unlocked) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <LockOpen className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Unlocked.</span> Everyone can see and download the original
          photos.
        </span>
      </div>
    );
  }

  return (
    // Neutral card: an event awaiting its fee isn't an error, so the surface stays white. Amber is the
    // status accent (chip + thin left border); the primary action is teal like the rest of the app.
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4">
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        {expired ? <TimerOff className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {expired ? "Access expired" : "Fee due to unlock"}
      </span>
      <p className="mt-2 text-sm text-slate-600">
        {expired ? (
          <>
            Access ended
            {trip.revShare?.expiresAt ? ` on ${formatDate(trip.revShare.expiresAt)}` : ""}, so guests
            see watermarked previews again. Pay the renewal fee to restore full-resolution access for
            everyone.
          </>
        ) : (
          <>
            This is TripSync&apos;s one-time fee for this event — it covers the AI face matching and
            hosting. Pay it to unlock full-resolution photos for everyone. Bill your client whatever
            you like; this fee is just your cost.
          </>
        )}
      </p>

      {loading ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing…
        </p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : !expired && link?.needsAdminPrice ? (
        <p className="mt-3 text-sm text-slate-600">
          This event is larger than our standard tiers. Contact TripSync to set the fee.
        </p>
      ) : link ? (
        (() => {
          const amt = expired ? link.renewalPrice : link.price;
          const fee = amt?.amountPaise ?? 0;
          const credit = Math.min(Math.max(0, link.availableCreditPaise ?? 0), fee);
          const net = Math.max(0, fee - credit);
          const fullyCovered = fee > 0 && net === 0;
          return (
            <>
              <p className="mt-3 text-sm text-slate-700">
                {expired ? "Renewal fee: " : "Platform fee: "}
                <span className="font-semibold text-slate-900">
                  {amt ? formatRupees(fee) : "—"}
                </span>
                {!expired && link.price ? (
                  <span className="text-slate-400"> · based on {formatBytes(link.storageUsedBytes)} stored</span>
                ) : null}
              </p>
              {credit > 0 ? (
                <div className="mt-2 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Referral credit applied</span>
                    <span className="font-medium text-teal-700">−{formatRupeesPrecise(credit)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-semibold text-slate-900">
                    <span>You pay</span>
                    <span>{formatRupeesPrecise(net)}</span>
                  </div>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void pay()}
                  disabled={busy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {busy
                    ? "Processing…"
                    : fullyCovered
                      ? "Unlock with credit"
                      : expired
                        ? "Pay renewal fee"
                        : "Pay fee & unlock"}
                </button>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  disabled={busy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy pay link"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {credit > 0
                  ? "Your referral credit is applied automatically. "
                  : ""}
                Pay securely here in Studio. The &ldquo;copy pay link&rdquo; option shares TripSync&apos;s
                public payment page (full fee, no credit) — separate from the invite code / QR your
                guests use.
              </p>
            </>
          );
        })()
      ) : null}
    </div>
  );
}
