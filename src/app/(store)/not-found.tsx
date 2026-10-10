import type { Metadata } from "next";

import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Page not found | EMPEESS" };

// notFound() inside the store (unknown category or product) renders within
// the store layout, which already provides the header and footer.
export default function StoreNotFound() {
  return <NotFoundContent />;
}
