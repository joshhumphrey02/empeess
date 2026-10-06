"use client";

import { useActionState, useEffect, useRef } from "react";

import { changePassword, updateProfile } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";

import { Field, FormMessage, SubmitButton } from "./form-bits";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  return (
    <form action={action} className="max-w-md space-y-4">
      <Field label="Name" name="name" required defaultValue={name} autoComplete="name" />
      <Field label="Email" name="email" type="email" value={email} readOnly disabled hint="Contact us to change your email." />
      <FormMessage state={state} />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePassword, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="max-w-md space-y-4">
      {hasPassword ? (
        <Field label="Current password" name="current" type="password" required autoComplete="current-password" />
      ) : (
        <p className="text-sm text-neutral-600">You sign in with Google. Set a password to also sign in with your email.</p>
      )}
      <Field label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
      <FormMessage state={state} />
      <SubmitButton>{hasPassword ? "Change password" : "Set password"}</SubmitButton>
    </form>
  );
}
