"use client";

import { motion } from "framer-motion";
import { X, Check, MessageSquareWarning, ImageDown, Search, FolderSync, HardDrive as HardDriveIcon, ScanFace } from "lucide-react";

const rows = [
  {
    problemIcon: MessageSquareWarning,
    problem: "Messy WhatsApp & Drive transfers",
    problemSub: "Links expire, folders get lost, half the group never finds them.",
    solutionIcon: FolderSync,
    solution: "One central TripSync vault",
    solutionSub: "Every member has permanent, organized access in one place.",
  },
  {
    problemIcon: ImageDown,
    problem: "Compressed, blurry photos",
    problemSub: "Chat apps crush your camera roll down to a fraction of its size.",
    solutionIcon: HardDriveIcon,
    solution: "Perpetual full-resolution storage",
    solutionSub: "Upload once at full quality — it never gets touched again.",
  },
  {
    problemIcon: Search,
    problem: "Scrolling through 500 photos",
    problemSub: "Hunting for the handful you're actually in takes forever.",
    solutionIcon: ScanFace,
    solution: "Instant AI face tagging",
    solutionSub: "TripSync surfaces only the photos you appear in, automatically.",
  },
];

export function ProblemSolution() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-teal-600">
          Why TripSync
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          The old way was never built for group trips
        </h2>
      </div>

      <div className="space-y-4">
        {rows.map((row, i) => (
          <motion.div
            key={row.problem}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-0"
          >
            {/* Problem */}
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:rounded-r-none sm:border-r-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <row.problemIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-slate-500 line-through decoration-red-300 decoration-2">
                  {row.problem}
                </p>
                <p className="mt-1 text-sm text-slate-400">{row.problemSub}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="z-10 hidden items-center justify-center sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
                <X className="h-4 w-4" />
              </span>
            </div>

            {/* Solution */}
            <div className="flex items-start gap-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-6 sm:rounded-l-none sm:border-l-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                <row.solutionIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {row.solution}
                  <Check className="h-4 w-4 text-teal-600" strokeWidth={3} />
                </p>
                <p className="mt-1 text-sm text-slate-600">{row.solutionSub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
