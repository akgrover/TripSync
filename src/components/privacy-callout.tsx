"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Ban, ScanFace } from "lucide-react";

const points = [
  {
    icon: Lock,
    title: "Encrypted",
    description: "Your photos and face data are encrypted in transit and at rest.",
  },
  {
    icon: Ban,
    title: "Never sold",
    description: "We never sell your data or use it for advertising.",
  },
  {
    icon: ScanFace,
    title: "Only to sort your galleries",
    description: "Face matching stays scoped to the groups you're a member of.",
  },
];

export function PrivacyCallout() {
  return (
    <section id="privacy" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42 }}
        className="landing-card overflow-hidden rounded-3xl p-7 sm:p-8 lg:p-10"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="max-w-xl">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="font-editorial mt-6 text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-slate-950 sm:text-5xl">
              Your photos belong to you.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Your photos and face data are encrypted in transit and at rest, never
              sold, and used only to sort your group galleries within TripSync.
            </p>
          </div>

          <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 sm:grid-cols-3 lg:grid-cols-1">
            {points.map((point) => (
              <div
                key={point.title}
                className="border-t border-slate-200/80 bg-slate-50/55 p-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0 lg:border-l-0 lg:border-t lg:first:border-t-0"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80">
                  <point.icon className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  {point.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
