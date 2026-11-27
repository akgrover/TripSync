import { ChevronDown } from "lucide-react";

import { FAQS } from "@/lib/faq";

// Visible FAQ. Native <details> so the answers are always in the DOM (crawlable by search + answer
// engines) and work without JS. The same content is emitted as FAQPage JSON-LD in the layout.
export function Faq() {
  return (
    <section id="faq" className="py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <h2 className="font-editorial text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-slate-950 sm:text-6xl">
            Frequently asked questions
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            How TripSync works for photographers, studios, and event organisers.
          </p>
        </div>

        <div className="landing-card divide-y divide-slate-100 overflow-hidden rounded-3xl px-2 sm:px-4">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-4 py-6 sm:px-6 [&_summary]:list-none">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold text-slate-950 sm:text-lg">
                {item.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200/80 transition group-open:bg-slate-950 group-open:text-white">
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="mt-4 max-w-3xl pr-10 leading-7 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
