"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Ban, ScanFace } from "lucide-react";

const points = [
  {
    icon: Lock,
    title: "End-to-end encrypted",
    description: "Biometric face data is encrypted in transit and at rest.",
  },
  {
    icon: Ban,
    title: "Never sold",
    description: "Your data funds a subscription business, not an ad business.",
  },
  {
    icon: ScanFace,
    title: "Used only to filter your galleries",
    description: "Matching stays scoped to the albums you're a member of.",
  },
];

export function PrivacyCallout() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-12"
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Your photos belong to you.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Facial biometric data is encrypted end-to-end, never sold, and
            only used to filter your group galleries within TripSync.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center"
            >
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <point.icon className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {point.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
