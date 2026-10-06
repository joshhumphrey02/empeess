import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader, StatusPill } from "@/components/admin/kit";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
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

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusActions orderNumber={order.orderNumber} next={NEXT_STATUSES[order.status]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
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
          </Card>
        </div>

        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {order.user ? (
                <Link href={`/admin/customers/${order.user.id}`} className="font-medium hover:underline">
                  {order.user.name ?? order.user.email}
                </Link>
              ) : (
                <p>Deleted account</p>
              )}
              <p className="text-muted-foreground">{order.user?.email}</p>
            </CardContent>
          </Card>
          <Card>
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
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative grid gap-3 border-l pl-4 text-sm">
                {timeline.map((t) => (
                  <li key={t.label}>
                    <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-foreground" aria-hidden />
                    <span className="font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{when(t.at)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
