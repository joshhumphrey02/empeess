import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Search is an overlay now; old /search?q=… links land on the filtered shop.
  redirects: async () => [{ source: "/search", destination: "/shop", permanent: true }],
  images: {
    qualities: [75, 90],
    remotePatterns: [
      // Ark CDN: permanent delivery URLs for product images.
      {
        protocol: "https",
        hostname: "cdn.nerdstackgrp.com",
        pathname: "/apps/**",
        search: "",
      },
      // Placeholder editorial photography on the landing page (see
      // src/components/landing/content.ts). The query string is fixed so the
      // origin serves a pre-sized image instead of the multi-MB original.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-**",
        search: "?w=1600&q=80&fm=jpg",
      },
    ],
  },
};

export default nextConfig;
