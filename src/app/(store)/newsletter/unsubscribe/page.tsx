import type { Metadata } from "next";

import { PageHeading } from "@/components/store/page-heading";
import { UnsubscribeForm } from "@/components/store/unsubscribe-form";
import { validUnsubscribe } from "@/server/marketing";

export const metadata: Metadata = { title: "Unsubscribe | EMPEESS", robots: { index: false } };

// A button, not an automatic unsubscribe on GET: mail scanners open links.
export default async function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  const sp = await searchParams;
  const email = String(Array.isArray(sp.email) ? sp.email[0] : (sp.email ?? "")).toLowerCase();
  const sig = String(Array.isArray(sp.sig) ? sp.sig[0] : (sp.sig ?? ""));
  const valid = email && validUnsubscribe(email, sig);
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-8">
      <PageHeading eyebrow="[Newsletter]" title="Unsubscribe" description={valid ? "Sorry to see you go. Confirm below and we'll stop the newsletter." : "This link isn't valid. Use the link at the bottom of one of our emails."} className="mb-8" />
      {valid && <UnsubscribeForm email={email} sig={sig} />}
    </div>
  );
}
