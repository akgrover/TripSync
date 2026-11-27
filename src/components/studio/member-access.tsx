"use client";

import { useState } from "react";
import { Crown, Loader2, Search } from "lucide-react";

import { ApiError, studioApi } from "@/lib/studio/api";
import type { StudioMember, StudioTrip } from "@/lib/studio/types";
import { Dialog } from "./dialog";
import { SlideOver } from "./slide-over";

function Avatar({ name, url }: { name: string; url: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
    return <img src={url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

type OwnerAction = { member: StudioMember; mode: "promote" | "demote" };

// Owner-only guests panel, shown as a right slide-over (opened from the group header). It ALWAYS lists
// everyone who's joined. Two capabilities layer on top of the roster:
//  - the watermark clean-access toggle, when `showAccessControls` is true (watermarked event + owner
//    entitled);
//  - "Make owner" / remove, when the viewer can manage the group (`trip.canManage`) — this promotes a
//    guest to a co-owner (internally a 'manager') so a client can run the event. Only the real owner
//    (`trip.isOwner`) can remove someone's owner access.
export function MemberAccess({
  trip,
  onChange,
  open,
  onClose,
  showAccessControls,
}: {
  trip: StudioTrip;
  onChange: (trip: StudioTrip) => void;
  open: boolean;
  onClose: () => void;
  showAccessControls: boolean;
}) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Which member's clean-access toggle failed, + the message, so a switch that stays put has a reason.
  const [error, setError] = useState<{ memberId: string; message: string } | null>(null);
  // Owner promote/demote confirmation + its in-flight / error state.
  const [ownerAction, setOwnerAction] = useState<OwnerAction | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = trip.canManage === true;
  const isOwner = trip.isOwner === true;
  const guests = trip.members.filter((member) => member.role !== "owner");
  const withAccess = guests.filter((member) => member.cleanAccess).length;

  async function toggle(memberId: string, next: boolean) {
    setBusyId(memberId);
    setError(null);
    try {
      const res = await studioApi.setMemberAccess(trip.id, memberId, next);
      onChange(res.trip);
    } catch (err) {
      setError({
        memberId,
        message: err instanceof ApiError ? err.message : "Couldn't update access. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmOwnerAction() {
    if (!ownerAction || acting) {
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      const res =
        ownerAction.mode === "promote"
          ? await studioApi.promoteManager(trip.id, ownerAction.member.id)
          : await studioApi.demoteManager(trip.id, ownerAction.member.id);
      onChange(res.trip);
      setOwnerAction(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Couldn't update. Please try again.",
      );
    } finally {
      setActing(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? guests.filter((member) => member.name.toLowerCase().includes(q)) : guests;
  const actionName = ownerAction?.member.name || "This guest";

  return (
    <>
    <SlideOver
      open={open}
      onClose={onClose}
      title="Guests"
      description={
        showAccessControls
          ? "Give a guest the full-quality originals once they've paid. Everyone else keeps seeing the watermarked preview."
          : "Everyone who's joined this group."
      }
    >
      {guests.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">No one has joined this group yet.</p>
      ) : (
        <>
          {showAccessControls ? (
            <p className="border-b border-slate-100 px-5 py-2.5 text-sm text-slate-500">
              {`${withAccess} of ${guests.length} ${guests.length === 1 ? "guest has" : "guests have"} full access.`}
            </p>
          ) : (
            <p className="border-b border-slate-100 px-5 py-2.5 text-sm text-slate-500">
              {`${guests.length} ${guests.length === 1 ? "guest" : "guests"}.`}
            </p>
          )}
          {guests.length > 6 ? (
            <div className="sticky top-0 border-b border-slate-100 bg-white px-5 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search guests"
                  className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No guests match &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul className="divide-y divide-slate-100 px-5">
              {filtered.map((member) => {
                const clean = member.cleanAccess ?? false;
                const isManager = member.role === "manager";
                const busy = busyId === member.id;
                return (
                  <li key={member.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={member.name} url={member.avatar} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                            {isManager ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                                <Crown className="h-2.5 w-2.5" />
                                Owner
                              </span>
                            ) : null}
                          </div>
                          {showAccessControls ? (
                            <p className="text-xs text-slate-500">{clean ? "Full access" : "Watermarked"}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {/* Make owner (promote) — any manager/owner; Remove (demote) — real owner only. */}
                        {isManager ? (
                          isOwner ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setOwnerAction({ member, mode: "demote" });
                              }}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-red-600"
                            >
                              Remove
                            </button>
                          ) : null
                        ) : canManage ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActionError(null);
                              setOwnerAction({ member, mode: "promote" });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Crown className="h-3 w-3" />
                            Make owner
                          </button>
                        ) : null}

                        {showAccessControls ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={clean}
                            aria-label={`Full access for ${member.name}`}
                            disabled={busy}
                            onClick={() => void toggle(member.id, !clean)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
                              clean ? "bg-teal-600" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                                clean ? "left-[22px]" : "left-0.5"
                              }`}
                            />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {error?.memberId === member.id ? (
                      <p className="mt-1.5 text-xs text-red-600">{error.message}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </SlideOver>

      <Dialog
        open={ownerAction !== null}
        onClose={() => !acting && setOwnerAction(null)}
        title={ownerAction?.mode === "promote" ? "Make an owner?" : "Remove owner access?"}
      >
        {ownerAction ? (
          <>
            <p className="text-sm text-slate-600">
              {ownerAction.mode === "promote" ? (
                <>
                  <span className="font-semibold text-slate-900">{actionName}</span> will be able to
                  manage this event — add or remove photos, invite people, rename it, and make others
                  owners. They <span className="font-medium">can&apos;t</span> see earnings or billing,
                  or delete the event.
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{actionName}</span> will go back to a
                  regular guest and lose the ability to manage this event.
                </>
              )}
            </p>
            {actionError ? <p className="mt-2 text-sm text-red-600">{actionError}</p> : null}
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOwnerAction(null)}
                disabled={acting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmOwnerAction()}
                disabled={acting}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  ownerAction.mode === "promote"
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ownerAction.mode === "promote" ? "Make owner" : "Remove"}
              </button>
            </div>
          </>
        ) : null}
      </Dialog>
    </>
  );
}
