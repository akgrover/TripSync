"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

import { STUDIO_URL } from "@/lib/links";

// Marketing pricing. Hand-curated (kept in sync with the API plan catalog in
// tripsync-api/src/config/plans.ts) so the content is in the static HTML - no loading flicker, and
// it's readable by search / answer engines. Checkout happens in Studio after sign-in.
type Tier = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "Free",
    tagline: "Try it, no card needed",
    features: [
      "AI face-recognition delivery",
      "Full-resolution photos",
      "Upload from the web Studio",
      "5 GB storage",
      "Up to 1,000 photos",
    ],
  },
  {
    name: "Essential",
    price: "₹2,999",
    tagline: "For getting started",
    features: [
      "AI face-recognition delivery",
      "Full-resolution photos",
      "Upload from the web Studio",
      "50 GB storage",
      "Up to 25,000 photos",
    ],
  },
  {
    name: "Pro",
    price: "₹12,999",
    tagline: "For working photographers",
    highlight: true,
    features: [
      "Everything in Essential",
      "Watermark & proofing",
      "Folders to organise shoots",
      "100 GB storage",
      "Up to 100,000 photos",
    ],
  },
  {
    name: "Premium",
    price: "₹25,999",
    tagline: "For studios & high volume",
    features: [
      "Everything in Pro",
      "250 GB storage",
      "Up to 250,000 photos",
      "Best for busy studios",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-tint bg-slate-50/60 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Plans for photographers &amp; event hosts
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            One link, every guest finds their own photos. Pick the plan that fits your volume - pay
            yearly, cancel anytime.
          </p>
        </motion.div>

        <div className="mt-10 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
              className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${
                tier.highlight ? "border-teal-300 ring-2 ring-teal-500/30 md:-mt-2 md:pb-10" : "border-slate-200"
              }`}
            >
              {tier.highlight ? (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Most popular
                </span>
              ) : null}

              <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{tier.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {tier.price}
                </span>
                {tier.price.startsWith("₹") ? (
                  <span className="text-sm text-slate-500">/ year</span>
                ) : null}
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={STUDIO_URL}
                className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  tier.highlight
                    ? "bg-teal-600 text-white hover:bg-teal-700"
                    : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tier.price === "Free" ? "Start free" : "Get started"}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Just sharing with friends? The TripSync app is free - create a group and get your photos at
          no cost. Plan prices exclude GST.
        </p>
      </div>
    </section>
  );
}
