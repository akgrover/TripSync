import type { Metadata } from "next";

import { StudioShell } from "@/components/studio/studio-shell";

export const metadata: Metadata = {
  title: "TripSync Studio",
  description: "Upload and manage event photos.",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}
