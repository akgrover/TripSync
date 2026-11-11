"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { setCachedMe } from "@/lib/studio/profile";
import { GOOGLE_CLIENT_ID } from "@/lib/studio/config";
import type { StudioUser } from "@/lib/studio/types";
import { GoogleSignInButton } from "@/components/studio/google-signin-button";
import { SelfieCapture } from "@/components/studio/selfie-capture";
import { BrandingImage } from "@/components/studio/branding-image";

export default function StudioProfilePage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [user, setUser] = useState<StudioUser | null>(null);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [company, setCompany] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

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

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <p className="mt-1 text-slate-500">Your account, face profile, and photographer branding.</p>

      {/* Account */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Account</h2>
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={name.trim().length < 2 || savingName || name.trim() === user?.name}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : nameSaved ? <Check className="h-4 w-4" /> : null}
                Save
              </button>
            </div>
          </div>
          {user?.phone ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">{user.phone}</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Face profile */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Face profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A selfie TripSync matches against event photos to find the ones you&apos;re in. Stored
            privately and only used for matching.
          </p>
        </div>
        <div className="p-5">
          <SelfieCapture user={user} onUpdated={applyUser} />
        </div>
      </section>

      {/* Photographer profile */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Photographer profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Optional. Used to brand the pages and posters you share with guests.
          </p>
        </div>
        <div className="space-y-5 p-5">
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
                placeholder="e.g. AK Photography"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={() => void saveCompany()}
                disabled={savingCompany || !companyDirty}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : companySaved ? <Check className="h-4 w-4" /> : null}
                Save
              </button>
            </div>
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

      {/* Sign-in methods */}
      {GOOGLE_CLIENT_ID ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Sign-in methods</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Connect another way to sign in so you&apos;re never locked out.
            </p>
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
  );
}
