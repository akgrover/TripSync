"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Phone } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { setTokens } from "@/lib/studio/auth";

// India-only, like the mobile app: the user types a 10-digit number and we send +91<digits>.
function toE164(local: string): string {
  return `+91${local.replace(/\D/g, "").slice(-10)}`;
}

const RESEND_SECONDS = 30;

export default function StudioLoginPage() {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const phoneValid = phoneDigits.length === 10;

  // Resend countdown (setState lives in the timeout callback, not the effect body).
  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function sendCode() {
    if (!phoneValid || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await studioApi.startOtp(toE164(phoneDigits));
      setStep("code");
      setSecondsLeft(RESEND_SECONDS);
      // Dev/test numbers return the code so we don't need an SMS — prefill it for convenience.
      if (res.devCode) {
        setCode(res.devCode);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't send the code. Check your connection.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(value: string) {
    if (verifying) {
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await studioApi.verifyOtp(toE164(phoneDigits), value);
      setTokens(res);
      // Full-page navigation (not router.replace): StudioShell lives in the shared /studio layout, so
      // a client-side navigation keeps it mounted with its auth state still "out" and the gate bounces
      // us back here. A hard load remounts the shell, which reads the just-set token and lets us in.
      window.location.assign("/studio/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "That code didn't match or expired. Try again."
          : err instanceof ApiError
            ? err.message
            : "Couldn't verify the code. Please try again.",
      );
      setCode("");
      setVerifying(false);
    }
  }

  function onCodeChange(next: string) {
    const digits = next.replace(/\D/g, "").slice(0, 6);
    setError(null);
    setCode(digits);
    if (digits.length === 6) {
      void verify(digits);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
          <Phone className="h-4 w-4" />
        </span>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Sign in to TripSync Studio</h1>
          <p className="text-xs text-slate-500">
            {step === "phone" ? "We'll text you a code" : `Code sent to +91 ${phoneDigits}`}
          </p>
        </div>
      </div>

      {step === "phone" ? (
        <>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
          <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <span className="pl-3 pr-2 text-sm text-slate-500">+91</span>
            <input
              value={phoneDigits}
              onChange={(e) => {
                setError(null);
                setPhone(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && void sendCode()}
              inputMode="numeric"
              placeholder="9000000000"
              maxLength={10}
              autoFocus
              className="w-full bg-transparent py-2.5 pr-3 text-sm text-slate-900 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={!phoneValid || busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send code
          </button>
        </>
      ) : (
        <>
          <label className="mb-1 block text-sm font-medium text-slate-700">Enter the 6-digit code</label>
          <input
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            inputMode="numeric"
            placeholder="______"
            maxLength={6}
            autoFocus
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          {verifying ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Edit number
            </button>
            {secondsLeft > 0 ? (
              <span className="text-slate-400">Resend in {secondsLeft}s</span>
            ) : (
              <button
                type="button"
                onClick={() => void sendCode()}
                className="font-medium text-teal-600 transition hover:text-teal-700"
              >
                Resend code
              </button>
            )}
          </div>
        </>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
