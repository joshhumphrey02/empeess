import { AdminPagination, EmptyState, FilterTabs, PageHeader, withQuery } from "@/components/admin/kit";
import { MessageList } from "@/components/admin/message-list";
import { Card } from "@/components/ui/card";
import { adminListMessages, unreadMessageCount } from "@/server/admin/engage";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "Messages" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin("/admin/messages");
  const sp = await searchParams;
  const filter = one(sp.filter);
  const page = Number(one(sp.page)) || 1;
  const [result, unread] = await Promise.all([adminListMessages({ filter, page }), unreadMessageCount()]);
  const href = (patch: Record<string, string | number | undefined>) => withQuery("/admin/messages", { filter, ...patch });

  return (
    <>
      <PageHeader title="Messages" description="From the contact page. Open one to read it; reply goes to your email app." />
      <div className="mb-4">
        <FilterTabs
          active={filter ?? "all"}
          hrefFor={(v) => href({ filter: v === "all" ? undefined : v, page: undefined })}
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread", count: unread },
          ]}
        />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        {result.messages.length === 0 ? (
          <EmptyState title={filter === "unread" ? "You're all caught up" : "No messages yet"}>Messages sent from the contact page land here.</EmptyState>
        ) : (
          <MessageList messages={result.messages} />
        )}
        <AdminPagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
      </Card>
    </>
  );
}
