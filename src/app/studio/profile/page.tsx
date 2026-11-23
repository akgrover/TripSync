"use client";

import { useEffect, useState } from "react";
import { Building2, Check, Fingerprint, Link2, Loader2, Sparkles, UserRound } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { setCachedMe } from "@/lib/studio/profile";
import { GOOGLE_CLIENT_ID } from "@/lib/studio/config";
import type { StudioUser } from "@/lib/studio/types";
import { GoogleSignInButton } from "@/components/studio/google-signin-button";
import { SelfieCapture } from "@/components/studio/selfie-capture";
import { BrandingImage } from "@/components/studio/branding-image";
import { BrandingPreview } from "@/components/studio/branding-preview";
import { SaveButton } from "@/components/studio/save-button";

type ProfileTab = "personal" | "studio";

export default function StudioProfilePage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [user, setUser] = useState<StudioUser | null>(null);
  const [tab, setTab] = useState<ProfileTab>("personal");

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [company, setCompany] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  const [studioPhone, setStudioPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Any child mutation (selfie / branding) hands back the refreshed user — keep local + shared cache
  // (sidebar name/avatar) in sync.
  function applyUser(next: StudioUser) {
    setUser(next);
    setCachedMe(next);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getMe();
        if (!active) return;
        setUser(res.user);
        setName(res.user.name ?? "");
        setCompany(res.user.companyName ?? "");
        setStudioPhone(res.user.studioPhone ?? "");
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

  async function saveName() {
    const value = name.trim();
    if (value.length < 2 || savingName) {
      return;
    }
    setSavingName(true);
    setNameSaved(false);
    try {
      const res = await studioApi.updateName(value);
      applyUser(res.user);
      setNameSaved(true);
    } catch {
      // Leave the field as-is; the server value reloads on next visit.
    } finally {
      setSavingName(false);
    }
  }

  async function saveCompany() {
    if (savingCompany) {
      return;
    }
    const value = company.trim();
    setSavingCompany(true);
    setCompanySaved(false);
    try {
      const res = await studioApi.setCompanyName(value.length ? value : null);
      applyUser(res.user);
      setCompanySaved(true);
    } catch {
      // no-op
    } finally {
      setSavingCompany(false);
    }
  }

  async function saveStudioPhone() {
    if (savingPhone) {
      return;
    }
    const value = studioPhone.trim();
    // Client-side guard so an obviously-wrong number never round-trips; the API does the real
    // normalization and has the final say (its error is surfaced inline below).
    const digitCount = value.replace(/\D/g, "").length;
    if (value.length > 0 && (digitCount < 8 || digitCount > 15)) {
      setPhoneError("Enter a valid phone number with country code, e.g. +91 98765 43210.");
      return;
    }
    setSavingPhone(true);
    setPhoneSaved(false);
    setPhoneError(null);
    try {
      const res = await studioApi.setStudioPhone(value.length ? value : null);
      applyUser(res.user);
      setStudioPhone(res.user.studioPhone ?? "");
      setPhoneSaved(true);
    } catch (err) {
      setPhoneError(
        err instanceof ApiError ? err.message : "Couldn't save that number. Please try again.",
      );
    } finally {
      setSavingPhone(false);
    }
  }

  async function linkGoogle(idToken: string) {
    if (linking) {
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      const res = await studioApi.linkGoogle(idToken);
      applyUser(res.user);
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.message : "Couldn't connect Google. Please try again.");
    } finally {
      setLinking(false);
    }
  }

  if (status === "loading") {
    return <p className="text-slate-400">Loading…</p>;
  }
  if (status === "error") {
    return (
      <button type="button" onClick={() => window.location.reload()} className="text-red-600">
        Couldn&apos;t load your profile. Retry.
      </button>
    );
  }

  const companyDirty = company.trim() !== (user?.companyName ?? "");
  const phoneDirty = studioPhone.trim() !== (user?.studioPhone ?? "");

  return (
    <div>
      <header className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          <Sparkles className="h-3.5 w-3.5" />
          Identity &amp; brand
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">Profile</h1>
        <p className="mt-2 text-base leading-7 text-slate-500">
          Manage how you sign in, how TripSync finds you, and how clients see your studio.
        </p>
      </header>

      {/* Personal vs Studio — your identity and account on one tab, guest-facing branding on the other. */}
      <div className="mt-8 inline-flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Profile sections">
        {([
          { id: "personal", label: "Personal", icon: UserRound },
          { id: "studio", label: "Studio brand", icon: Building2 },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "personal" ? (
        <div className="mt-7 grid items-start gap-5 lg:grid-cols-2">
          {/* Account */}
          <section className="shadow-card overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">Account details</h2>
                <p className="mt-0.5 text-sm text-slate-500">Your private TripSync identity.</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => {
                      setNameSaved(false);
                      setName(e.target.value);
                    }}
                    maxLength={80}
                    className="studio-input"
                  />
                  <SaveButton
                    dirty={name.trim().length >= 2 && name.trim() !== (user?.name ?? "")}
                    saving={savingName}
                    saved={nameSaved}
                    onClick={() => void saveName()}
                  />
                </div>
              </div>
              {user?.phone ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-500">{user.phone}</p>
                </div>
              ) : null}
            </div>
          </section>

          {/* Face profile */}
          <section className="shadow-card overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Fingerprint className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">Face profile</h2>
                <p className="mt-0.5 text-sm text-slate-500">Private matching profile for finding your photos.</p>
              </div>
            </div>
            <div className="p-5">
              <SelfieCapture user={user} onUpdated={applyUser} />
            </div>
          </section>

          {/* Sign-in methods */}
          {GOOGLE_CLIENT_ID ? (
            <section className="shadow-card overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white lg:col-span-2">
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Link2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-950">Sign-in methods</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Keep a second way into your account.</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">Google</p>
                    <p className="text-xs text-slate-500">
                      {user?.linkedMethods?.google ? (user.email ?? "Connected") : "Not connected"}
                    </p>
                  </div>
                  {user?.linkedMethods?.google ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                      <Check className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  ) : linking ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting…
                    </span>
                  ) : (
                    <GoogleSignInButton
                      text="signin_with"
                      width={220}
                      onCredential={(idToken) => void linkGoogle(idToken)}
                    />
                  )}
                </div>
                {linkError ? <p className="mt-3 text-sm text-red-600">{linkError}</p> : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* Studio branding form */}
          <section className="shadow-card overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">Studio identity</h2>
                <p className="mt-0.5 text-sm text-slate-500">Shown on albums, payment pages, and share posters.</p>
              </div>
            </div>
            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Company / studio name</label>
                <div className="flex gap-2">
                  <input
                    value={company}
                    onChange={(e) => {
                      setCompanySaved(false);
                      setCompany(e.target.value);
                    }}
                    maxLength={60}
                    placeholder="e.g. Lumina Studio"
                    className="studio-input"
                  />
                  <SaveButton
                    dirty={companyDirty}
                    saving={savingCompany}
                    saved={companySaved}
                    onClick={() => void saveCompany()}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Studio phone</label>
                <div className="flex gap-2">
                  <input
                    value={studioPhone}
                    onChange={(e) => {
                      setPhoneSaved(false);
                      setPhoneError(null);
                      setStudioPhone(e.target.value);
                    }}
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    placeholder="+91 98765 43210"
                    className="studio-input"
                  />
                  <SaveButton
                    dirty={phoneDirty}
                    saving={savingPhone}
                    saved={phoneSaved}
                    onClick={() => void saveStudioPhone()}
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    Shown to guests so they can contact you. Not your login number.
                  </p>
                )}
              </div>

              <BrandingImage
                kind="logo"
                label="Logo"
                hint="Square works best — around 512×512px. PNG, JPEG, or WebP, up to 2 MB."
                currentUrl={user?.logoUrl}
                onUpdated={applyUser}
              />
              <BrandingImage
                kind="cover"
                label="Cover photo"
                hint="Wide banner — around 1600×600px. PNG, JPEG, or WebP, up to 6 MB."
                currentUrl={user?.coverUrl}
                onUpdated={applyUser}
              />
            </div>
          </section>

          {/* Live preview on the right (sticky on desktop) — mirrors the guest album / pay page, so
              the form has room to breathe and the right-hand space is put to use. */}
          <div className="xl:sticky xl:top-6">
            <BrandingPreview
              companyName={company}
              studioPhone={studioPhone}
              logoUrl={user?.logoUrl}
              coverUrl={user?.coverUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
}
