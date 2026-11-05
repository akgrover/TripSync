import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { FAQS } from "@/lib/faq";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/links";

const SITE_URL = "https://thetripsync.in";

// Structured data (JSON-LD) so answer engines (ChatGPT, Perplexity, Gemini) and search can read what
// TripSync is, who it's for, and quote the FAQ. It only describes the site's real, visible content.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "TripSync",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      description:
        "Private group photo sharing with AI face recognition for weddings, events, and trips.",
      sameAs: [APP_STORE_URL, PLAY_STORE_URL],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-87893-30638",
        contactType: "customer support",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "TripSync",
      applicationCategory: "PhotographyApplication",
      operatingSystem: "iOS, Android, Web",
      url: SITE_URL,
      description:
        "TripSync is a private group photo-sharing app that uses AI face recognition to deliver event and group photos. Photographers and event hosts upload a whole shoot from the web and share one link; guests add a selfie and instantly get the full-resolution photos they appear in. Great for weddings, parties, corporate events, and trips with friends.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      publisher: { "@id": `${SITE_URL}/#organization` },
      downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

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
    url: SITE_URL,
    siteName: "TripSync",
    // Committed static PNG (see OG_IMAGE.md). We deliberately avoid Next's
    // `opengraph-image` route convention: under `output: 'export'` it emits an
    // extensionless file that GitHub Pages serves as application/octet-stream,
    // which Twitter/LinkedIn reject. A real .png in /public has the right MIME.
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "TripSync — private group photos, sorted by AI face recognition",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripSync — Group photos, sorted by AI face recognition",
    description:
      "Private group photo sharing with AI face recognition. Each person gets the photos they're in.",
    images: ["/opengraph-image.png"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        {children}
      </body>
    </html>
  );
}
