import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TripSync — Every group photo. One shared vault.",
  description:
    "TripSync replaces messy drive links and compressed chat photos. Create a group album, drop your camera roll, and let smart facial recognition deliver the photos you're actually in. Now in private beta.",
  metadataBase: new URL("https://tripsync.app"),
  openGraph: {
    title: "TripSync — Every group photo. One shared vault.",
    description:
      "Full-resolution group albums with AI face tagging. Join the private beta.",
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
