"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderPlus, Loader2, LogIn, RefreshCw } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { firstNameOf, getCachedMe } from "@/lib/studio/profile";
import type { StudioTrip } from "@/lib/studio/types";
import { Dialog } from "@/components/studio/dialog";
import { GroupCard } from "@/components/studio/group-card";
import { StudioStats } from "@/components/studio/studio-stats";

export default function StudioHomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [trips, setTrips] = useState<StudioTrip[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    let active = true;
    void getCachedMe()
      .then((user) => {
        if (active) setFirstName(firstNameOf(user.name));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getTrips();
        if (!active) return;
        setTrips(res.trips);
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

  function openGroup(id: string) {
    router.push(`/studio/group?id=${id}`);
  }

  async function handleCreate() {
    const name = title.trim();
    if (name.length < 3) {
      setDialogError("Give the group a name (at least 3 characters).");
      return;
    }
    setBusy(true);
    setDialogError(null);
    try {
      const res = await studioApi.createEventGroup(name);
      openGroup(res.trip.id);
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : "Couldn't create the group. Try again.");
      setBusy(false);
    }
  }

  async function handleJoin() {
    const value = code.trim().toUpperCase();
    if (value.length < 5) {
      setDialogError("Enter the full invite code.");
      return;
    }
    setBusy(true);
    setDialogError(null);
    try {
      const res = await studioApi.joinGroup(value);
      openGroup(res.trip.id);
    } catch (err) {
      setDialogError(
        err instanceof ApiError ? err.message : "Couldn't join. Check the code and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {firstName ? `Welcome back, ${firstName}` : "Your groups"}
          </h1>
          <p className="mt-1 text-slate-500">Create an event group or join one, then upload photos.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDialogError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <FolderPlus className="h-4 w-4" />
            Create group
          </button>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setDialogError(null);
              setJoinOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogIn className="h-4 w-4" />
            Join by code
          </button>
        </div>
      </div>

      {status === "ready" ? <StudioStats trips={trips} /> : null}

      <div className="mt-8">
        {status === "loading" ? (
          <p className="text-slate-400">Loading…</p>
        ) : status === "error" ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-red-600"
          >
            <RefreshCw className="h-4 w-4" />
            Couldn&apos;t load your groups. Retry.
          </button>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium text-slate-900">No groups yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create an event group to start uploading photos.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <GroupCard key={trip.id} trip={trip} onOpen={() => openGroup(trip.id)} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onClose={() => !busy && setCreateOpen(false)} title="Create event group">
        <label className="mb-1 block text-sm font-medium text-slate-700">Group name</label>
        <input
          value={title}
          onChange={(e) => {
            setDialogError(null);
            setTitle(e.target.value);
          }}
          placeholder="e.g. Sharma Wedding"
          maxLength={120}
          autoFocus
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        {dialogError ? <p className="mt-2 text-sm text-red-600">{dialogError}</p> : null}
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create group
        </button>
      </Dialog>

      <Dialog open={joinOpen} onClose={() => !busy && setJoinOpen(false)} title="Join a group">
        <label className="mb-1 block text-sm font-medium text-slate-700">Invite code</label>
        <input
          value={code}
          onChange={(e) => {
            setDialogError(null);
            setCode(e.target.value.toUpperCase());
          }}
          placeholder="e.g. DPTGAL"
          maxLength={10}
          autoFocus
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase tracking-wider text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        {dialogError ? <p className="mt-2 text-sm text-red-600">{dialogError}</p> : null}
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Join group
        </button>
      </Dialog>
    </div>
  );
}
