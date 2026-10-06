import type { Metadata } from "next";

import { deleteAddress, setDefaultAddress } from "@/app/actions/account";
import { AddressForm } from "@/components/store/address-form";
import { SubmitButton } from "@/components/store/form-bits";
import { db } from "@/prisma/db";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Addresses — EMPEESS" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.orm.public.Address.where({ userId: user.id }).orderBy((a) => a.createdAt.asc()).all();

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-6 text-2xl font-medium tracking-tight">Addresses</h1>
        {addresses.length === 0 ? (
          <p className="text-sm text-neutral-600">No saved addresses yet.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="flex flex-col rounded-3xl border border-neutral-200 p-5 text-sm">
                <p className="font-medium">
                  {a.fullName}
                  {a.isDefault && (
                    <span className="ml-2 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                      Default
                    </span>
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
                <div className="mt-4 flex gap-5">
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
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-canvas p-6">
        <h2 className="mb-6 text-xl font-medium tracking-tight">Add an address</h2>
        <AddressForm defaultName={user.name ?? undefined} />
      </section>
    </div>
  );
}
