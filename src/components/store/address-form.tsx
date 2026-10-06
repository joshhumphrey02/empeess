"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { addAddress, updateAddress } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";

import { Field, FormMessage, SubmitButton } from "./form-bits";

const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

export type AddressValues = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  isDefault: boolean;
};

/** Add a new address, or edit `address` when given. `onSaved` receives the saved id. */
export function AddressForm({
  address,
  defaultName,
  submitLabel,
  onSaved,
  onCancel,
}: {
  address?: AddressValues;
  defaultName?: string;
  submitLabel?: string;
  onSaved?: (addressId: string) => void;
  onCancel?: () => void;
}) {
  const [state, action] = useActionState(address ? updateAddress : addAddress, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  const f = state.ok ? {} : (state.fields ?? {});
  const v = (key: keyof AddressValues) => f[key] ?? (address?.[key] as string | null | undefined) ?? undefined;

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message ?? "Saved.");
    if (!address) form.current?.reset();
    if (state.fields?.addressId) onSaved?.(state.fields.addressId);
    // Only a new action result should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const id = address?.id ?? "new";
  return (
    <form ref={form} action={action} className="grid gap-4 sm:grid-cols-2">
      {address && <input type="hidden" name="addressId" value={address.id} />}
      <Field id={`${id}-fullName`} label="Full name" name="fullName" required autoComplete="name" defaultValue={v("fullName") ?? defaultName} />
      <Field id={`${id}-phone`} label="Phone" name="phone" type="tel" required autoComplete="tel" placeholder="+234…" defaultValue={v("phone")} />
      <Field id={`${id}-line1`} label="Address" name="line1" required autoComplete="address-line1" className="sm:col-span-2" defaultValue={v("line1")} />
      <Field
        id={`${id}-line2`}
        label="Apartment, landmark (optional)"
        name="line2"
        autoComplete="address-line2"
        className="sm:col-span-2"
        defaultValue={v("line2")}
      />
      <Field id={`${id}-city`} label="City" name="city" required autoComplete="address-level2" defaultValue={v("city")} />
      <div>
        <label htmlFor={`${id}-state`} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-600">
          State
        </label>
        <select
          id={`${id}-state`}
          name="state"
          required
          defaultValue={v("state") ?? ""}
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
      <Field id={`${id}-postalCode`} label="Postal code (optional)" name="postalCode" autoComplete="postal-code" defaultValue={v("postalCode")} />
      {!address?.isDefault && (
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" name="isDefault" className="size-4 accent-neutral-950" /> Make this my default address
        </label>
      )}
      <div className="flex flex-col gap-3 sm:col-span-2">
        {state.error && <FormMessage state={state} />}
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton className="w-fit">{submitLabel ?? (address ? "Save changes" : "Save address")}</SubmitButton>
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-sm text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline">
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
