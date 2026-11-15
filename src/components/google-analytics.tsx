import Script from "next/script";

// GA4 Measurement ID for the TripSync web site (the "G-…" id, not the numeric stream id). It is a
// public identifier by design. Override with NEXT_PUBLIC_GA_MEASUREMENT_ID at build time; set it to
// an empty string to switch analytics off entirely.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-69VJXM6TEB";

// Standard gtag.js setup. Page views are collected automatically, including client-side route
// changes (GA4 enhanced measurement listens to history events), so no per-route tracking is needed.
//
// Privacy: /album/?code=<invite code> is a capability link to a private album, and GA records the
// full page URL by default. When `code` is present we hand GA the same URL without it, so invite
// codes are never sent to Google. (The album page doesn't change history, so the first hit is the
// only one that carries the code.) `page_location` is only overridden in that case, so every other
// page keeps GA's automatic URL.
const INIT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
var cfg = {};
var q = new URLSearchParams(window.location.search);
if (q.has('code')) {
  q.delete('code');
  var rest = q.toString();
  cfg.page_location = window.location.origin + window.location.pathname + (rest ? '?' + rest : '');
}
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, cfg);
`;

export function GoogleAnalytics() {
  // Production build only, so local `next dev` sessions never pollute the real traffic numbers.
  if (process.env.NODE_ENV !== "production" || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }}
      />
    </>
  );
}
