"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, HardDriveDownload, ArrowUpRight } from "lucide-react";
import { unsplash } from "@/lib/photos";

const items = [
  {
    icon: BookOpen,
    badge: "Coming Soon",
    title: "TripSync Memory Books",
    description:
      "Automated, physical coffee-table books generated from your top-rated event memories — no design work required. We pick the best shots, you get a book on your shelf.",
    image: "1543269865-cbf427effbad",
    imageAlt: "A curated set of trip photos laid out for a memory book",
  },
  {
    icon: HardDriveDownload,
    badge: "Coming Soon",
    title: "Storage Optimizer",
    description:
      "Free up local phone storage without losing anything. Once a photo is safely backed up full-resolution to TripSync, we help you reclaim the space on-device.",
    image: "1508921912186-1d1a45ebb3c1",
    imageAlt: "Cloud-backed photo storage represented by a scenic landscape",
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-teal-600">
          What&apos;s next
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Built for beyond the trip
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          The vault is just the start. Here&apos;s what beta users will get
          access to first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={unsplash(item.image, { w: 900 })}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
              <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-teal-50/95 px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm backdrop-blur">
                {item.badge}
              </span>
            </div>

            <div className="p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 flex items-center gap-1.5 text-lg font-bold text-slate-900">
                {item.title}
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-600" />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
