"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Lock } from "lucide-react";

import { ApiError, studioApi } from "@/lib/studio/api";
import { startGroupUnlockCheckout } from "@/lib/studio/billing";
import { formatRupees } from "@/lib/studio/money";
import type { PublicPayStatus } from "@/lib/studio/types";

type Phase = "loading" | "ready" | "unlocked" | "processing" | "notfound" | "error";

// Public, unauthenticated pay-to-unlock page. A photographer shares /pay?token=… with their client;
// the client pays here (no account) and the group unlocks for everyone. The provider webhook is the
// source of truth — after the widget reports success we poll the public status until it flips.
function PayInner() {
  const token = useSearchParams().get("token") ?? "";
  // Initialise straight to "notfound" when there's no token, so the effect never sets state synchronously.
  const [phase, setPhase] = useState<Phase>(() => (token ? "loading" : "notfound"));
  const [data, setData] = useState<PublicPayStatus | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when polling gives up after a paid checkout without seeing the unlock (webhook lag). We do
  // NOT re-offer "Pay" in this state — the payment already went through, so a second click would
  // double-charge. We offer Refresh instead.
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) {
      return; // phase already initialised to "notfound"
    }
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getPublicPayStatus(token);
        if (!active) return;
        setData(res);
        setPhase(res.state === "unlocked" ? "unlocked" : "ready");
      } catch (err) {
        if (!active) return;
        setPhase(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
      }
    })();
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token]);

  // After payment, poll status until the webhook unlocks the group (or we give up and ask them to
  // refresh — the unlock still happens server-side regardless).
  function startPolling() {
    setPhase("processing");
    let attempts = 0;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      attempts += 1;
      void studioApi
        .getPublicPayStatus(token)
        .then((res) => {
          setData(res);
          if (res.state === "unlocked") {
            if (pollRef.current) clearInterval(pollRef.current);
            setPhase("unlocked");
          } else if (attempts >= 20) {
            // Give up polling but stay in "processing" (NOT payable) — the payment succeeded; a
            // second payment would double-charge. Offer Refresh instead.
            if (pollRef.current) clearInterval(pollRef.current);
            setTimedOut(true);
            setError("Payment received — it can take a moment to unlock. Please refresh.");
          }
        })
        .catch(() => undefined);
    }, 3000);
  }

  async function pay() {
    if (paying) return;
    setPaying(true);
    setError(null);
    try {
      const outcome = await startGroupUnlockCheckout(token);
      if (outcome === "success") {
        startPolling();
      }
    } catch (err) {
      // The group was already unlocked (e.g. someone else paid, or a re-shared link) — that's good
      // news, not an error. Flip to the unlocked state instead of showing a red message.
      if (err instanceof ApiError && err.code === "ALREADY_UNLOCKED") {
        setPhase("unlocked");
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't start the payment. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="animate-rise rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        {phase === "loading" ? (
          <p className="flex items-center justify-center gap-2 py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </p>
        ) : phase === "notfound" ? (
          <div className="py-6 text-center">
            <h1 className="text-lg font-semibold text-slate-900">Link not found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This payment link is invalid or has expired. Please ask your photographer for a new one.
            </p>
          </div>
        ) : phase === "error" ? (
          <div className="py-6 text-center">
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">Please refresh the page and try again.</p>
          </div>
        ) : (
          <>
            {/* Studio brand: real logo when the photographer set one, else a neutral monogram so the
                page still feels owned rather than anonymous. */}
            <div className="flex items-center gap-3">
              {data?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, static export
                <img
                  src={data.logoUrl}
                  alt={data.photographerName || "Studio logo"}
                  className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <ImageIcon className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-teal-600">
                  {data?.photographerName || "Photo event"}
                </p>
                <h1 className="mt-0.5 truncate text-xl font-semibold text-slate-900">{data?.title}</h1>
              </div>
            </div>

            {phase === "unlocked" ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="animate-pop mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 font-semibold text-emerald-900">This event is unlocked</p>
                <p className="mt-1 text-sm text-emerald-800">
                  The full-resolution, watermark-free photos are now available in the album — open it
                  in the TripSync app or the album link your photographer shared.
                </p>
              </div>
            ) : data?.needsPrice ? (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This event needs a custom price. Please contact your photographer to complete payment.
              </p>
            ) : (
              <>
                <p className="mt-5 text-sm text-slate-600">
                  Pay to unlock the full-resolution, watermark-free photos for this event. Everyone with
                  access sees the originals once payment is received.
                </p>
                <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">Unlock price</span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {data?.amountPaise != null ? formatRupees(data.amountPaise) : "—"}
                  </span>
                </div>

                {error ? (
                  <p className={`mt-4 text-sm ${timedOut ? "text-amber-700" : "text-red-600"}`}>{error}</p>
                ) : null}

                {timedOut ? (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    Refresh
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void pay()}
                    disabled={paying || phase === "processing" || data?.amountPaise == null}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  >
                    {paying || phase === "processing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {phase === "processing" ? "Confirming payment…" : "Pay & unlock"}
                  </button>
                )}
                <p className="mt-3 text-center text-xs text-slate-400">
                  {data?.photographerName ? `Paying ${data.photographerName} · ` : ""}Secure payment
                  via Razorpay
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-screen items-center justify-center text-slate-400">Loading…</p>
      }
    >
      <PayInner />
    </Suspense>
  );
}
