"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { joinLink } from "@/lib/studio/config";
import type { StudioTrip } from "@/lib/studio/types";
import { CopyButton } from "@/components/studio/copy-button";
import { GroupSettings } from "@/components/studio/group-settings";
import { MemberAccess } from "@/components/studio/member-access";
import { UploadPanel } from "@/components/studio/upload-panel";
import { PhotoGrid } from "@/components/studio/photo-grid";

// Dynamic group id comes via ?id= (not a [id] segment) so the page stays statically exportable.
function GroupDetail() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [trip, setTrip] = useState<StudioTrip | null>(null);
  const [reload, setReload] = useState(0);

  // Refetch the grid once, when a whole upload completes. (Thumbnails that aren't ready yet show a
  // placeholder; the grid's Refresh button pulls them in on demand — no background polling.)
  function handleUploaded() {
    setReload((n) => n + 1);
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
            {trip.inviteCode ? <CopyButton value={joinLink(trip.inviteCode)} label="Copy invite link" /> : null}
          </div>
          {trip.inviteCode ? (
            <p className="mt-1 text-sm text-slate-500">
              Invite code <code className="rounded bg-slate-100 px-1.5 py-0.5">{trip.inviteCode}</code> — share
              the link so people can join in the app.
            </p>
          ) : null}

          {trip.isOwner ? (
            <div className="mt-6">
              <GroupSettings trip={trip} onChange={setTrip} onDeleted={() => router.replace("/studio")} />
            </div>
          ) : null}

          {trip.isOwner && trip.watermark?.enabled ? (
            <div className="mt-4">
              <MemberAccess trip={trip} onChange={setTrip} />
            </div>
          ) : null}

          {trip.canUpload ? (
            <div className="mt-8">
              <UploadPanel tripId={trip.id} onUploaded={handleUploaded} />
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              <Lock className="h-4 w-4" />
              Only the host can add photos to this event.
            </div>
          )}
          <div className="mt-10">
            <PhotoGrid tripId={trip.id} reload={reload} canDelete={trip.isOwner ?? false} />
          </div>
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
