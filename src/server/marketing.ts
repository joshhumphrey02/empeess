import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@/prisma/db";

import { absoluteUrl, escapeHtml, layout, sendEmail } from "./mail";

// Newsletter sign-ups and contact-page messages.

const signature = (email: string) =>
  createHmac("sha256", process.env.AUTH_SECRET || "dev-secret").update(`unsubscribe:${email}`).digest("base64url");

/** Unsubscribe links are signed so nobody can unsubscribe someone else. */
export const unsubscribeUrl = (email: string) =>
  absoluteUrl(`/newsletter/unsubscribe?email=${encodeURIComponent(email)}&sig=${signature(email)}`);

export function validUnsubscribe(email: string, sig: string) {
  const a = Buffer.from(signature(email));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Returns "new", "back" (re-subscribed) or "already". */
export async function subscribe(email: string) {
  const existing = await db.orm.public.NewsletterSubscriber.where({ email }).first();
  if (existing && !existing.unsubscribedAt) return "already" as const;
  if (existing) await db.orm.public.NewsletterSubscriber.where({ id: existing.id }).update({ unsubscribedAt: null });
  else {
    try {
      await db.orm.public.NewsletterSubscriber.create({ email });
    } catch {
      return "already" as const; // raced a double submit on the unique email
    }
  }
  const { html, text } = layout({
    heading: "You're on the list",
    paragraphs: ["Thanks for joining the EMPEESS newsletter. You'll be first to hear about new drops, restocks and members-only offers."],
    button: { label: "Shop the latest", url: absoluteUrl("/shop?sort=newest") },
    footnote: `Changed your mind? Unsubscribe any time: ${unsubscribeUrl(email)}`,
  });
  await sendEmail({ to: email, subject: "Welcome to the EMPEESS newsletter", html, text });
  return existing ? ("back" as const) : ("new" as const);
}

export async function unsubscribe(email: string) {
  await db.orm.public.NewsletterSubscriber.where({ email })
    .where((s) => s.unsubscribedAt.isNull())
    .update({ unsubscribedAt: new Date().toISOString() });
}

export async function saveContactMessage(input: { name: string; email: string; subject: string | null; message: string; orderNumber: string | null }) {
  await db.orm.public.ContactMessage.create(input);
  const inbox = process.env.CONTACT_INBOX;
  if (!inbox) return;
  const { html, text } = layout({
    heading: input.subject || "New message from the contact page",
    paragraphs: [`From ${input.name} <${input.email}>${input.orderNumber ? ` about order ${input.orderNumber}` : ""}:`, input.message],
    button: { label: "Open in dashboard", url: absoluteUrl("/admin/messages") },
  });
  await sendEmail({ to: inbox, subject: `[Contact] ${input.subject || input.name}`, html, text, replyTo: input.email });
}

export { escapeHtml };
