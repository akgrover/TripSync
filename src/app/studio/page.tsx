"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FolderPlus, Loader2, LogIn, RefreshCw, Search, ShieldCheck, Sparkles } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "owned" | "shared">("all");

  // Events this user co-manages (promoted to "Owner") but doesn't own. Drives the welcome banner so a
  // co-manager who just signed in understands why these events are here and what they can do.
  const managedCount = useMemo(
    () => trips.filter((trip) => trip.canManage && !trip.isOwner).length,
    [trips],
  );

  const filteredTrips = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return trips.filter((trip) => {
      const matchesView =
        view === "all" || (view === "owned" ? trip.isOwner : !trip.isOwner);
      const matchesQuery =
        !needle ||
        trip.title.toLowerCase().includes(needle) ||
        trip.inviteCode?.toLowerCase().includes(needle);
      return matchesView && matchesQuery;
    });
  }, [query, trips, view]);

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
      <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Sparkles className="h-3.5 w-3.5" />
            Studio overview
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}` : "Your groups"}
          </h1>
          <p className="mt-2 max-w-xl text-base leading-7 text-slate-500">
            Keep every event moving—from first upload to final delivery.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDialogError(null);
              setCreateOpen(true);
            }}
            className="bg-brand inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(13,148,136,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-14px_rgba(13,148,136,0.95)]"
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <LogIn className="h-4 w-4" />
            Join by code
          </button>
        </div>
      </header>

      {status === "ready" && managedCount > 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-200/70 bg-teal-50/70 p-4 sm:p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 ring-1 ring-teal-200/60">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              You&apos;re an owner of {managedCount} {managedCount === 1 ? "event" : "events"}
            </p>
            <p className="mt-0.5 text-sm leading-6 text-slate-600">
              You can manage photos, members, and renewal for {managedCount === 1 ? "it" : "them"} —
              open {managedCount === 1 ? "it" : "any event"} below to get started.
            </p>
          </div>
        </div>
      ) : null}

      {status === "ready" ? <StudioStats trips={trips} /> : null}

      <section className="mt-10" aria-labelledby="events-heading">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="events-heading" className="text-xl font-bold tracking-tight text-slate-950">
              Events &amp; shared groups
            </h2>
            <p className="mt-1 text-sm text-slate-500">Open an event to upload, share, and manage delivery.</p>
          </div>
          {trips.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {([
                  ["all", "All"],
                  ["owned", "My events"],
                  ["shared", "Shared"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    aria-pressed={view === id}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      view === id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="relative block">
                <span className="sr-only">Search events</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search events"
                  className="min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-52"
                />
              </label>
            </div>
          ) : null}
        </div>
        {status === "loading" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="shadow-card overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white"
              >
                <div className="skeleton aspect-[16/10] w-full" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
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
          <div className="shadow-card flex flex-col items-center rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-10 text-center sm:p-14">
            <span className="bg-brand mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm">
              <FolderPlus className="h-7 w-7" />
            </span>
            <p className="text-lg font-semibold text-slate-900">Create your first event</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Set up an event group, upload your photos, and share one link — guests get the shots
              they&apos;re in.
            </p>
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setDialogError(null);
                setCreateOpen(true);
              }}
              className="bg-brand mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <FolderPlus className="h-4 w-4" />
              Create group
            </button>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <Search className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">No matching events</p>
            <p className="mt-1 text-sm text-slate-500">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-5">
            {filteredTrips.map((trip) => (
              <GroupCard key={trip.id} trip={trip} onOpen={() => openGroup(trip.id)} />
            ))}
          </div>
        )}
      </section>

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
