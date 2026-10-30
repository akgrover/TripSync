"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Folder, FolderPlus, Loader2, Lock, Settings, Users } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { joinLink } from "@/lib/studio/config";
import { getCachedMe } from "@/lib/studio/profile";
import type { StudioTrip } from "@/lib/studio/types";
import { CopyButton } from "@/components/studio/copy-button";
import { Dialog } from "@/components/studio/dialog";
import { SlideOver } from "@/components/studio/slide-over";
import { GroupSettings } from "@/components/studio/group-settings";
import { MemberAccess } from "@/components/studio/member-access";
import { UploadPanel } from "@/components/studio/upload-panel";
import { PhotoGrid } from "@/components/studio/photo-grid";

function folderChipClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
  }`;
}

// Dynamic group id comes via ?id= (not a [id] segment) so the page stays statically exportable.
function GroupDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const folderParam = searchParams.get("folder");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [trip, setTrip] = useState<StudioTrip | null>(null);
  const [reload, setReload] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  // Whether this owner's plan includes watermarking. Defaults to true (shown) and only hides when the
  // entitlement is explicitly false, so an older /me payload never wrongly hides the controls.
  const [canWatermark, setCanWatermark] = useState(true);

  useEffect(() => {
    let active = true;
    void getCachedMe()
      .then((user) => {
        if (active) setCanWatermark(user.entitlements?.features?.watermark !== false);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // The folder currently being viewed, resolved from the URL against the loaded trip. A missing or
  // stale/unknown `?folder=` falls back to "All photos" (null) rather than showing nothing.
  const currentFolder = folderParam ? trip?.folders?.find((f) => f.id === folderParam) ?? null : null;

  // Refetch the grid once, when a whole upload completes. (Thumbnails that aren't ready yet show a
  // placeholder; the grid's Refresh button pulls them in on demand — no background polling.)
  function handleUploaded() {
    setReload((n) => n + 1);
  }

  // Folder navigation lives in the URL (?folder=…) so browser back/forward and refresh just work.
  function selectFolder(folderId: string | null) {
    if (!id) {
      return;
    }
    router.push(folderId ? `/studio/group?id=${id}&folder=${folderId}` : `/studio/group?id=${id}`);
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!trip || name.length < 1 || creatingFolder) {
      return;
    }
    setCreatingFolder(true);
    setFolderError(null);
    // Snapshot the current folder ids so we can identify the new one by diff (not by position —
    // the server's ordering isn't guaranteed), falling back to the last folder if the diff is empty.
    const priorIds = new Set((trip.folders ?? []).map((f) => f.id));
    try {
      const res = await studioApi.createFolder(trip.id, name);
      setTrip(res.trip);
      setCreateOpen(false);
      setNewFolderName("");
      // Jump straight into the just-created folder so the host can upload into it.
      const folders = res.trip.folders ?? [];
      const created = folders.find((f) => !priorIds.has(f.id)) ?? folders[folders.length - 1];
      if (created) {
        router.push(`/studio/group?id=${trip.id}&folder=${created.id}`);
      }
    } catch (err) {
      setFolderError(err instanceof ApiError ? err.message : "Couldn't create the folder. Try again.");
    } finally {
      setCreatingFolder(false);
    }
  }

  useEffect(() => {
    if (!id) {
      return;
    }
    let active = true;
    void (async () => {
      try {
        // No single-trip endpoint yet; find it in the user's list (fine for the stub).
        const res = await studioApi.getTrips();
        if (!active) return;
        setTrip(res.trips.find((t) => t.id === id) ?? null);
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
  }, [id]);

  return (
    <div>
      <Link
        href="/studio"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All groups
      </Link>

      {!id ? (
        <p className="mt-6 text-slate-500">No group selected.</p>
      ) : status === "loading" ? (
        <p className="mt-6 text-slate-400">Loading…</p>
      ) : status === "error" ? (
        <p className="mt-6 text-red-600">Couldn&apos;t load this group. Please retry.</p>
      ) : !trip ? (
        <p className="mt-6 text-slate-500">This group couldn&apos;t be found.</p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{trip.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {trip.inviteCode ? <CopyButton value={joinLink(trip.inviteCode)} label="Copy invite link" /> : null}
              {trip.isOwner && canWatermark && trip.watermark?.enabled ? (
                <button
                  type="button"
                  onClick={() => setGuestOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Users className="h-4 w-4" />
                  Guest access
                </button>
              ) : null}
              {trip.isOwner ? (
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              ) : null}
            </div>
          </div>
          {trip.inviteCode ? (
            <p className="mt-1 text-sm text-slate-500">
              Invite code <code className="rounded bg-slate-100 px-1.5 py-0.5">{trip.inviteCode}</code> — share
              the link so people can join in the app.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => selectFolder(null)} className={folderChipClass(!currentFolder)}>
              All photos
            </button>
            {(trip.folders ?? []).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFolder(f.id)}
                className={folderChipClass(currentFolder?.id === f.id)}
              >
                <Folder className="h-4 w-4" />
                {f.name}
              </button>
            ))}
            {trip.isOwner ? (
              <button
                type="button"
                onClick={() => {
                  setNewFolderName("");
                  setFolderError(null);
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <FolderPlus className="h-4 w-4" />
                New folder
              </button>
            ) : null}
          </div>

          {trip.canUpload ? (
            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-500">
                {currentFolder ? (
                  <>
                    New photos are added to{" "}
                    <span className="font-medium text-slate-700">{currentFolder.name}</span>.
                  </>
                ) : (
                  "New photos are added to the group."
                )}
              </p>
              {/* Keyed by folder so switching folders resets the panel's progress/selection. */}
              <UploadPanel
                key={currentFolder?.id ?? "all"}
                tripId={trip.id}
                folderId={currentFolder?.id}
                onUploaded={handleUploaded}
              />
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              <Lock className="h-4 w-4" />
              Only the host can add photos to this event.
            </div>
          )}
          <div className="mt-8">
            <PhotoGrid
              tripId={trip.id}
              folder={currentFolder?.id}
              reload={reload}
              canDelete={trip.isOwner ?? false}
            />
          </div>

          <Dialog
            open={createOpen}
            onClose={() => !creatingFolder && setCreateOpen(false)}
            title="New folder"
          >
            <label className="mb-1 block text-sm font-medium text-slate-700">Folder name</label>
            <input
              value={newFolderName}
              onChange={(e) => {
                setFolderError(null);
                setNewFolderName(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && void handleCreateFolder()}
              placeholder="e.g. Ceremony"
              maxLength={80}
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            {folderError ? <p className="mt-2 text-sm text-red-600">{folderError}</p> : null}
            <button
              type="button"
              onClick={() => void handleCreateFolder()}
              disabled={creatingFolder || newFolderName.trim().length < 1}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create folder
            </button>
          </Dialog>

          {trip.isOwner ? (
            <SlideOver
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              title="Group settings"
            >
              <GroupSettings
                trip={trip}
                onChange={setTrip}
                canWatermark={canWatermark}
                onDeleted={() => {
                  setSettingsOpen(false);
                  router.replace("/studio");
                }}
              />
            </SlideOver>
          ) : null}

          {trip.isOwner ? (
            <MemberAccess
              trip={trip}
              onChange={setTrip}
              open={guestOpen}
              onClose={() => setGuestOpen(false)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function GroupPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
      <GroupDetail />
    </Suspense>
  );
}
