"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

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
  const [busy, setBusy] = useState<null | "uploads" | "visibility">(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEvent = trip.storageMode === "single_payer";

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
            title="Let members add photos"
            description="When off, only you can add photos to this event."
            value={trip.allowMemberUploads ?? false}
            busy={busy === "uploads"}
            onToggle={toggleUploads}
          />
        ) : null}

        <ToggleRow
          title="Let everyone see all photos"
          description="When off, members only see photos they're in or added themselves. You always see every photo."
          value={(trip.photoVisibility ?? "everyone") === "everyone"}
          busy={busy === "visibility"}
          onToggle={toggleVisibility}
        />
      </div>

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
