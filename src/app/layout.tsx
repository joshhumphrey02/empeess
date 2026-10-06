import type { Metadata } from "next";
import { Geist_Mono, Inter_Tight, Oswald } from "next/font/google";

import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Curated streetwear and fragrances. Shop clothes, joggers, hoodies and perfumes from EMPEESS.";

// favicon.ico, icon.png, apple-icon.png, opengraph-image.png and manifest.ts in
// this folder are picked up automatically; metadataBase makes their URLs absolute.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "EMPEESS — Clothes, Joggers, Hoodies & Perfumes",
  description,
  applicationName: "EMPEESS",
  openGraph: { type: "website", siteName: "EMPEESS", title: "EMPEESS", description },
  twitter: { card: "summary_large_image", title: "EMPEESS", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${oswald.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
