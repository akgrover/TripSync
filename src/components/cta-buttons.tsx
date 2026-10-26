import { ArrowRight } from "lucide-react";

import { APP_STORE_URL, PLAY_STORE_URL, STUDIO_URL } from "@/lib/links";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.76.85-2 .99-2.73.96-.11-1.03.43-2.14 1.1-2.86.74-.8 2.02-1.06 2.75-1.08zM20.9 17.1c-.56 1.3-.83 1.88-1.55 3.03-1 1.6-2.42 3.6-4.18 3.61-1.56.02-1.96-1.01-4.08-1-2.12.01-2.56 1.02-4.12 1.01-1.76-.02-3.1-1.64-4.1-3.24C-.64 16.6-1.1 11.2 1.1 8.17c1.08-1.5 2.78-2.38 4.38-2.38 1.63 0 2.65 1 4 1 1.3 0 2.09-1 3.98-1 1.42 0 2.93.78 4 2.12-3.52 1.93-2.95 6.96.44 8.19z"
      />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="currentColor" d="M4 3l13 9-13 9V3z" />
    </svg>
  );
}

function StoreButton({ href, glyph, top, bottom }: { href: string; glyph: React.ReactNode; top: string; bottom: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-800"
    >
      {glyph}
      <span className="flex flex-col text-left leading-none">
        <span className="text-[10px] text-slate-300">{top}</span>
        <span className="-mt-0.5 text-sm font-semibold">{bottom}</span>
      </span>
    </a>
  );
}

// Shared homepage CTAs: the two app stores plus "Open Studio" (the web portal for
// photographers/organizers).
export function CtaButtons({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
      <StoreButton href={APP_STORE_URL} glyph={<AppleGlyph />} top="Download on the" bottom="App Store" />
      <StoreButton href={PLAY_STORE_URL} glyph={<PlayGlyph />} top="Get it on" bottom="Google Play" />
      <a
        href={STUDIO_URL}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        Open Studio
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
