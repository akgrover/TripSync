"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Users, ImagePlus, ScanFace } from "lucide-react";
import { demoPhotos, unsplash } from "@/lib/photos";

const steps = [
  {
    icon: ImagePlus,
    title: "Upload your event",
    description:
      "Create an event in TripSync Studio and upload the full shoot - a wedding, a match, a sports day. Originals stay full quality.",
  },
  {
    icon: Users,
    title: "Guests join in one tap",
    description:
      "Share a single link or print a QR poster. Guests open it, add a quick selfie - no account to set up, and no app needed to view.",
  },
  {
    icon: ScanFace,
    title: "Everyone gets theirs",
    description:
      "Face matching sorts the album automatically, so each person sees the photos they appear in - ready to view and download.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="mb-10 max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
          How it works
        </span>
        <h2 className="font-editorial mt-4 text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-slate-950 sm:text-6xl">
          One upload. Everyone&apos;s photos.
        </h2>
      </div>

      <div className="grid items-stretch gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="relative min-h-[28rem]"
        >
          <div className="absolute inset-y-0 left-0 right-12 overflow-hidden rounded-3xl bg-slate-100">
            <Image
              src={unsplash(demoPhotos[5].id, { w: 760 })}
              alt=""
              fill
              sizes="(min-width: 1024px) 38vw, 90vw"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-7 right-0 h-48 w-36 rotate-3 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-2xl">
            <Image
              src={unsplash(demoPhotos[9].id, { w: 400 })}
              alt=""
              fill
              sizes="144px"
              className="object-cover"
            />
          </div>
          <div className="absolute left-5 top-5 rounded-xl border border-white/50 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur">
            Full-resolution
          </div>
        </motion.div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="grid gap-5 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-start"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
              <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
