import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TripSync — Group photos, sorted by AI face recognition",
  description:
    "Create a private group, add your photos, and TripSync's AI face recognition sorts the album so each person sees the shots they're in — full resolution. Photographers can upload a whole event from the web and share one link.",
  metadataBase: new URL("https://thetripsync.in"),
  openGraph: {
    title: "TripSync — Group photos, sorted by AI face recognition",
    description:
      "Private group photo sharing with AI face recognition. Each person gets the photos they're in.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
