"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JoinPage } from "@/components/join-page";

export default function NotFound() {
  const [joinCode, setJoinCode] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    // `window` isn't available during static export prerendering, so the
    // path must be read post-mount to avoid a server/client HTML mismatch.
    const match = window.location.pathname.match(/^\/join\/([^/]+)\/?$/);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinCode(match ? decodeURIComponent(match[1]) : null);
  }, []);

  if (joinCode === undefined) return null;
  if (joinCode) return <JoinPage code={joinCode} />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700"
      >
        Back home
      </Link>
    </div>
  );
}
