import { IconDownload, IconMailCheck, IconMailOff, IconUserPlus } from "@tabler/icons-react";

import { AdminPagination, EmptyState, PageHeader, rowEnter, SearchBox, StatCards, withQuery } from "@/components/admin/kit";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { adminListSubscribers, subscriberSummary } from "@/server/admin/engage";
import { requireAccess } from "@/server/admin/guard";

export const metadata = { title: "Subscribers" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  await requireAccess("subscribers", "/admin/subscribers");
  const sp = await searchParams;
  const q = one(sp.q);
  const status = one(sp.status);
  const page = Number(one(sp.page)) || 1;
  const [result, sum] = await Promise.all([adminListSubscribers({ q, status, page }), subscriberSummary()]);
  const href = (patch: Record<string, string | number | undefined>) => withQuery("/admin/subscribers", { q, status, ...patch });
  const statusHref = (s: string | undefined) => href({ status: status === s ? undefined : s, page: undefined });

  return (
    <>
      <PageHeader
        title="Subscribers"
        description="Newsletter sign-ups from the footer."
        actions={
          // Plain <a>: a file download, not a page navigation.
          <a href="/admin/subscribers/export" className={buttonVariants({ variant: "outline" })}>
            <IconDownload /> Export CSV
          </a>
        }
      />
      <StatCards
        className="lg:grid-cols-3"
        items={[
          { key: "active", label: "Subscribed", value: sum.active, icon: <IconMailCheck />, tone: "success", href: statusHref("active"), active: status === "active" },
          { key: "new", label: "New this month", value: sum.newThisMonth, icon: <IconUserPlus />, hint: "Joined in 30 days" },
          { key: "unsubscribed", label: "Unsubscribed", value: sum.unsubscribed, icon: <IconMailOff />, tone: "danger", href: statusHref("unsubscribed"), active: status === "unsubscribed" },
        ]}
      />
      <div className="mb-4 flex justify-end">
        <SearchBox action="/admin/subscribers" placeholder="Search email" q={q} keep={{ status }} />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        {result.subscribers.length === 0 ? (
          <EmptyState title={q || status ? "No subscribers match" : "No subscribers yet"}>People who join from the footer appear here.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.subscribers.map((s, i) => (
                <TableRow key={s.id} className={rowEnter(i).className} style={rowEnter(i).style}>
                  <TableCell className="pl-4 font-medium">{s.email}</TableCell>
                  <TableCell>
                    {s.unsubscribedAt ? (
                      <span className="text-muted-foreground">Unsubscribed {formatDate(s.unsubscribedAt)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden /> Subscribed
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
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
