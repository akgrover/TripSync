import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Logo } from "./logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy-policy" className="transition hover:text-slate-900">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="transition hover:text-slate-900">
              Terms
            </Link>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            TripSync is currently in Private Beta
          </span>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
          &copy; {year} TripSync. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
