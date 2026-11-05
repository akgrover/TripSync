# Social share image (`public/opengraph-image.png`)

The Open Graph / Twitter card image is a committed static PNG at
`public/opengraph-image.png` (1200×630), referenced explicitly from
`metadata.openGraph.images` and `metadata.twitter.images` in
`src/app/layout.tsx`.

## Why it's committed, not a route

Next's `app/opengraph-image.tsx` file convention works, but under
`output: 'export'` it renders to an **extensionless** file (`out/opengraph-image`).
GitHub Pages serves unknown extensions as `application/octet-stream`, and
Twitter/LinkedIn crawlers reject non-`image/*` content types — so the card
would silently fail in production. A real `.png` in `/public` is served with
the correct `image/png` MIME on GitHub Pages.

## Regenerating the image

The PNG was rendered once with `next/og`'s `ImageResponse` via a temporary
`src/app/opengraph-image.tsx` route, then copied into `/public`. To change the
design, recreate that route from the source below, run `npm run build`, copy
`out/opengraph-image` → `public/opengraph-image.png`, and delete the route
again:

```tsx
// src/app/opengraph-image.tsx (temporary — delete after copying the PNG)
import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt =
  "TripSync — private group photos, sorted by AI face recognition";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #042f2e 0%, #0f766e 55%, #0d9488 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "68px",
              height: "68px",
              borderRadius: "20px",
              background: "#5eead4",
              color: "#042f2e",
              fontSize: "40px",
              fontWeight: 800,
            }}
          >
            T
          </div>
          <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-1px" }}>
            TripSync
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              maxWidth: "900px",
            }}
          >
            Group photos, sorted by AI face recognition.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              color: "#99f6e4",
              maxWidth: "860px",
            }}
          >
            Everyone gets the full-resolution shots they&apos;re actually in —
            from one private, invite-only album.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            fontSize: "26px",
            color: "#ccfbf1",
          }}
        >
          <div style={{ display: "flex" }}>thetripsync.in</div>
          <div style={{ display: "flex", color: "#5eead4" }}>•</div>
          <div style={{ display: "flex" }}>iOS · Android · Web</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```
