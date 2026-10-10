import type { Metadata } from "next";

import { AddressBook } from "@/components/store/address-book";
import { db } from "@/prisma/db";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Addresses | EMPEESS" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.orm.public.Address.where({ userId: user.id }).orderBy((a) => a.createdAt.asc()).all();

  return (
    <section>
      <h1 className="mb-6 text-2xl font-medium tracking-tight">Addresses</h1>
      <AddressBook addresses={addresses} defaultName={user.name ?? undefined} />
    </section>
  );
}
