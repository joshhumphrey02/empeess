import type { Metadata } from "next";
import Link from "next/link";

import { OrderList } from "@/components/store/order-bits";
import { VerifyEmailBanner } from "@/components/store/verify-email-banner";
import { formatMoney } from "@/lib/format";
import { SALE_STATUSES } from "@/lib/store-config";
import { db } from "@/prisma/db";
import { requireUser } from "@/server/auth/session";
import { listOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Your account — EMPEESS" };

const NOTICES = {
  reset: { tone: "bg-emerald-50 text-emerald-900", text: "Your password has been changed and you're signed in. Other devices were signed out." },
  verified: { tone: "bg-emerald-50 text-emerald-900", text: "Thanks! Your email is confirmed." },
  expired: { tone: "bg-amber-50 text-amber-900", text: "That confirmation link has expired or was already used. Send a new one below." },
} as const;

export default async function AccountOverview({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const query = await searchParams;
  const notice =
    query.reset === "1" ? NOTICES.reset : query.verified === "1" ? NOTICES.verified : query.verified === "expired" ? NOTICES.expired : null;
  const [recent, stats, address] = await Promise.all([
    listOrders(user.id, 3),
    db.orm.public.Order.where((o) => o.userId.eq(user.id))
      .where((o) => o.status.in([...SALE_STATUSES]))
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
      <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
      {(notice || !user.emailVerified) && (
        <div className="-mt-6 space-y-3">
          {notice && (
            <p role="status" className={`rounded-3xl px-5 py-4 text-sm ${notice.tone}`}>
              {notice.text}
            </p>
          )}
          {!user.emailVerified && <VerifyEmailBanner email={user.email} />}
        </div>
      )}
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
