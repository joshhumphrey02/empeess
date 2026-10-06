"use client";

import { IconMailExclamation } from "@tabler/icons-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { resendVerification } from "@/app/actions/auth";
import { initialFormState } from "@/app/actions/form-state";

import { SubmitButton } from "./form-bits";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, action] = useActionState(resendVerification, initialFormState);
  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok && state.message) toast.success(state.message);
  }, [state]);
  return (
    <form action={action} className="flex flex-wrap items-center gap-4 rounded-3xl bg-amber-50 p-5 text-amber-950">
      <IconMailExclamation className="size-6 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <span className="block font-medium">Confirm your email</span>
        We sent a link to {email}. Confirming it makes sure your receipts and delivery updates reach you.
      </p>
      <SubmitButton variant="outline" className="h-10 border-amber-900 text-amber-950 hover:bg-amber-900">
        Resend link
      </SubmitButton>
    </form>
  );
}
