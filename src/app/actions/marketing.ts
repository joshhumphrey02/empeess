"use server";

import { saveContactMessage, subscribe, unsubscribe, validUnsubscribe } from "@/server/marketing";

import type { FormState } from "./form-state";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

export async function subscribeNewsletter(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  const result = await subscribe(email);
  return {
    ok: true,
    message: result === "already" ? "You're already subscribed. Thanks!" : result === "back" ? "Welcome back! You're subscribed again." : "You're in! Check your inbox.",
  };
}

export async function confirmUnsubscribe(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  if (!validUnsubscribe(email, String(form.get("sig") ?? ""))) return { error: "This unsubscribe link isn't valid." };
  await unsubscribe(email);
  return { ok: true, message: `${email} won't get any more newsletter emails.` };
}

export async function sendContactMessage(_prev: FormState, form: FormData): Promise<FormState> {
  const fields = {
    name: text(form, "name", 80),
    email: text(form, "email", 200).toLowerCase(),
    subject: text(form, "subject", 120),
    orderNumber: text(form, "orderNumber", 40).toUpperCase(),
    message: text(form, "message", 4000),
  };
  // Honeypot: real people never fill the hidden "website" field.
  if (text(form, "website", 200)) return { ok: true, message: "Thanks! We'll get back to you soon." };
  if (!fields.name) return { error: "Tell us your name.", fields };
  if (!EMAIL_RE.test(fields.email)) return { error: "Enter a valid email so we can reply.", fields };
  if (fields.message.length < 10) return { error: "Tell us a little more (at least 10 characters).", fields };

  await saveContactMessage({ ...fields, subject: fields.subject || null, orderNumber: fields.orderNumber || null });
  return { ok: true, message: "Thanks! We usually reply within one working day." };
}
