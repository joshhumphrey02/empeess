import {
  IconAlertTriangle,
  IconArrowRight,
  IconCash,
  IconPackages,
  IconPlus,
  IconReceipt,
  IconShoppingCart,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";

import { EmptyState, rowEnter, StatusPill } from "@/components/admin/kit";
import { KpiCard, SalesChart, StatusBars, TopProducts } from "@/components/admin/overview-charts";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { buttonVariants } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MovingBorderLink } from "@/components/ui/moving-border";
import { Spotlight } from "@/components/ui/spotlight";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { formatDate, formatMoney, variantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/server/admin/guard";
import { overviewStats } from "@/server/admin/sales";

export const metadata = { title: "Overview" };

const DAYS = 30;

export default async function AdminOverview() {
  const user = await requireAdmin("/admin");
  const s = await overviewStats(DAYS);

  const last = s.daily.slice(-DAYS);
  const series = (pick: (d: (typeof last)[number]) => number) => last.map((d) => ({ date: d.date, value: pick(d) }));
  const firstName = user.name?.split(" ")[0];
  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      {/* Hero: Aceternity spotlight beam over a dot grid. */}
      <section className="relative isolate overflow-hidden rounded-2xl border bg-card px-5 py-7 sm:px-8 sm:py-9">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_80%_70%_at_70%_0%,black,transparent)] bg-size-[18px_18px]"
        />
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand/20 blur-3xl" />
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" />

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand">{today}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              <TextGenerateEffect words={`Welcome back${firstName ? `, ${firstName}` : ""}.`} />
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here&apos;s how the store did over the last {DAYS} days. Cancelled and refunded orders are left out.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <MovingBorderLink href="/admin/products/new">
                <IconPlus /> Add product
              </MovingBorderLink>
              <Link href="/admin/orders" className={buttonVariants({ variant: "outline" })}>
                <IconReceipt /> Orders
              </Link>
              <Link href="/admin/inventory?filter=low" className={buttonVariants({ variant: "ghost" })}>
                <IconPackages /> Inventory
              </Link>
            </div>
          </div>

          {s.recentCustomers.length > 0 && (
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <AnimatedTooltip
                items={s.recentCustomers.map((c) => ({
                  id: c.id,
                  name: c.name ?? c.email.split("@")[0]!,
                  detail: `Joined ${formatDate(c.createdAt)}`,
                  image: c.avatarUrl,
                  href: `/admin/customers/${c.id}`,
                }))}
              />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{s.newCustomers}</span> new customer{s.newCustomers === 1 ? "" : "s"} this month
              </p>
            </div>
          )}
        </div>
      </section>

      {s.pending > 0 && (
        <Link
          href="/admin/orders?status=PENDING"
          className="group flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
        >
          <span className="flex items-center gap-3">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
            </span>
            <IconAlertTriangle className="size-4" aria-hidden />
            {s.pending} order{s.pending === 1 ? " is" : "s are"} waiting to be processed.
          </span>
          <span className="flex items-center gap-1 font-medium">
            Review <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Revenue"
          value={s.revenue}
          kind="money"
          delta={s.revenueChange}
          hint="vs prior 30 days"
          series={series((d) => d.revenue)}
          seriesLabel="Revenue"
          money
          icon={<IconCash />}
        />
        <KpiCard
          index={1}
          label="Orders"
          value={s.orders}
          delta={s.ordersChange}
          hint="vs prior 30 days"
          series={series((d) => d.orders)}
          seriesLabel="Orders"
          icon={<IconShoppingCart />}
        />
        <KpiCard
          index={2}
          label="Avg. order value"
          value={s.aov}
          kind="money"
          hint="per order, last 30 days"
          series={series((d) => (d.orders ? Math.round(d.revenue / d.orders) : 0))}
          seriesLabel="Avg. order"
          money
          icon={<IconReceipt />}
        />
        <KpiCard
          index={3}
          label="Customers"
          value={s.customers}
          hint={`+${s.newCustomers} new in 30 days`}
          series={series((d) => d.customers)}
          seriesLabel="Sign-ups"
          icon={<IconUsers />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SpotlightCard className="pb-0 xl:col-span-2" radius={420}>
          <SalesChart daily={s.daily} />
        </SpotlightCard>
        <SpotlightCard>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>All time. Click a bar to open those orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {s.byStatus.some((b) => b.count > 0) ? (
              <StatusBars
                data={s.byStatus.map((b) => ({ status: b.status, label: b.status.charAt(0) + b.status.slice(1).toLowerCase(), value: b.count }))}
              />
            ) : (
              <EmptyState title="No orders yet">Orders placed in the store appear here.</EmptyState>
            )}
          </CardContent>
        </SpotlightCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SpotlightCard>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Units sold, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>{s.topProducts.length ? <TopProducts items={s.topProducts} /> : <EmptyState title="No sales yet" />}</CardContent>
        </SpotlightCard>

        <SpotlightCard>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
            <CardDescription>5 or fewer left</CardDescription>
          </CardHeader>
          <CardContent>
            {s.lowStock.length ? (
              <ul className="-mx-2 space-y-0.5 text-sm">
                {s.lowStock.map((v, i) => {
                  const enter = rowEnter(i);
                  return (
                    <li key={v.id} className={enter.className} style={enter.style}>
                      <Link
                        href={`/admin/products/${v.product?.id}`}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{v.product?.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{variantLabel(v) || v.sku}</span>
                        </span>
                        {/* Stock meter: 5 cells, filled per unit left. */}
                        <span className="flex gap-0.5" aria-hidden>
                          {Array.from({ length: 5 }, (_, n) => (
                            <span
                              key={n}
                              className={cn(
                                "h-3 w-1.5 rounded-full",
                                n < v.stock ? (v.stock <= 2 ? "bg-red-500" : "bg-amber-500") : "bg-muted-foreground/20",
                              )}
                            />
                          ))}
                        </span>
                        <span
                          className={cn(
                            "w-14 shrink-0 text-right tabular-nums",
                            v.stock === 0 ? "font-medium text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {v.stock === 0 ? "Out" : `${v.stock} left`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="Everything is well stocked" />
            )}
            <Link href="/admin/inventory?filter=low" className="group mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Manage inventory <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </CardContent>
        </SpotlightCard>

        <SpotlightCard>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Newest first</CardDescription>
          </CardHeader>
          <CardContent>
            {s.recent.length ? (
              <ul className="-mx-2 space-y-0.5 text-sm">
                {s.recent.map((o, i) => {
                  const enter = rowEnter(i);
                  return (
                    <li key={o.id} className={enter.className} style={enter.style}>
                      <Link
                        href={`/admin/orders/${o.orderNumber}`}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                            {(o.user?.name ?? o.user?.email ?? "?").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium">{o.orderNumber}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {o.user?.name ?? o.user?.email} · {formatDate(o.createdAt)}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="tabular-nums">{formatMoney(o.total)}</span>
                          <StatusPill status={o.status} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No orders yet" />
            )}
          </CardContent>
        </SpotlightCard>
      </div>
    </div>
  );
}
