"use client";

import { useState } from "react";
import { Check, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { studioApi } from "@/lib/studio/api";
import type { StudioTrip } from "@/lib/studio/types";
import { Dialog } from "./dialog";

// A single on/off setting row. Add more by dropping another <ToggleRow> into the list below.
function ToggleRow({
  title,
  description,
  value,
  busy,
  onToggle,
}: {
  title: string;
  description: string;
  value: boolean;
  busy: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={title}
        disabled={busy}
        onClick={() => onToggle(!value)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
          value ? "bg-teal-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// Owner-only group settings. Self-contained: it calls the API and hands the updated trip back via
// onChange. Structured so new settings are just another ToggleRow + a one-line save handler.
export function GroupSettings({
  trip,
  onChange,
  onDeleted,
}: {
  trip: StudioTrip;
  onChange: (trip: StudioTrip) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState<null | "uploads" | "visibility" | "watermark" | "reapply">(null);
  const [reapplied, setReapplied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEvent = trip.storageMode === "single_payer";
  const everyoneSees = (trip.photoVisibility ?? "everyone") === "everyone";
  const membersCanUpload = trip.allowMemberUploads ?? false;
  const watermarkOn = trip.watermark?.enabled ?? false;

  async function toggleUploads(next: boolean) {
    setBusy("uploads");
    try {
      const res = await studioApi.setMemberUploads(trip.id, next);
      onChange(res.trip);
    } catch {
      // Leave the switch as-is; it reflects the server value on next load.
    } finally {
      setBusy(null);
    }
  }

  async function toggleVisibility(next: boolean) {
    setBusy("visibility");
    try {
      const res = await studioApi.setPhotoVisibility(trip.id, next ? "everyone" : "matched_only");
      onChange(res.trip);
    } catch {
      // no-op
    } finally {
      setBusy(null);
    }
  }

  async function toggleWatermark(next: boolean) {
    setBusy("watermark");
    try {
      const res = await studioApi.setWatermark(trip.id, next);
      onChange(res.trip);
    } catch {
      // no-op
    } finally {
      setBusy(null);
    }
  }

  async function reapplyWatermark() {
    if (busy) {
      return;
    }
    setBusy("reapply");
    try {
      await studioApi.regenerateWatermark(trip.id);
      setReapplied(true);
      // Re-generation runs in the background; let them trigger it again after a moment.
      setTimeout(() => setReapplied(false), 4000);
    } catch {
      // no-op
    } finally {
      setBusy(null);
    }
  }

  async function deleteGroup() {
    if (deleting) {
      return;
    }
    setDeleting(true);
    try {
      await studioApi.deleteGroup(trip.id);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Group settings</h2>
      </div>

      <div className="divide-y divide-slate-100 px-5">
        {isEvent ? (
          <ToggleRow
            title="Members can add photos"
            description={
              membersCanUpload
                ? "Anyone in the event can add photos."
                : "Only you can add photos to this event."
            }
            value={membersCanUpload}
            busy={busy === "uploads"}
            onToggle={toggleUploads}
          />
        ) : null}

        {isEvent ? (
          <ToggleRow
            title="Watermark photos for guests"
            description={
              watermarkOn
                ? "Guests see a watermarked preview until you give them access. You and members you've given access see the originals."
                : "Everyone sees the original photos."
            }
            value={watermarkOn}
            busy={busy === "watermark"}
            onToggle={toggleWatermark}
          />
        ) : null}

        <ToggleRow
          title="Everyone sees all photos"
          description={
            everyoneSees
              ? "Every member can see all photos in this group."
              : "Members only see photos they're in or added themselves. You still see all of them."
          }
          value={everyoneSees}
          busy={busy === "visibility"}
          onToggle={toggleVisibility}
        />
      </div>

      {isEvent && trip.watermark?.enabled ? (
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Re-apply watermark</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Re-generate every photo with your current watermark text and opacity. Use after changing
              them in Settings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void reapplyWatermark()}
            disabled={busy === "reapply"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === "reapply" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : reapplied ? (
              <Check className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {reapplied ? "Queued" : "Re-apply"}
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-slate-900">Delete group</p>
          <p className="mt-0.5 text-sm text-slate-500">Removes the group and every photo, for everyone.</p>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Delete group?">
        <p className="text-sm text-slate-600">
          This permanently deletes the group and every photo in it, for everyone. This can&apos;t be
          undone.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void deleteGroup()}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete group
          </button>
        </div>
      </Dialog>
    </div>
  );
}
