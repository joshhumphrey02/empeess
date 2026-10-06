"use client";

import { useActionState, useEffect, useRef } from "react";

import { addAddress } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";

import { Field, FormMessage, SubmitButton } from "./form-bits";

const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

export function AddressForm({ defaultName, submitLabel = "Save address" }: { defaultName?: string; submitLabel?: string }) {
  const [state, action] = useActionState(addAddress, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  const f = state.fields ?? {};

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" name="fullName" required autoComplete="name" defaultValue={f.fullName ?? defaultName} />
      <Field label="Phone" name="phone" type="tel" required autoComplete="tel" placeholder="+234…" defaultValue={f.phone} />
      <Field label="Address" name="line1" required autoComplete="address-line1" className="sm:col-span-2" defaultValue={f.line1} />
      <Field
        label="Apartment, landmark (optional)"
        name="line2"
        autoComplete="address-line2"
        className="sm:col-span-2"
        defaultValue={f.line2}
      />
      <Field label="City" name="city" required autoComplete="address-level2" defaultValue={f.city} />
      <div>
        <label htmlFor="field-state" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
          State
        </label>
        <select
          id="field-state"
          name="state"
          required
          defaultValue={f.state ?? ""}
          autoComplete="address-level1"
          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-900"
        >
          <option value="" disabled>
            Choose a state
          </option>
          {NG_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <Field label="Postal code (optional)" name="postalCode" autoComplete="postal-code" defaultValue={f.postalCode} />
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input type="checkbox" name="isDefault" className="size-4 accent-neutral-950" /> Make this my default address
      </label>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton className="w-fit">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
