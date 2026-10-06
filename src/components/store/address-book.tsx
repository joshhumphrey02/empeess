"use client";

import { IconPencil, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

import { deleteAddress, setDefaultAddress } from "@/app/actions/account";

import { AddressForm, type AddressValues } from "./address-form";
import { SubmitButton } from "./form-bits";

/** Saved addresses with edit-in-place, plus an add form. */
export function AddressBook({ addresses, defaultName }: { addresses: AddressValues[]; defaultName?: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(addresses.length === 0);

  return (
    <div className="space-y-6">
      {addresses.length === 0 && !adding && <p className="text-sm text-neutral-600">No saved addresses yet.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <li key={a.id} className="rounded-3xl border border-neutral-950 p-5 md:col-span-2">
              <p className="mb-4 font-medium">Edit address</p>
              <AddressForm address={a} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
            </li>
          ) : (
            <li key={a.id} className="flex flex-col rounded-3xl border border-neutral-200 p-5 text-sm transition-colors hover:border-neutral-400">
              <p className="font-medium">
                {a.fullName}
                {a.isDefault && (
                  <span className="ml-2 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">Default</span>
                )}
              </p>
              <p className="mt-1 text-neutral-600">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </p>
              <p className="text-neutral-600">
                {a.city}, {a.state}
                {a.postalCode ? ` ${a.postalCode}` : ""}
              </p>
              <p className="text-neutral-600">{a.phone}</p>
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => setEditing(a.id)}
                  className="inline-flex items-center gap-1 text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline"
                >
                  <IconPencil className="size-3.5" aria-hidden /> Edit
                </button>
                {!a.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="addressId" value={a.id} />
                    <SubmitButton variant="ghost">Make default</SubmitButton>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="addressId" value={a.id} />
                  <SubmitButton variant="ghost" className="hover:text-red-600">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <section className="rounded-3xl bg-canvas p-6">
          <h2 className="mb-6 text-xl font-medium tracking-tight">Add an address</h2>
          <AddressForm
            defaultName={defaultName}
            onSaved={() => setAdding(false)}
            onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-neutral-300 py-6 text-sm text-neutral-600 transition-colors hover:border-brand hover:text-brand"
        >
          <IconPlus className="size-4" aria-hidden /> Add a new address
        </button>
      )}
    </div>
  );
}
