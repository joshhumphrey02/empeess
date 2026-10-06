import Link from "next/link";

import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  PAID: "bg-brand-soft text-brand",
  PROCESSING: "bg-sky-50 text-sky-800",
  SHIPPED: "bg-indigo-50 text-indigo-800",
  DELIVERED: "bg-emerald-50 text-emerald-800",
  CANCELLED: "bg-neutral-100 text-neutral-600",
  REFUNDED: "bg-neutral-100 text-neutral-600",
};

const STATUS_LABEL: Record<string, string> = { PENDING: "awaiting payment", PROCESSING: "packing" };

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide", STATUS_STYLE[status])}>
      {STATUS_LABEL[status] ?? status.toLowerCase()}
    </span>
  );
}

type OrderRow = {
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  items: number;
};

export function OrderList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 px-6 py-14 text-center">
        <p className="font-medium">No orders yet.</p>
        <Link href="/shop" className="mt-3 inline-block text-sm underline underline-offset-4">
          Start shopping
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
      {orders.map((o) => (
        <li key={o.orderNumber}>
          <Link
            href={`/account/orders/${o.orderNumber}`}
            className="grid grid-cols-2 items-center gap-3 py-5 transition-colors hover:bg-neutral-50 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:px-3"
          >
            <span>
              <span className="block font-medium">{o.orderNumber}</span>
              <span className="text-sm text-neutral-500">{formatDate(o.createdAt)}</span>
            </span>
            <span className="justify-self-end sm:justify-self-start">
              <StatusBadge status={o.status} />
            </span>
            <span className="text-sm text-neutral-600">
              {o.items} item{o.items === 1 ? "" : "s"}
            </span>
            <span className="justify-self-end font-medium">{formatMoney(o.total, o.currency)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
