"use client";

import { IconBuildingBank, IconCreditCard, IconDeviceMobile, IconLock, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { checkout } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { AddressForm, type AddressValues } from "./address-form";
import { SubmitButton } from "./form-bits";

/**
 * Delivery address (choose one; adding or editing happens in a dialog and the
 * saved address is selected), delivery note, then pay with Paystack.
 */
export function CheckoutForm({
  addresses,
  total,
  defaultName,
  paymentsReady,
}: {
  addresses: AddressValues[];
  total: string;
  defaultName?: string;
  paymentsReady: boolean;
}) {
  const [state, action] = useActionState(checkout, initialFormState);
  const fallback = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [selected, setSelected] = useState<string | undefined>(fallback?.id);
  // Which address the dialog is editing; "new" for a blank form.
  const [dialog, setDialog] = useState<AddressValues | "new" | null>(null);
  // A just-saved address arrives with the next server render; select it then.
  const chosen = addresses.some((a) => a.id === selected) ? selected : fallback?.id;
  const editing = dialog && dialog !== "new" ? dialog : undefined;

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-medium tracking-tight">1. Delivery address</h2>
          {addresses.length > 0 && (
            <button type="button" onClick={() => setDialog("new")} className="inline-flex items-center gap-1 text-sm text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline">
              <IconPlus className="size-4" aria-hidden /> New address
            </button>
          )}
        </div>

        {addresses.length > 0 ? (
          <div role="radiogroup" aria-label="Delivery address" className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              // The edit button sits beside the label, not inside it.
              <div key={a.id} className="relative">
                <label className="flex h-full cursor-pointer gap-3 rounded-3xl border border-neutral-200 p-5 pr-16 text-sm transition-colors hover:border-neutral-400 has-checked:border-neutral-950 has-checked:bg-canvas">
                  <input
                    type="radio"
                    name="address-choice"
                    value={a.id}
                    checked={chosen === a.id}
                    onChange={() => setSelected(a.id)}
                    className="mt-1 accent-neutral-950"
                  />
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
                <button
                  type="button"
                  onClick={() => setDialog(a)}
                  aria-label={`Edit address for ${a.fullName}`}
                  className="absolute right-4 top-4 inline-flex items-center gap-1 text-xs text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline"
                >
                  <IconPencil className="size-3.5" aria-hidden /> Edit
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDialog("new")}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-neutral-300 py-8 text-sm text-neutral-600 transition-colors hover:border-brand hover:text-brand"
          >
            <IconPlus className="size-4" aria-hidden /> Add a delivery address
          </button>
        )}

        <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
          <DialogContent
            showCloseButton={false}
            className="max-h-[calc(100svh-2rem)] gap-6 overflow-y-auto rounded-3xl bg-white p-6 text-neutral-950 ring-neutral-950/10 sm:max-w-xl sm:p-8"
          >
            <DialogHeader className="pr-10">
              <DialogTitle className="text-xl tracking-tight">{editing ? "Edit address" : "New delivery address"}</DialogTitle>
              <DialogDescription className="text-neutral-600">
                {editing ? "Changes apply to this order and your saved addresses." : "Where should we deliver your order?"}
              </DialogDescription>
            </DialogHeader>
            <DialogClose
              aria-label="Close"
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            >
              <IconX className="size-5" stroke={1.5} aria-hidden />
            </DialogClose>
            {dialog && (
              <AddressForm
                key={editing?.id ?? "new"}
                address={editing}
                defaultName={defaultName}
                submitLabel={editing ? "Save changes" : "Save and use this address"}
                onSaved={(id) => {
                  setSelected(id);
                  setDialog(null);
                }}
                onCancel={() => setDialog(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </section>

      <form action={action} className="space-y-10">
        <input type="hidden" name="addressId" value={chosen ?? ""} />

        <label className="block">
          <span className="mb-3 block text-xl font-medium tracking-tight">2. Delivery note <span className="text-sm font-normal text-neutral-500">(optional)</span></span>
          <textarea
            name="note"
            rows={3}
            maxLength={500}
            placeholder="Gate code, landmark, best time to call…"
            className="w-full rounded-2xl border border-neutral-200 p-4 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <fieldset>
          <legend className="mb-4 text-xl font-medium tracking-tight">3. Payment</legend>
          <div className="rounded-3xl border border-neutral-950 bg-canvas p-5 text-sm">
            <p className="flex items-center gap-2 font-medium text-neutral-950">
              <IconLock className="size-4 text-brand" aria-hidden /> Pay securely with Paystack
            </p>
            <p className="mt-1 text-neutral-600">You&apos;ll be taken to Paystack to finish paying, then brought back to your order.</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-700">
              {[
                { Icon: IconCreditCard, label: "Card" },
                { Icon: IconBuildingBank, label: "Bank transfer" },
                { Icon: IconDeviceMobile, label: "USSD" },
              ].map(({ Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-neutral-200">
                  <Icon className="size-3.5" aria-hidden /> {label}
                </li>
              ))}
            </ul>
          </div>
          {!paymentsReady && (
            <p role="alert" className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Online payment isn&apos;t available right now. Please check back shortly.
            </p>
          )}
        </fieldset>

        <SubmitButton disabled={!chosen || !paymentsReady} className="w-full bg-brand hover:bg-brand/90 sm:w-auto">
          <IconLock className="size-4" aria-hidden /> Pay {total}
        </SubmitButton>
        {!chosen && <p className="text-sm text-neutral-500">Add a delivery address to continue.</p>}
      </form>
    </div>
  );
}
