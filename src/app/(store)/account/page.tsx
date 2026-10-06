import type { Metadata } from "next";
import Link from "next/link";

import { OrderList } from "@/components/store/order-bits";
import { formatMoney } from "@/lib/format";
import { db } from "@/prisma/db";
import { requireUser } from "@/server/auth/session";
import { listOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Your account — EMPEESS" };

export default async function AccountOverview() {
  const user = await requireUser("/account");
  const [recent, stats, address] = await Promise.all([
    listOrders(user.id, 3),
    db.orm.public.Order.where((o) => o.userId.eq(user.id))
      .where((o) => o.status.neq("CANCELLED"))
      .aggregate((a) => ({ orders: a.count(), spent: a.sum("total") })),
    db.orm.public.Address.where({ userId: user.id, isDefault: true }).first(),
  ]);

  const cards = [
    { label: "Orders", value: String(stats.orders) },
    { label: "Total spent", value: formatMoney(stats.spent ?? 0) },
    { label: "Default address", value: address ? `${address.city}, ${address.state}` : "None yet", href: "/account/addresses" },
  ];

  return (
    <div className="space-y-12">
      <ul className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.label} className="rounded-3xl bg-canvas p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{c.label}</p>
            <p className="mt-2 text-2xl font-medium tracking-tight">{c.value}</p>
            {c.href && (
              <Link href={c.href} className="mt-2 inline-block text-xs underline underline-offset-4">
                Manage
              </Link>
            )}
          </li>
        ))}
      </ul>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-medium tracking-tight">Recent orders</h2>
          {recent.length > 0 && (
            <Link href="/account/orders" className="text-sm underline underline-offset-4">
              View all
            </Link>
          )}
        </div>
        <OrderList orders={recent} />
      </section>
    </div>
  );
}
