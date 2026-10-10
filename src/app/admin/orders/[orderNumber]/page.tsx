import { IconCheck, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader, StatusPill } from "@/components/admin/kit";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { formatMoney } from "@/lib/format";
import { PAYMENT_WINDOW_MINUTES } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import { requireAccess } from "@/server/admin/guard";
import { adminGetOrder, NEXT_STATUSES } from "@/server/admin/sales";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  return { title: `Order ${(await params).orderNumber}` };
}

const PAYMENT_TONE: Record<string, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  FAILED: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-300",
  REFUNDED: "bg-muted text-muted-foreground",
};
function PaymentPill({ status }: { status: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", PAYMENT_TONE[status])}>{status.toLowerCase()}</span>;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null;

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  await requireAccess("orders", `/admin/orders/${orderNumber}`);
  const order = await adminGetOrder(orderNumber);
  if (!order) notFound();

  const timeline = [
    { label: "Placed", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: "Shipped", at: order.shippedAt },
    { label: "Delivered", at: order.deliveredAt },
    { label: "Cancelled", at: order.cancelledAt },
  ].filter((t) => t.at);

  const paid = order.payments.find((p) => p.status === "SUCCESS") ?? null;

  // Fulfilment progress for the stepper; cancelled/refunded orders stop where they were.
  const STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
  const stopped = order.status === "CANCELLED" || order.status === "REFUNDED";
  const reached = stopped
    ? order.deliveredAt
      ? 4
      : order.shippedAt
        ? 3
        : order.paidAt
          ? 1
          : 0
    : STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusPill status={order.status} /> Placed {when(order.createdAt)}
          </span>
        }
      />

      <SpotlightCard className="mb-4">
        <ol className="flex items-start px-(--card-spacing)" aria-label="Fulfilment progress">
          {STEPS.map((step, i) => {
            const done = i <= reached;
            const current = i === reached && !stopped;
            return (
              <li key={step} className="relative flex flex-1 flex-col items-center gap-2 text-center last:flex-none sm:last:flex-1">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-1/2 top-4 h-0.5 w-full bg-muted" aria-hidden>
                    {i < reached && <span className="block h-full origin-left animate-grow-x bg-brand" style={{ animationDelay: `${i * 150}ms` }} />}
                  </span>
                )}
                <span
                  className={cn(
                    "relative grid size-8 place-items-center rounded-full border-2 text-xs font-semibold transition-colors",
                    done ? "border-brand bg-brand text-primary-foreground" : "border-border bg-card text-muted-foreground",
                    current && "ring-4 ring-brand/20",
                  )}
                >
                  {current && <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" aria-hidden />}
                  {done && !current ? <IconCheck className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn("text-xs", done ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {step.charAt(0) + step.slice(1).toLowerCase()}
                  <span className="sr-only">{done ? " (done)" : ""}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {stopped && (
          <p className="mx-(--card-spacing) flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
            <IconX className="size-4" aria-hidden /> This order was {order.status.toLowerCase()}.
          </p>
        )}
      </SpotlightCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid h-fit gap-4">
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusActions
                orderNumber={order.orderNumber}
                next={NEXT_STATUSES[order.status]}
                refundable={paid ? formatMoney(paid.amount, paid.currency) : null}
              />
              {order.status === "PENDING" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Awaiting payment. Unpaid orders are cancelled automatically {PAYMENT_WINDOW_MINUTES} minutes after they&apos;re placed.
                </p>
              )}
              {order.status === "CANCELLED" && paid && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  This order was paid after it had been cancelled and the items had sold out. Refund the customer.
                </p>
              )}
            </CardContent>
          </SpotlightCard>

          <SpotlightCard>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li key={item.id} className="group flex items-center gap-3 py-3 text-sm">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.variantLabel, item.sku].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="text-muted-foreground tabular-nums">
                      {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                    </p>
                    <p className="w-24 text-right font-medium tabular-nums">{formatMoney(item.lineTotal, order.currency)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid gap-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatMoney(order.subtotal, order.currency)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{order.shippingFee ? formatMoney(order.shippingFee, order.currency) : "Free"}</dd></div>
                {order.discount > 0 && (
                  <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums">−{formatMoney(order.discount, order.currency)}</dd></div>
                )}
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatMoney(order.total, order.currency)}</dd></div>
                <div className="flex justify-between text-muted-foreground"><dt>Payment</dt><dd>{paid ? "Paid with Paystack" : order.status === "REFUNDED" ? "Refunded" : "Not paid"}</dd></div>
              </dl>
            </CardContent>
          </SpotlightCard>
        </div>

        <div className="grid h-fit gap-4">
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {order.user ? (
                <Link href={`/admin/customers/${order.user.id}`} className="font-medium hover:text-brand">
                  {order.user.name ?? order.user.email}
                </Link>
              ) : (
                <p>Deleted account</p>
              )}
              <p className="text-muted-foreground">{order.user?.email}</p>
            </CardContent>
          </SpotlightCard>
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Deliver to</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <p className="font-medium">{order.shippingFullName}</p>
              <p>{order.shippingLine1}</p>
              {order.shippingLine2 && <p>{order.shippingLine2}</p>}
              <p>
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode ?? ""}
              </p>
              <a href={`tel:${order.shippingPhone.replace(/\s/g, "")}`} className="text-muted-foreground hover:text-foreground">
                {order.shippingPhone}
              </a>
              {order.note && <p className="mt-3 rounded-lg bg-muted p-2 text-muted-foreground">“{order.note}”</p>}
            </CardContent>
          </SpotlightCard>
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative grid gap-3 border-l pl-4 text-sm">
                {timeline.map((t, i) => (
                  <li key={t.label} className="relative animate-in fade-in-0 slide-in-from-left-2 fill-mode-both duration-500" style={{ animationDelay: `${i * 90}ms` }}>
                    {/* Positioned against the li (its animation transform makes it the containing block): pl-4 + half the dot. */}
                    <span
                      className={cn("absolute -left-[21px] top-1.5 size-2.5 rounded-full", t.label === "Cancelled" ? "bg-red-500" : "bg-brand", i === timeline.length - 1 && "ring-4 ring-brand/20")}
                      aria-hidden
                    />
                    <span className="font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{when(t.at)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </SpotlightCard>
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {order.payments.length === 0 && <p className="text-muted-foreground">No payment attempts yet.</p>}
              {order.payments.map((p) => {
                const raw = (p.rawResponse ?? {}) as { channel?: string | null; gateway_response?: string | null };
                return (
                  <div key={p.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium tabular-nums">{formatMoney(p.amount, p.currency)}</span>
                      <PaymentPill status={p.status} />
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{p.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {[raw.channel && `via ${raw.channel.replace(/_/g, " ")}`, raw.gateway_response, when(p.paidAt ?? p.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </SpotlightCard>
        </div>
      </div>
    </>
  );
}
