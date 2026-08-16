import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function LegalPage({
  title,
  draft,
  children,
}: {
  title: string;
  draft?: boolean;
  children: ReactNode;
}) {
  return (
    <div id="top">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>

        {draft && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p>
              <strong>Draft.</strong> This document is a starting template and
              has not been reviewed by legal counsel. Bracketed placeholders
              still need to be filled in before this is treated as final.
            </p>
          </div>
        )}

        <div className="mt-10 space-y-10 text-slate-600 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-3 [&_p]:leading-relaxed [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
