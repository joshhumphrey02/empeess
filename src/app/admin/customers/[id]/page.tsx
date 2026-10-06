import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState, PageHeader, StatusPill } from "@/components/admin/kit";
import { RoleSwitch } from "@/components/admin/small-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { adminGetCustomer } from "@/server/admin/sales";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const admin = await requireAdmin(`/admin/customers/${id}`);
  const user = await adminGetCustomer(id).catch(() => null);
  if (!user) notFound();

  const counted = user.orders.filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED");
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
                {user.orders.map((o) => (
                  <TableRow key={o.id} className="relative">
                    <TableCell className="pl-4">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium after:absolute after:inset-0 hover:underline">
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
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Spent</dt><dd className="text-lg font-semibold tabular-nums">{formatMoney(spent)}</dd></div>
                <div><dt className="text-muted-foreground">Orders</dt><dd className="text-lg font-semibold tabular-nums">{counted.length}</dd></div>
                <div><dt className="text-muted-foreground">Reviews</dt><dd className="tabular-nums">{user.reviews}</dd></div>
                <div>
                  <dt className="text-muted-foreground">Sign-in</dt>
                  <dd>{[user.passwordHash ? "Email" : null, ...user.accounts.map((a) => a.provider)].filter(Boolean).join(", ")}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
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
