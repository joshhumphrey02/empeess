"use client";

import { useActionState } from "react";

import { checkout } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";
import { cn } from "@/lib/utils";

import { FormMessage, SubmitButton } from "./form-bits";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  isDefault: boolean;
};

export function CheckoutForm({ addresses, total }: { addresses: Address[]; total: string }) {
  const [state, action] = useActionState(checkout, initialFormState);
  const fallback = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <form action={action} className="space-y-8">
      <fieldset>
        <legend className="mb-4 text-xl font-medium tracking-tight">Delivery address</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <label
              key={a.id}
              className={cn(
                "flex cursor-pointer gap-3 rounded-3xl border border-neutral-200 p-5 text-sm transition-colors has-checked:border-neutral-950 has-checked:bg-canvas",
              )}
            >
              <input type="radio" name="addressId" value={a.id} defaultChecked={a.id === fallback?.id} className="mt-1 accent-neutral-950" required />
              <span>
                <span className="block font-medium text-neutral-950">
                  {a.fullName} {a.isDefault && <span className="ml-1 text-xs text-neutral-500">(default)</span>}
                </span>
                <span className="block text-neutral-600">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </span>
                <span className="block text-neutral-600">
                  {a.city}, {a.state}
                </span>
                <span className="block text-neutral-600">{a.phone}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-xl font-medium tracking-tight">Payment</legend>
        <label className="flex gap-3 rounded-3xl border border-neutral-950 bg-canvas p-5 text-sm">
          <input type="radio" checked readOnly className="mt-1 accent-neutral-950" />
          <span>
            <span className="block font-medium text-neutral-950">Pay on delivery</span>
            <span className="block text-neutral-600">Pay by cash or transfer when your order arrives.</span>
          </span>
        </label>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">Delivery note (optional)</span>
        <textarea
          name="note"
          rows={3}
          maxLength={500}
          placeholder="Gate code, best time to call…"
          className="w-full rounded-2xl border border-neutral-200 p-4 text-sm outline-none focus:border-neutral-900"
        />
      </label>

      <FormMessage state={state} />
      <SubmitButton className="w-full sm:w-auto">Place order · {total}</SubmitButton>
    </form>
  );
}
