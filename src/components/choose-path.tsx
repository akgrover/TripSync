"use client";

import { motion } from "framer-motion";
import { Camera, Users } from "lucide-react";

import { STUDIO_URL } from "@/lib/links";
import { StoreButtons } from "./cta-buttons";

// A self-routing section for organic visitors: "what are you looking for?" → two clear paths.
// Hosts/photographers go to the web Studio (built for big uploads); everyone else gets the app.
export function ChoosePath() {
  return (
    <section className="relative border-y border-slate-200/70 bg-white/70 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="grid items-end gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
        >
          <h2 className="font-editorial text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-slate-950 sm:text-6xl">
            What are you here to do?
          </h2>
          <p className="text-lg leading-8 text-slate-600 lg:pb-1">
            TripSync works two ways. Pick the one that sounds like you.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* Path A - photographers / event hosts → web Studio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="landing-card landing-card-interactive group relative flex flex-col overflow-hidden rounded-3xl p-7 sm:p-8"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-teal-600" />
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
              <Camera className="h-6 w-6" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
              I&apos;m hosting or shooting an event
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Share a whole event with everyone
            </h3>
            <p className="mt-3 leading-7 text-slate-600">
              Upload the full shoot and TripSync sorts it by face. Share one link, and every guest
              opens it to find just their photos - in full quality.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Weddings", "Sports events", "Corporate"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-auto pt-7">
              <a
                href={STUDIO_URL}
                className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Open Studio
              </a>
              <p className="mt-3 text-xs text-slate-500">
                Opens in your browser - best for uploading lots of photos.
              </p>
            </div>
          </motion.div>

          {/* Path B - friends / guests → the app */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.06 }}
            className="landing-card landing-card-interactive group relative flex flex-col overflow-hidden rounded-3xl p-7 sm:p-8"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Users className="h-6 w-6" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              I&apos;m a guest at an event
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Find the photos you&apos;re in
            </h3>
            <p className="mt-3 leading-7 text-slate-600">
              Open your invite or scan the QR at the event, add a quick selfie, and get every photo
              you appear in - full quality, free, in the TripSync app.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Weddings", "Sports events", "Functions"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-auto pt-7">
              <div className="flex flex-wrap gap-3">
                <StoreButtons />
              </div>
              <p className="mt-3 text-xs text-slate-500">Free to download on iPhone and Android.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
