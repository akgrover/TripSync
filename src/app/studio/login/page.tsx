"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Loader2, Users } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { setTokens } from "@/lib/studio/auth";
import { GOOGLE_CLIENT_ID } from "@/lib/studio/config";
import type { StudioUser } from "@/lib/studio/types";
import { GoogleSignInButton } from "@/components/studio/google-signin-button";
import { BrandingImage } from "@/components/studio/branding-image";
import { SelfieCapture } from "@/components/studio/selfie-capture";
import { AppStoreButtons } from "@/components/app-store-buttons";

// India-only, like the mobile app: the user types a 10-digit number and we send +91<digits>.
function toE164(local: string): string {
  return `+91${local.replace(/\D/g, "").slice(-10)}`;
}

const RESEND_SECONDS = 30;

// First-time onboarding steps that follow a successful sign-in (phone OTP or Google):
//   name   → pick a display name (only when the account has none yet)
//   role   → "I run events" (photographer) vs "I'm a guest" (only when undeclared & not a host)
//   studio → skippable photographer branding form (business name / phone / logo / cover)
//   guest  → a guest landed on the photographer portal: point them at their album link / the app
type Step = "phone" | "code" | "name" | "role" | "studio" | "guest";

const TITLES: Record<Step, { title: string; subtitle: (ctx: { phone: string }) => string }> = {
  phone: { title: "TripSync Studio", subtitle: () => "Sign in — we'll text you a verification code" },
  code: { title: "TripSync Studio", subtitle: ({ phone }) => `Code sent to +91 ${phone}` },
  name: { title: "What's your name?", subtitle: () => "This is how guests will see you" },
  role: { title: "How will you use TripSync?", subtitle: () => "You can change this anytime" },
  studio: { title: "Set up your studio", subtitle: () => "All optional — you can do this later in Profile" },
  guest: { title: "You're all set", subtitle: () => "Open your album link to see your photos" },
};

