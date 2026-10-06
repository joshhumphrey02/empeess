"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { initialFormState } from "@/app/actions/form-state";
import { sendContactMessage } from "@/app/actions/marketing";

import { Field, FormMessage, SubmitButton } from "./form-bits";

export function ContactForm({ defaultName, defaultEmail }: { defaultName?: string; defaultEmail?: string }) {
  const [state, action] = useActionState(sendContactMessage, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  const f = state.ok ? {} : (state.fields ?? {});

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message ?? "Message sent.");
    form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" required autoComplete="name" defaultValue={f.name ?? defaultName} />
      <Field label="Email" name="email" type="email" required autoComplete="email" defaultValue={f.email ?? defaultEmail} />
      <Field label="Subject (optional)" name="subject" defaultValue={f.subject} />
      <Field label="Order number (optional)" name="orderNumber" placeholder="EMP-…" defaultValue={f.orderNumber} />
      {/* Honeypot for bots; hidden from people and screen readers. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          defaultValue={f.message}
          className="w-full rounded-2xl border border-neutral-200 p-4 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2">
        {state.error && <FormMessage state={state} />}
        <SubmitButton className="w-fit">Send message</SubmitButton>
      </div>
    </form>
  );
}
