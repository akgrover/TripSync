import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves directory URLs with a trailing slash and 301-redirects `/studio` →
  // `/studio/`. Emitting every route as `<route>/index.html` keeps that consistent so `/studio/`
  // resolves to the real page (not a 404 that falls back to the home page) and client redirects
  // like router.replace("/studio") land correctly.
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