export default function StudioLoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  // The just-authenticated user, so the role/branding/selfie steps have someone to attach to.
  const [authedUser, setAuthedUser] = useState<StudioUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingRole, setSavingRole] = useState<null | "photographer" | "guest">(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Photographer setup form.
  const [companyName, setCompanyName] = useState("");
  const [studioPhone, setStudioPhone] = useState("");
  const [savingStudio, setSavingStudio] = useState(false);

  // Guest branch: enter an album code to jump straight into that album.
  const [albumCode, setAlbumCode] = useState("");

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

  // Full-page navigation (not router.replace): StudioShell lives in the shared /studio layout, so a
  // client-side navigation keeps it mounted with its auth state still "out" and the gate bounces us
  // back here. A hard load remounts the shell, which reads the just-set token and lets us in.
  function enterStudio() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see above
    window.location.assign("/studio/");
  }

  // Decide the first onboarding step for a freshly authenticated user. Returning users (name + role
  // already settled) go straight in; guests who somehow reach the portal get the guest branch.
  function routeAfterAuth(u: StudioUser) {
    setAuthedUser(u);
    if (u.needsName) {
      setName("");
      setStep("name");
      return;
    }
    if (u.needsRole) {
      setStep("role");
      return;
    }
    if (u.role === "guest") {
      setStep("guest");
      return;
    }
    enterStudio();
  }

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
      setVerifying(false);
      routeAfterAuth(res.user);
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

  async function handleGoogle(idToken: string) {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await studioApi.oauthLogin("google", idToken);
      setTokens(res);
      setBusy(false);
      routeAfterAuth(res.user);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't sign in with Google. Please try again.",
      );
      setBusy(false);
    }
  }

  async function saveName() {
    const value = name.trim();
    if (value.length < 2 || savingName) {
      if (value.length < 2) {
        setError("Please enter your name.");
      }
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      const res = await studioApi.updateName(value);
      setSavingName(false);
      routeAfterAuth(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your name. Please try again.");
      setSavingName(false);
    }
  }

  async function pickRole(role: "photographer" | "guest") {
    if (savingRole) {
      return;
    }
    setSavingRole(role);
    setError(null);
    try {
      const res = await studioApi.setRole(role);
      setAuthedUser(res.user);
      setSavingRole(null);
      // Photographers get the optional branding form; guests (no event here) get the album prompt.
      setStep(role === "photographer" ? "studio" : "guest");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't continue. Please try again.");
      setSavingRole(null);
    }
  }

  async function saveStudio() {
    if (savingStudio) {
      return;
    }
    setSavingStudio(true);
    setError(null);
    try {
      // Only PATCH the text fields the user actually filled; logo/cover upload in place via
      // BrandingImage. A bad phone throws a 400, surfaced inline (we stay on the form).
      const c = companyName.trim();
      if (c) {
        await studioApi.setCompanyName(c);
      }
      const p = studioPhone.trim();
      if (p) {
        await studioApi.setStudioPhone(p);
      }
      enterStudio();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
      setSavingStudio(false);
    }
  }

  function openAlbum() {
    const clean = albumCode.trim().toUpperCase();
    if (!clean) {
      return;
    }
    window.location.assign(`/album/?code=${encodeURIComponent(clean)}`);
  }

  function onCodeChange(next: string) {
    const digits = next.replace(/\D/g, "").slice(0, 6);
    setError(null);
    setCode(digits);
    if (digits.length === 6) {
      void verify(digits);
    }
  }

  const wide = step === "studio";

  return (
    <div
      className={`animate-rise w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 ${
        wide ? "max-w-md" : "max-w-sm"
      }`}
    >
      <div className="mb-6 text-center">
        <span className="bg-brand mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md">
          <Camera className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">{TITLES[step].title}</h1>
        <p className="mt-1 text-sm text-slate-500">{TITLES[step].subtitle({ phone: phoneDigits })}</p>
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

          {GOOGLE_CLIENT_ID ? (
            <>
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleSignInButton onCredential={(idToken) => void handleGoogle(idToken)} />
            </>
          ) : null}
        </>
      ) : step === "code" ? (
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
      ) : step === "name" ? (
        <>
          <label className="mb-1 block text-sm font-medium text-slate-700">Your name</label>
          <input
            value={name}
            onChange={(e) => {
              setError(null);
              setName(e.target.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && void saveName()}
            placeholder="e.g. Priya Sharma"
            maxLength={80}
            autoFocus
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="button"
            onClick={() => void saveName()}
            disabled={name.trim().length < 2 || savingName}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue
          </button>
        </>
      ) : step === "role" ? (
        <div className="space-y-3">
          <RoleCard
            icon={<Camera className="h-5 w-5" />}
            title="I'm a photographer or event host"
            desc="Upload photos, share albums, and manage your events."
            loading={savingRole === "photographer"}
            disabled={savingRole !== null}
            onClick={() => void pickRole("photographer")}
          />
          <RoleCard
            icon={<Users className="h-5 w-5" />}
            title="I'm a guest"
            desc="I was invited to an event to see and download my photos."
            loading={savingRole === "guest"}
            disabled={savingRole !== null}
            onClick={() => void pickRole("guest")}
          />
        </div>
      ) : step === "studio" ? (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Business name</label>
            <input
              value={companyName}
              onChange={(e) => {
                setError(null);
                setCompanyName(e.target.value);
              }}
              placeholder="e.g. Priya Sharma Photography"
              maxLength={60}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <p className="mt-1.5 text-xs text-slate-400">Shown to guests on your shared albums.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact number</label>
            <input
              value={studioPhone}
              onChange={(e) => {
                setError(null);
                setStudioPhone(e.target.value);
              }}
              inputMode="tel"
              placeholder="e.g. +91 98765 43210"
              maxLength={20}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Guests use this to reach you (Call / WhatsApp). Not your login number.
            </p>
          </div>

          <BrandingImage
            kind="logo"
            label="Logo"
            hint="PNG, JPEG, or WebP · up to 2 MB."
            currentUrl={authedUser?.logoUrl}
            onUpdated={setAuthedUser}
          />
          <BrandingImage
            kind="cover"
            label="Cover photo"
            hint="A banner for your album header · up to 6 MB."
            currentUrl={authedUser?.coverUrl}
            onUpdated={setAuthedUser}
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={enterStudio}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => void saveStudio()}
              disabled={savingStudio}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {savingStudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save & continue
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            You can change all of this later in Profile → Studio.
          </p>
        </div>
      ) : (
        // guest
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Add a selfie <span className="font-normal text-slate-400">— optional</span>
            </p>
            <p className="mb-3 text-xs text-slate-400">
              So TripSync can automatically find the photos you&apos;re in.
            </p>
            <SelfieCapture user={authedUser} onUpdated={setAuthedUser} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Have an album code?</label>
            <div className="flex items-center gap-2">
              <input
                value={albumCode}
                onChange={(e) => setAlbumCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && openAlbum()}
                placeholder="e.g. JJJNQQ"
                maxLength={12}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase tracking-wide text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={openAlbum}
                disabled={albumCode.trim().length === 0}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                View
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Or just open the album link your photographer shared with you.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="mb-2 text-xs text-slate-400">Get the full experience in the app</p>
            <div className="flex justify-center">
              <AppStoreButtons />
            </div>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

// A selectable card for the role step.
function RoleCard({
  icon,
  title,
  desc,
  loading,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-400 hover:bg-teal-50/40 disabled:opacity-60"
    >
      <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{desc}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-teal-500" />
    </button>
  );
}
