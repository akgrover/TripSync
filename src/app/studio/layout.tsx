import type { Metadata } from "next";

import { NetworkToast } from "@/components/studio/network-toast";
import { StudioShell } from "@/components/studio/studio-shell";
import { UploadManagerProvider } from "@/components/studio/upload-manager-provider";
import { GlobalUploadPanel } from "@/components/studio/global-upload-panel";

export const metadata: Metadata = {
  title: "TripSync Studio",
  description: "Upload and manage event photos.",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <UploadManagerProvider>
      <StudioShell>{children}<GlobalUploadPanel /></StudioShell>
      <NetworkToast />
    </UploadManagerProvider>
  );
}
