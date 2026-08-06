import { Aperture } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white">
        <Aperture className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>
      <span className="text-lg text-slate-900">
        Trip<span className="text-teal-600">Sync</span>
      </span>
    </span>
  );
}
