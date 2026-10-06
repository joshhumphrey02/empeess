import { IconCheck, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader, StatusPill } from "@/components/admin/kit";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/guard";
import { adminGetOrder, NEXT_STATUSES } from "@/server/admin/sales";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  return { title: `Order ${(await params).orderNumber}` };
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null;

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  await requireAdmin(`/admin/orders/${orderNumber}`);
  const order = await adminGetOrder(orderNumber);
  if (!order) notFound();

  const timeline = [
    { label: "Placed", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: "Shipped", at: order.shippedAt },
    { label: "Delivered", at: order.deliveredAt },
    { label: "Cancelled", at: order.cancelledAt },
  ].filter((t) => t.at);

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
              <OrderStatusActions orderNumber={order.orderNumber} next={NEXT_STATUSES[order.status]} />
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
                <div className="flex justify-between text-muted-foreground"><dt>Payment</dt><dd>Pay on delivery</dd></div>
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
        </div>
      </div>
    </>
  );
}
