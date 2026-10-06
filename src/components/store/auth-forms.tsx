"use client";

import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { useActionState } from "react";

import { login, register } from "@/app/actions/auth";
import { initialFormState } from "@/app/actions/form-state";

import { Field, FormMessage, SubmitButton } from "./form-bits";

export function GoogleButton({ next }: { next: string }) {
  return (
    <a
      href={`/api/auth/google?next=${encodeURIComponent(next)}`}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-neutral-900 text-sm font-medium transition-colors hover:bg-neutral-900 hover:text-white"
    >
      <IconBrandGoogleFilled className="size-5" />
      Continue with Google
    </a>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" required autoComplete="email" defaultValue={state.fields?.email} />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <FormMessage state={state} />
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(register, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Name" name="name" required autoComplete="name" defaultValue={state.fields?.name} />
      <Field label="Email" name="email" type="email" required autoComplete="email" defaultValue={state.fields?.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <FormMessage state={state} />
      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
