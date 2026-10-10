import { assertAccess } from "@/server/admin/guard";
import { activeSubscriberEmails } from "@/server/admin/engage";

// CSV of active subscribers for importing into an email tool.
export async function GET() {
  try {
    await assertAccess("subscribers");
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const rows = await activeSubscriberEmails();
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = ["email,subscribed_at", ...rows.map((r) => `${quote(r.email)},${quote(new Date(r.createdAt).toISOString())}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="empeess-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
