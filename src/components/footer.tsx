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

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/privacy-policy" className="transition hover:text-slate-900">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/community-guidelines" className="transition hover:text-slate-900">
              Community Guidelines
            </Link>
            <a href="tel:+918789330638" className="transition hover:text-slate-900">
              Contact
            </a>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            Group photos, sorted by face
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>&copy; {year} TripSync. All rights reserved.</p>
          <p>
            Questions? Reach us at{" "}
            <a href="tel:+918789330638" className="font-medium text-slate-500 transition hover:text-slate-900">
              +91 87893 30638
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
