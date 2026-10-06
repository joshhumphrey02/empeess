"use client";

import { useActionState } from "react";

import { initialFormState } from "@/app/actions/form-state";
import { confirmUnsubscribe } from "@/app/actions/marketing";

import { FormMessage, SubmitButton } from "./form-bits";

export function UnsubscribeForm({ email, sig }: { email: string; sig: string }) {
  const [state, action] = useActionState(confirmUnsubscribe, initialFormState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="sig" value={sig} />
      <FormMessage state={state} />
      <SubmitButton>Unsubscribe {email}</SubmitButton>
    </form>
  );
}
