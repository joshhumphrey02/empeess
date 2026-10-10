import { IconShieldStar, IconUserPlus, IconUsers } from "@tabler/icons-react";
import Link from "next/link";

import { AdminPagination, EmptyState, PageHeader, rowEnter, SearchBox, SortHeader, StatCards, StatusPill, withQuery } from "@/components/admin/kit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { requireAccess } from "@/server/admin/guard";
import { adminListCustomers, customerSummary } from "@/server/admin/sales";

export const metadata = { title: "Customers" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAccess("customers", "/admin/customers");
  const sp = await searchParams;
  const q = one(sp.q);
  const role = one(sp.role);
  const page = Number(one(sp.page)) || 1;
  const sort = one(sp.sort);
  const [result, summary] = await Promise.all([adminListCustomers({ q, role, page, sort }), customerSummary()]);
  const href = (patch: Record<string, string | number | undefined>) => withQuery("/admin/customers", { q, role, sort, ...patch });
  const sortHref = (next: string) => href({ sort: next || undefined, page: undefined });

  return (
    <>
      <PageHeader title="Customers" description="Everyone with an account. Click a row for their orders and addresses." />
      <StatCards
        className="lg:grid-cols-4"
        items={[
          { key: "all", label: "Everyone", value: summary.customers + summary.admins + summary.staff, icon: <IconUsers />, href: href({ role: undefined, page: undefined }), active: !role },
          { key: "CUSTOMER", label: "Customers", value: summary.customers, icon: <IconUsers />, tone: "success", href: href({ role: "CUSTOMER", page: undefined }), active: role === "CUSTOMER" },
          { key: "ADMIN", label: "Admins", value: summary.admins, icon: <IconShieldStar />, hint: "Can open this dashboard", href: href({ role: "ADMIN", page: undefined }), active: role === "ADMIN" },
          { key: "new", label: "New this month", value: summary.newThisMonth, icon: <IconUserPlus />, tone: "warning", hint: "Signed up in 30 days" },
        ]}
      />
      <div className="mb-4 flex justify-end">
        <SearchBox action="/admin/customers" placeholder="Name or email" q={q} keep={{ role, sort }} />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        {result.users.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Customer" field="name" sort={sort} defaultSort="-joined" hrefFor={sortHref} className="pl-4" />
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Sign-in</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <SortHeader label="Joined" field="joined" sort={sort} defaultSort="-joined" hrefFor={sortHref} className="hidden pr-4 lg:table-cell" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.users.map((u, i) => (
                <TableRow key={u.id} className={`relative ${rowEnter(i).className}`} style={rowEnter(i).style}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                        <AvatarFallback className="bg-brand-soft text-xs font-medium text-brand">{(u.name ?? u.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link href={`/admin/customers/${u.id}`} className="block truncate font-medium after:absolute after:inset-0 hover:text-brand">
                          {u.name ?? "-"}
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={u.role} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {[u.passwordHash ? "Email" : null, ...u.accounts.map((a) => a.provider[0]!.toUpperCase() + a.provider.slice(1))].filter(Boolean).join(", ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.orders.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(u.orders.spent ?? 0)}</TableCell>
                  <TableCell className="hidden pr-4 text-muted-foreground lg:table-cell">{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
      </Card>
    </>
  );
}
