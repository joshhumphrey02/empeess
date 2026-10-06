import { IconAlertCircleFilled, IconCircleCheckFilled, IconClockHour4 } from "@tabler/icons-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { cancelMyOrder } from "@/app/actions/account";
import { SubmitButton } from "@/components/store/form-bits";
import { StatusBadge } from "@/components/store/order-bits";
import { PayNow } from "@/components/store/pay-now";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getOrder } from "@/server/orders";
import { expireStaleOrders, paymentDeadline } from "@/server/payments";

export async function generateMetadata({ params }: PageProps<"/account/orders/[orderNumber]">): Promise<Metadata> {
  return { title: `Order ${(await params).orderNumber} — EMPEESS` };
}

const STEPS = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const STEP_LABEL: Record<(typeof STEPS)[number], string> = { PAID: "Paid", PROCESSING: "Packing", SHIPPED: "Shipped", DELIVERED: "Delivered" };

const BANNERS = {
  success: { tone: "bg-emerald-50 text-emerald-900", Icon: IconCircleCheckFilled, title: "Payment received. Thank you!", body: "Your order is confirmed. We've emailed you a receipt and will let you know when it ships." },
  failed: { tone: "bg-red-50 text-red-900", Icon: IconAlertCircleFilled, title: "That payment didn't go through.", body: "Nothing was charged. You can try again below while your items are still reserved." },
  pending: { tone: "bg-amber-50 text-amber-900", Icon: IconClockHour4, title: "We're confirming your payment.", body: "This usually takes a few seconds. Refresh this page in a moment." },
  error: { tone: "bg-amber-50 text-amber-900", Icon: IconAlertCircleFilled, title: "Your order is placed, but we couldn't open the payment page.", body: "Your items are reserved. Use “Pay now” to try again." },
} as const;

export default async function OrderPage({ params, searchParams }: PageProps<"/account/orders/[orderNumber]">) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/account/orders/${orderNumber}`);
  await expireStaleOrders({ userId: user.id, limit: 5 }).catch(() => {});
  const order = await getOrder(user.id, orderNumber);
  if (!order) notFound();

  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const paid = order.payments.find((p) => p.status === "SUCCESS" || p.status === "REFUNDED");
  const channel = (paid?.rawResponse as { channel?: string } | null)?.channel?.replace(/_/g, " ");
  const bannerKey = String(query.payment ?? "");
  // A "failed" banner is stale once the order is paid; a "success" one can't apply to an unpaid order.
  const banner =
    bannerKey in BANNERS && !(bannerKey === "failed" && order.status !== "PENDING") && !(bannerKey === "success" && order.status === "PENDING")
      ? BANNERS[bannerKey as keyof typeof BANNERS]
      : order.status === "PENDING" && bannerKey === "success"
        ? BANNERS.pending
        : null;
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="space-y-10">
      {banner && (
        <div role="status" className={cn("flex items-start gap-3 rounded-3xl p-5", banner.tone)}>
          <banner.Icon className="size-6 shrink-0" />
          <div>
            <p className="font-medium">{banner.title}</p>
            <p className="text-sm">{banner.body}</p>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-neutral-500 hover:text-neutral-950">
            ← All orders
          </Link>
          <h1 className="mt-2 text-3xl font-medium tracking-tight">{order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {!cancelled && order.status !== "PENDING" && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
          {STEPS.map((step, i) => (
            <li key={step} className="space-y-2">
              <span className={cn("block h-1 rounded-full", i <= stepIndex ? "bg-neutral-950" : "bg-neutral-200")} />
              <span className={cn("block text-xs", i <= stepIndex ? "text-neutral-950" : "text-neutral-400")}>{STEP_LABEL[step]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-10 xl:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative aspect-3/4 w-20 shrink-0 overflow-hidden bg-neutral-100">
                {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.productName}</p>
                {item.variantLabel && <p className="text-sm text-neutral-500">{item.variantLabel}</p>}
                <p className="text-sm text-neutral-500">
                  {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                </p>
              </div>
              <p className="font-medium">{formatMoney(item.lineTotal, order.currency)}</p>
            </li>
          ))}
        </ul>

        <aside className="space-y-6">
          <dl className="space-y-3 rounded-3xl bg-canvas p-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatMoney(order.subtotal, order.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Delivery</dt>
              <dd>{order.shippingFee === 0 ? "Free" : formatMoney(order.shippingFee, order.currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatMoney(order.total, order.currency)}</dd>
            </div>
            <div className="flex justify-between text-neutral-600">
              <dt>Payment</dt>
              <dd className="capitalize">
                {order.status === "REFUNDED" ? "Refunded" : paid ? `Paid${channel ? ` · ${channel}` : ""}` : order.status === "PENDING" ? "Awaiting payment" : "Not paid"}
              </dd>
            </div>
          </dl>
          <div className="rounded-3xl border border-neutral-200 p-5 text-sm">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Delivering to</p>
            <p className="font-medium">{order.shippingFullName}</p>
            <p className="text-neutral-600">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            </p>
            <p className="text-neutral-600">
              {order.shippingCity}, {order.shippingState}
            </p>
            <p className="text-neutral-600">{order.shippingPhone}</p>
            {order.note && <p className="mt-3 text-neutral-600">Note: {order.note}</p>}
          </div>
          {order.status === "PENDING" && (
            <div className="rounded-3xl border border-brand/30 bg-brand-soft/50 p-5">
              <p className="mb-1 font-medium">Complete your payment</p>
              <p className="mb-4 text-sm text-neutral-600">Pay securely with card, bank transfer or USSD through Paystack.</p>
              <PayNow
                orderNumber={order.orderNumber}
                amount={formatMoney(order.total, order.currency)}
                deadline={paymentDeadline(order.createdAt).toISOString()}
              />
            </div>
          )}
          {order.status === "PENDING" && (
            <form action={cancelMyOrder}>
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <SubmitButton variant="outline" className="w-full">
                Cancel order
              </SubmitButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
