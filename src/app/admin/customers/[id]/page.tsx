import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState, PageHeader, rowEnter, StatusPill } from "@/components/admin/kit";
import { RoleSwitch } from "@/components/admin/small-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { isSale } from "@/lib/store-config";
import { requireAdmin } from "@/server/admin/guard";
import { adminGetCustomer } from "@/server/admin/sales";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const admin = await requireAdmin(`/admin/customers/${id}`);
  const user = await adminGetCustomer(id).catch(() => null);
  if (!user) notFound();

  const counted = user.orders.filter((o) => isSale(o.status));
  const spent = counted.reduce((n, o) => n + o.total, 0);

  return (
    <>
      <PageHeader
        title={user.name ?? user.email}
        description={`${user.email} · joined ${formatDate(user.createdAt)}`}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="h-fit gap-0 overflow-hidden pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Orders ({user.orders.length})</CardTitle>
          </CardHeader>
          {user.orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.orders.map((o, i) => (
                  <TableRow key={o.id} className={`relative ${rowEnter(i).className}`} style={rowEnter(i).style}>
                    <TableCell className="pl-4">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium after:absolute after:inset-0 hover:text-brand">
                        {o.orderNumber}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                    </TableCell>
                    <TableCell><StatusPill status={o.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{o.items ?? 0}</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">{formatMoney(o.total, o.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <div className="grid h-fit gap-4">
          <SpotlightCard className="pt-0">
            {/* Profile header: brand gradient strip with the avatar overlapping it. */}
            <div className="h-20 bg-linear-to-br from-chart-1 via-chart-2 to-chart-3" aria-hidden />
            <div className="-mt-12 flex flex-col items-center gap-1 px-(--card-spacing) text-center">
              <Avatar className="size-16 border-4 border-card">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback className="bg-brand-soft text-lg font-semibold text-brand">{(user.name ?? user.email).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="mt-1 font-medium">{user.name ?? "-"}</p>
              <StatusPill status={user.role} />
            </div>
            <dl className="grid grid-cols-2 gap-3 px-(--card-spacing) text-sm">
              <div className="rounded-lg bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Spent</dt>
                <dd className="text-lg font-semibold">
                  <NumberTicker value={spent} kind="money" />
                </dd>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Orders</dt>
                <dd className="text-lg font-semibold">
                  <NumberTicker value={counted.length} />
                </dd>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Reviews</dt>
                <dd className="tabular-nums">{user.reviews}</dd>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">Sign-in</dt>
                <dd className="capitalize">{[user.passwordHash ? "Email" : null, ...user.accounts.map((a) => a.provider)].filter(Boolean).join(", ")}</dd>
              </div>
            </dl>
          </SpotlightCard>
          <Card>
            <CardContent>
              <RoleSwitch userId={user.id} isAdmin={user.role === "ADMIN"} isSelf={user.id === admin.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {user.addresses.length === 0 && <p className="text-muted-foreground">None saved.</p>}
              {user.addresses.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {a.fullName} {a.isDefault && <span className="text-xs font-normal text-muted-foreground">(default)</span>}
                  </p>
                  <p className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                  <p className="text-muted-foreground">{a.city}, {a.state}</p>
                  <p className="text-muted-foreground">{a.phone}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
