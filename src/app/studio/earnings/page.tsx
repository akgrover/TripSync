"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Earnings & withdrawals are PARKED. TripSync no longer shares revenue or pays photographers out —
// the per-event charge is just our platform fee (photographers bill their clients directly), so there
// are no earnings to show or withdraw. The tab is hidden (studio-shell); this route redirects in case
// someone has an old link. The full earnings/withdrawal implementation is preserved in git history and
// can be revived if a revenue-share model ever returns. See docs/PILOT_REVENUE_MODEL.md §12.3.
export default function StudioEarningsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/studio");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Redirecting…
    </div>
  );
}
