"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Users } from "lucide-react";

import { STUDIO_URL } from "@/lib/links";
import { StoreButtons } from "./cta-buttons";

// A self-routing section for organic visitors: "what are you looking for?" → two clear paths.
// Hosts/photographers go to the web Studio (built for big uploads); everyone else gets the app.
export function ChoosePath() {
  return (
    <section className="bg-tint relative bg-slate-50/60 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            What are you here to do?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            TripSync works two ways. Pick the one that sounds like you.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Path A - photographers / event hosts → web Studio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group flex flex-col rounded-3xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Camera className="h-6 w-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-teal-700">
              I&apos;m hosting or shooting an event
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              Share a whole event with everyone
            </h3>
            <p className="mt-2 text-slate-600">
              Upload the full shoot and TripSync sorts it by face. Share one link, and every guest
              opens it to find just their photos - in full quality.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Weddings", "Parties", "Corporate events"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-medium text-teal-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-auto pt-7">
              <a
                href={STUDIO_URL}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Open Studio
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-3 text-xs text-slate-500">
                Opens in your browser - best for uploading lots of photos.
              </p>
            </div>
          </motion.div>

          {/* Path B - friends / guests → the app */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Users className="h-6 w-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              I&apos;m with friends, or joining an event
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              Share with friends, or find your photos
            </h3>
            <p className="mt-2 text-slate-600">
              Start a shared album for a trip or get-together, or open your invite to grab the photos
              you&apos;re in - all from the app.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Trips", "Outings", "Get-togethers"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
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
