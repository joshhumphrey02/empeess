"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

import type { FormState } from "@/app/actions/form-state";

/** Black pill submit button that shows a spinner while its form is pending. */
export function SubmitButton({
  children,
  className,
  variant = "solid",
  disabled,
  ...props
}: React.ComponentProps<"button"> & { variant?: "solid" | "outline" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid" && "bg-neutral-950 text-white hover:bg-neutral-800",
        variant === "outline" && "border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white",
        variant === "ghost" && "h-auto px-0 text-neutral-500 normal-case tracking-normal underline-offset-4 hover:text-neutral-950 hover:underline",
        className,
      )}
      {...props}
    >
      {pending && <IconLoader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {state.error}
      </p>
    );
  if (state.ok && state.message)
    return (
      <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {state.message}
      </p>
    );
  return null;
}

export function Field({
  label,
  name,
  hint,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: string; name: string; hint?: string }) {
  const id = props.id ?? `field-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
        {...props}
      />
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
