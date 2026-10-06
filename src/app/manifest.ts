import type { MetadataRoute } from "next";

// Icons come from `bun run brand:assets`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EMPEESS",
    short_name: "EMPEESS",
    description: "Curated streetwear and fragrances: clothes, joggers, hoodies and perfumes.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
