import type { Metadata } from "next";

import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Page not found | EMPEESS" };

// Unknown URLs and notFound() outside the store (account, admin) land here,
// directly under the root layout, so it brings its own minimal header.
export default function NotFound() {
  return <NotFoundContent standalone />;
}
