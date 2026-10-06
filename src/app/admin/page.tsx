import { IconAlertTriangle, IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import Link from "next/link";

import { EmptyState, PageHeader, StatusPill } from "@/components/admin/kit";
import { HorizontalBars, RevenueChart } from "@/components/admin/overview-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMoney, variantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/guard";
import { overviewStats } from "@/server/admin/sales";

export const metadata = { title: "Overview" };

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">no prior data</span>;
  const up = value >= 0;
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}
      {(value * 100).toFixed(0)}% <span className="font-normal text-muted-foreground">vs prior 30d</span>
    </span>
  );
}

export default async function AdminOverview() {
  const user = await requireAdmin("/admin");
  const s = await overviewStats(30);

  const kpis = [
    { label: "Revenue", value: formatMoney(s.revenue), delta: <Delta value={s.revenueChange} /> },
    { label: "Orders", value: String(s.orders), delta: <Delta value={s.ordersChange} /> },
    { label: "Avg. order value", value: formatMoney(s.aov), delta: <span className="text-xs text-muted-foreground">last 30 days</span> },
    { label: "Customers", value: String(s.customers), delta: <span className="text-xs text-muted-foreground">+{s.newCustomers} new in 30 days</span> },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Last 30 days, excluding cancelled and refunded orders."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} size="sm">
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
            <CardContent>{k.delta}</CardContent>
          </Card>
        ))}
      </div>

      {s.pending > 0 && (
        <Link
          href="/admin/orders?status=PENDING"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <span className="flex items-center gap-2">
            <IconAlertTriangle className="size-4" aria-hidden />
            {s.pending} order{s.pending === 1 ? " is" : "s are"} waiting to be processed.
          </span>
          <span className="font-medium">Review →</span>
        </Link>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue per day</CardTitle>
            <CardDescription>Hover for the day&apos;s total and order count.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={s.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            {s.byStatus.some((b) => b.count > 0) ? (
              <HorizontalBars
                valueLabel="Orders"
                data={s.byStatus.map((b) => ({ label: b.status.charAt(0) + b.status.slice(1).toLowerCase(), value: b.count }))}
              />
            ) : (
              <EmptyState title="No orders yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Units sold, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {s.topProducts.length ? (
              <HorizontalBars valueLabel="Units" data={s.topProducts.map((p) => ({ label: p.name, value: p.units }))} />
            ) : (
              <EmptyState title="No sales yet" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>5 or fewer left</CardDescription>
          </CardHeader>
          <CardContent>
            {s.lowStock.length ? (
              <ul className="divide-y text-sm">
                {s.lowStock.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/admin/products/${v.product?.id}`} className="min-w-0 hover:underline">
                      <span className="block truncate font-medium">{v.product?.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{variantLabel(v) || v.sku}</span>
                    </Link>
                    <span className={cn("shrink-0 tabular-nums", v.stock === 0 ? "font-medium text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
                      {v.stock === 0 ? "Out" : `${v.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Everything is well stocked" />
            )}
            <Link href="/admin/inventory?filter=low" className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground">
              Manage inventory →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {s.recent.length ? (
              <ul className="divide-y text-sm">
                {s.recent.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.orderNumber}`} className="flex items-center justify-between gap-3 py-2 hover:bg-muted/50">
                      <span className="min-w-0">
                        <span className="block font-medium">{o.orderNumber}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.user?.name ?? o.user?.email} · {formatDate(o.createdAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tabular-nums">{formatMoney(o.total)}</span>
                        <StatusPill status={o.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No orders yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
