"use client";

import { motion } from "framer-motion";
import { Users, ImagePlus, ScanFace } from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Start a group",
    description:
      "Create a private group in the app, or a whole event from TripSync Studio on the web. Share one invite link so people can join.",
  },
  {
    icon: ImagePlus,
    title: "Add the photos",
    description:
      "Everyone drops their camera roll into the group — or a photographer uploads the full shoot at once. Originals stay full quality.",
  },
  {
    icon: ScanFace,
    title: "Everyone gets theirs",
    description:
      "Face matching sorts the album automatically, so each person sees the photos they appear in — ready to view and download.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-teal-600">
          How it works
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          One group. Everyone&apos;s photos.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
