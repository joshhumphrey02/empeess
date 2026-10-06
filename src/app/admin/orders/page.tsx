import Link from "next/link";

import { AdminPagination, EmptyState, FilterTabs, PageHeader, SearchBox, StatusPill, withQuery } from "@/components/admin/kit";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { db } from "@/prisma/db";
import { requireAdmin } from "@/server/admin/guard";
import { adminListOrders, ORDER_STATUSES } from "@/server/admin/sales";

export const metadata = { title: "Orders" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const sp = await searchParams;
  const q = one(sp.q);
  const status = one(sp.status);
  const page = Number(one(sp.page)) || 1;
  const [result, counts] = await Promise.all([
    adminListOrders({ q, status, page }),
    db.orm.public.Order.groupBy("status").aggregate((a) => ({ count: a.count() })),
  ]);
  const all = counts.reduce((n, c) => n + c.count, 0);
  const href = (patch: Record<string, string | number | undefined>) => withQuery("/admin/orders", { q, status, ...patch });

  return (
    <>
      <PageHeader title="Orders" description="Move orders through fulfilment and keep customers up to date." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          active={status ?? "all"}
          hrefFor={(v) => href({ status: v === "all" ? undefined : v, page: undefined })}
          options={[
            { value: "all", label: "All", count: all },
            ...ORDER_STATUSES.map((s) => ({
              value: s,
              label: s.charAt(0) + s.slice(1).toLowerCase(),
              count: counts.find((c) => c.status === s)?.count ?? 0,
            })),
          ]}
        />
        <SearchBox action="/admin/orders" placeholder="Order #, name or email" q={q} keep={{ status }} />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        {result.orders.length === 0 ? (
          <EmptyState title={q || status ? "No orders match" : "No orders yet"}>Orders placed in the store appear here.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="pr-4 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.orders.map((o) => (
                <TableRow key={o.id} className="relative">
                  <TableCell className="pl-4">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium after:absolute after:inset-0 hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block">{o.shippingFullName}</span>
                    <span className="block text-xs text-muted-foreground">{o.user?.email}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={o.status} />
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{o.items ?? 0}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{formatMoney(o.total, o.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination page={result.page} pageCount={result.pageCount} total={result.total} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
      </Card>
    </>
  );
}
