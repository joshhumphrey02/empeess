import Link from "next/link";

import { AdminPagination, EmptyState, FilterTabs, PageHeader, SearchBox, StatusPill, withQuery } from "@/components/admin/kit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { requireAdmin } from "@/server/admin/guard";
import { adminListCustomers } from "@/server/admin/sales";

export const metadata = { title: "Customers" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin("/admin/customers");
  const sp = await searchParams;
  const q = one(sp.q);
  const role = one(sp.role);
  const page = Number(one(sp.page)) || 1;
  const result = await adminListCustomers({ q, role, page });
  const href = (patch: Record<string, string | number | undefined>) => withQuery("/admin/customers", { q, role, ...patch });

  return (
    <>
      <PageHeader title="Customers" description="Everyone with an account." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          active={role ?? "all"}
          hrefFor={(v) => href({ role: v === "all" ? undefined : v, page: undefined })}
          options={[
            { value: "all", label: "All" },
            { value: "CUSTOMER", label: "Customers" },
            { value: "ADMIN", label: "Admins" },
          ]}
        />
        <SearchBox action="/admin/customers" placeholder="Name or email" q={q} keep={{ role }} />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        {result.users.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Customer</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Sign-in</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="hidden pr-4 lg:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.users.map((u) => (
                <TableRow key={u.id} className="relative">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                        <AvatarFallback className="text-xs">{(u.name ?? u.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link href={`/admin/customers/${u.id}`} className="block truncate font-medium after:absolute after:inset-0 hover:underline">
                          {u.name ?? "—"}
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
        <AdminPagination page={result.page} pageCount={result.pageCount} total={result.total} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
      </Card>
    </>
  );
}
