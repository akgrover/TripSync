"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  CircleAlert,
  Images,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

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

const TITLES: Record<Step, { eyebrow: string; title: string; subtitle: (ctx: { phone: string }) => string }> = {
  phone: {
    eyebrow: "Welcome to TripSync",
    title: "Sign in to your studio",
    subtitle: () => "Use your phone number or Google account to continue.",
  },
  code: {
    eyebrow: "Secure verification",
    title: "Check your messages",
    subtitle: ({ phone }) => `Enter the 6-digit code sent to +91 ${phone}.`,
  },
  name: {
    eyebrow: "Create your profile",
    title: "What should we call you?",
    subtitle: () => "Use the name clients and event guests will recognise.",
  },
  role: {
    eyebrow: "Personalise your workspace",
    title: "How will you use TripSync?",
    subtitle: () => "Choose the experience that fits you best. You can change this later.",
  },
  studio: {
    eyebrow: "Make it yours",
    title: "Set up your studio",
    subtitle: () => "Add the details guests will see on albums and delivery pages.",
  },
  guest: {
    eyebrow: "One last step",
    title: "Find your photos faster",
    subtitle: () => "Add a private face profile, then open the album shared with you.",
  },
};

const STEP_META: Record<Step, { label: string; progress: number }> = {
  phone: { label: "Sign in", progress: 1 },
  code: { label: "Verify", progress: 2 },
  name: { label: "Your profile", progress: 2 },
  role: { label: "Your path", progress: 3 },
  studio: { label: "Studio details", progress: 4 },
  guest: { label: "Photo matching", progress: 4 },
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

  // Refer & Earn: an optional code captured on the role step (sign-up only). Prefilled from a
  // ?ref=CODE share link. `referralNote` surfaces a gentle rejection message.
  const [referralCode, setReferralCode] = useState("");
  const [referralNote, setReferralNote] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "").slice(-10);
  const phoneValid = phoneDigits.length === 10;

  // Prefill the referral code from ?ref= on a share link (sanitised to the code alphabet).
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the share-link param
      setReferralCode(ref.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 12));
    }
  }, []);

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
    window.location.replace("/studio/");
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
      // A guest-role account that owns or co-manages a group (a promoted "Owner") belongs in Studio,
      // where its managed events are listed. A plain guest (no managed group) gets the album branch.
      if (u.managesEvents) {
        enterStudio();
      } else {
        setStep("guest");
      }
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
      // Attach the referrer BEFORE locking the role — the server accepts a code only pre-role. A code
      // that's simply wrong (not found / your own) stops here so the user can fix or clear it; any
      // other outcome (applied, or a network hiccup) never blocks sign-up.
      const code = referralCode.trim();
      if (code) {
        setReferralNote(null);
        try {
          const result = await studioApi.applyReferral(code);
          if (!result.applied) {
            const note = referralRejectionNote(result.reason);
            if (note) {
              setReferralNote(note);
              setSavingRole(null);
              return;
            }
          }
        } catch {
          // Don't block onboarding on a referral hiccup — proceed to set the role.
        }
      }
      const res = await studioApi.setRole(role);
      setAuthedUser(res.user);
      setSavingRole(null);
      // Photographers get the optional branding form. A guest who already co-manages a group goes
      // straight into Studio (its managed events are there); a plain guest gets the album prompt.
      if (role === "photographer") {
        setStep("studio");
      } else if (res.user.managesEvents) {
        enterStudio();
      } else {
        setStep("guest");
      }
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
    // Full load (not router.push) so the album route mounts fresh with the just-set auth, same as
    // enterStudio above.
    window.location.replace(`/album/?code=${encodeURIComponent(clean)}`);
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
  const cardWidth = wide ? "max-w-3xl" : step === "guest" ? "max-w-xl" : "max-w-lg";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(22rem,0.86fr)_minmax(38rem,1.14fr)]">
      <aside className="studio-onboarding-panel relative hidden min-h-dvh overflow-hidden p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-900 shadow-xl shadow-black/10">
            <Camera className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight">TripSync</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/55">Studio</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-teal-50/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Made for photographers and their guests
          </span>
          <h2 className="mt-6 max-w-lg text-4xl font-bold leading-[1.08] tracking-[-0.035em] xl:text-5xl">
            Every photo finds the right person.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-teal-50/65">
            Create an event, share one link, and let TripSync handle private photo matching and delivery.
          </p>

          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <OnboardingBenefit icon={<Images className="h-4 w-4" />} label="Fast delivery" />
            <OnboardingBenefit icon={<UserRound className="h-4 w-4" />} label="Face matching" />
            <OnboardingBenefit icon={<ShieldCheck className="h-4 w-4" />} label="Private by design" />
          </div>

          <div className="relative mt-12 h-44 max-w-lg">
            <div className="absolute left-0 top-6 w-[72%] rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-xl bg-teal-300/20" />
                  <div>
                    <span className="block h-2 w-24 rounded-full bg-white/75" />
                    <span className="mt-2 block h-1.5 w-16 rounded-full bg-white/25" />
                  </div>
                </div>
                <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-[10px] font-semibold text-emerald-100">
                  Delivered
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <span className="h-16 rounded-xl bg-gradient-to-br from-amber-200/50 to-rose-300/20" />
                <span className="h-16 rounded-xl bg-gradient-to-br from-sky-200/45 to-indigo-300/20" />
                <span className="h-16 rounded-xl bg-gradient-to-br from-teal-200/50 to-emerald-300/20" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-[42%] rounded-2xl border border-white/15 bg-[#062f2e]/80 p-4 shadow-2xl backdrop-blur-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-300 text-teal-950">
                <Check className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-semibold">Photos matched</p>
              <p className="mt-1 text-xs text-teal-100/50">Ready for your guests</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 flex items-center gap-2 text-xs text-teal-100/45">
          <LockKeyhole className="h-3.5 w-3.5" />
          Your photos and identity stay protected.
        </p>
      </aside>

      <main className="relative flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:px-10 lg:py-12 xl:px-16">
        <div className={`w-full ${cardWidth}`}>
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md shadow-teal-900/15">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold tracking-tight text-slate-950">TripSync</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Studio</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Secure sign-in
            </span>
          </div>

          <OnboardingProgress step={step} />

          <section className="animate-rise overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_28px_80px_-36px_rgba(15,23,42,0.32)]">
            <div className={`border-b border-slate-100 ${wide ? "px-5 py-6 sm:px-8" : "px-5 py-6 sm:px-7 sm:py-7"}`}>
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <StepIcon step={step} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{TITLES[step].eyebrow}</p>
                  <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-[1.7rem]">
                    {TITLES[step].title}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    {TITLES[step].subtitle({ phone: phoneDigits })}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${wide ? "p-5 sm:p-8" : "p-5 sm:p-7"}`}>
              {error ? (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {step === "phone" ? (
                <>
                  <label htmlFor="login-phone" className="mb-2 block text-sm font-semibold text-slate-800">Phone number</label>
                  <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
                    <span className="border-r border-slate-200 px-3.5 text-sm font-semibold text-slate-600">+91</span>
                    <input
                      id="login-phone"
                      value={phoneDigits}
                      onChange={(e) => {
                        setError(null);
                        setPhone(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && void sendCode()}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="90000 00000"
                      maxLength={10}
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-base text-slate-950 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">We&apos;ll send a one-time code. Standard SMS rates may apply.</p>
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    disabled={!phoneValid || busy}
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    {busy ? "Sending code…" : "Continue with phone"}
                  </button>

                  {GOOGLE_CLIENT_ID ? (
                    <>
                      <div className="my-5 flex items-center gap-3">
                        <span className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-medium text-slate-400">or continue with</span>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                      <GoogleSignInButton onCredential={(idToken) => void handleGoogle(idToken)} />
                    </>
                  ) : null}
                </>
              ) : step === "code" ? (
                <>
                  <label htmlFor="login-code" className="mb-2 block text-sm font-semibold text-slate-800">Verification code</label>
                  <input
                    id="login-code"
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.42em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                  <div className="mt-4 flex min-h-6 items-center justify-between gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setCode("");
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Change number
                    </button>
                    {verifying ? (
                      <span className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</span>
                    ) : secondsLeft > 0 ? (
                      <span className="text-slate-400">Resend in {secondsLeft}s</span>
                    ) : (
                      <button type="button" onClick={() => void sendCode()} className="font-semibold text-teal-700 transition hover:text-teal-800">
                        Resend code
                      </button>
                    )}
                  </div>
                </>
              ) : step === "name" ? (
                <>
                  <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-slate-800">Full name</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => {
                      setError(null);
                      setName(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && void saveName()}
                    autoComplete="name"
                    placeholder="e.g. Priya Sharma"
                    maxLength={80}
                    autoFocus
                    className="studio-input !min-h-12 !px-4 !text-base"
                  />
                  <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Guest preview</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 font-bold text-teal-800">
                        {(name.trim()[0] ?? "P").toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{name.trim() || "Your name"}</p>
                        <p className="text-xs text-slate-500">Event host</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveName()}
                    disabled={name.trim().length < 2 || savingName}
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {savingName ? "Saving…" : "Save and continue"}
                  </button>
                </>
              ) : step === "role" ? (
                <div className="space-y-3">
                  <RoleCard
                    icon={<Camera className="h-5 w-5" />}
                    title="Photographer or event host"
                    desc="Create events, upload photos, deliver albums, and manage your studio."
                    badge="Studio workspace"
                    loading={savingRole === "photographer"}
                    disabled={savingRole !== null}
                    onClick={() => void pickRole("photographer")}
                  />
                  <RoleCard
                    icon={<Users className="h-5 w-5" />}
                    title="Guest"
                    desc="Find, view, and download the photos shared with you."
                    badge="Guest experience"
                    loading={savingRole === "guest"}
                    disabled={savingRole !== null}
                    onClick={() => void pickRole("guest")}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <label htmlFor="referral-code" className="block text-sm font-semibold text-slate-800">
                      Referral code <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="referral-code"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralNote(null);
                        setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 12));
                      }}
                      disabled={savingRole !== null}
                      placeholder="Have a code? Enter it"
                      className="studio-input mt-2 !min-h-11 uppercase tracking-[0.14em] disabled:opacity-60"
                    />
                    {referralNote ? (
                      <p className="mt-2 text-sm text-amber-700">{referralNote}</p>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Credits the photographer who invited you. Can only be added now, during sign-up.
                      </p>
                    )}
                  </div>
                </div>
              ) : step === "studio" ? (
                <div className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="company-name" className="mb-2 block text-sm font-semibold text-slate-800">Business name</label>
                      <input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => {
                          setError(null);
                          setCompanyName(e.target.value);
                        }}
                        autoComplete="organization"
                        placeholder="Priya Sharma Photography"
                        maxLength={60}
                        className="studio-input !min-h-12"
                      />
                      <p className="mt-2 text-xs leading-5 text-slate-400">Displayed on albums and payment pages.</p>
                    </div>
                    <div>
                      <label htmlFor="studio-phone" className="mb-2 block text-sm font-semibold text-slate-800">Business phone</label>
                      <input
                        id="studio-phone"
                        value={studioPhone}
                        onChange={(e) => {
                          setError(null);
                          setStudioPhone(e.target.value);
                        }}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        maxLength={20}
                        className="studio-input !min-h-12"
                      />
                      <p className="mt-2 text-xs leading-5 text-slate-400">Used for guest calls and WhatsApp.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3.5">
                    <p className="flex items-start gap-2 text-sm leading-6 text-teal-900">
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-teal-700" />
                      Brand uploads are optional. Add them now for a polished guest experience, or finish them later from Profile.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <BrandingImage
                      kind="logo"
                      label="Studio logo"
                      hint="Square works best · PNG, JPEG, or WebP · up to 2 MB."
                      currentUrl={authedUser?.logoUrl}
                      onUpdated={setAuthedUser}
                    />
                    <BrandingImage
                      kind="cover"
                      label="Album cover"
                      hint="A wide banner for album headers · up to 6 MB."
                      currentUrl={authedUser?.coverUrl}
                      onUpdated={setAuthedUser}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={enterStudio} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveStudio()}
                      disabled={savingStudio}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
                    >
                      {savingStudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {savingStudio ? "Saving…" : "Finish setup"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Your private face profile</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Use a clear, front-facing selfie with only you in the frame.</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">Optional</span>
                    </div>
                    <SelfieCapture user={authedUser} onUpdated={setAuthedUser} />
                  </div>

                  <div>
                    <label htmlFor="album-code" className="mb-2 block text-sm font-semibold text-slate-800">Open an album</label>
                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <input
                        id="album-code"
                        value={albumCode}
                        onChange={(e) => setAlbumCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && openAlbum()}
                        placeholder="Enter invite code"
                        maxLength={12}
                        className="studio-input !min-h-12 uppercase tracking-[0.14em]"
                      />
                      <button
                        type="button"
                        onClick={openAlbum}
                        disabled={albumCode.trim().length === 0}
                        className="min-h-12 shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        Open album
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">You can also open the private link your photographer sent you.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-5 text-center">
                    <p className="mb-3 text-xs font-medium text-slate-400">Prefer the TripSync mobile app?</p>
                    <div className="flex justify-center"><AppStoreButtons /></div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to use TripSync responsibly and respect guest privacy.
          </p>
        </div>
      </main>
    </div>
  );
}

// A gentle, actionable note for a rejected referral code. Returns null for outcomes the user can't
// act on (already set / locked), so onboarding just proceeds in those cases.
function referralRejectionNote(reason?: string): string | null {
  if (reason === "not_found") {
    return "That referral code wasn't found. Check it, or clear it to continue.";
  }
  if (reason === "self") {
    return "You can't use your own referral code.";
  }
  return null;
}

function OnboardingProgress({ step }: { step: Step }) {
  const { label, progress } = STEP_META[step];
  const percent = `${(progress / 4) * 100}%`;

  return (
    <div className="mb-4 px-1 sm:mb-5">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400">Step {progress} of 4</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-[width] duration-500"
          style={{ width: percent }}
        />
      </div>
    </div>
  );
}

function StepIcon({ step }: { step: Step }) {
  if (step === "phone") return <LockKeyhole className="h-5 w-5" />;
  if (step === "code") return <KeyRound className="h-5 w-5" />;
  if (step === "name") return <UserRound className="h-5 w-5" />;
  if (step === "role") return <Users className="h-5 w-5" />;
  if (step === "studio") return <Building2 className="h-5 w-5" />;
  return <Sparkles className="h-5 w-5" />;
}

function OnboardingBenefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/7 px-3 py-2.5 text-xs font-semibold text-teal-50/75 backdrop-blur-sm">
      <span className="text-teal-200">{icon}</span>
      {label}
    </div>
  );
}

// A selectable card for the role step.
function RoleCard({
  icon,
  title,
  desc,
  badge,
  loading,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-sm disabled:opacity-60 sm:p-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800 ring-1 ring-teal-200/60 transition group-hover:bg-teal-700 group-hover:text-white">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {badge}
        </span>
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{desc}</span>
      </span>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
        <span className="h-2 w-2 rounded-full bg-slate-200 transition group-hover:bg-teal-500" />
      </span>
    </button>
  );
}
