import { IconClock, IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/store/contact-form";
import { InfoPage } from "@/components/store/info-page";
import { getCurrentUser } from "@/server/auth/session";
import { getSiteContent } from "@/server/site-content";

export const metadata: Metadata = { title: "Contact | EMPEESS" };

const ICONS: Record<string, typeof IconMail> = { LOCATION: IconMapPin, "CALL US": IconPhone, EMAIL: IconMail, "OPEN TIME": IconClock };

export default async function ContactPage() {
  const [user, { footer }] = await Promise.all([getCurrentUser(), getSiteContent()]);
  return (
    <InfoPage eyebrow="[Contact]" title="Get in touch" description="Questions about an order, sizing or returns? Send us a message." current="/contact">
      <ul className="grid gap-3 sm:grid-cols-2">
        {footer.contact.map((c) => {
          const Icon = ICONS[c.label] ?? IconMail;
          return (
            <li key={c.label} className="flex gap-3 rounded-3xl bg-canvas p-5 [&]:ml-0 [&]:list-none [&]:pl-5">
              <Icon className="size-5 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="block text-xs uppercase tracking-wide text-neutral-500">{c.label.toLowerCase()}</span>
                <span className="text-neutral-950">{c.value}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <section>
        <h2>Send a message</h2>
        <ContactForm defaultName={user?.name ?? undefined} defaultEmail={user?.email} />
      </section>
    </InfoPage>
  );
}
