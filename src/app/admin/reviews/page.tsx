import { IconStarFilled } from "@tabler/icons-react";
import Link from "next/link";

import { EmptyState, PageHeader, rowEnter, withQuery } from "@/components/admin/kit";
import { DeleteReviewButton } from "@/components/admin/small-actions";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { adminListReviews, reviewSummary } from "@/server/admin/catalog-admin";
import { requireAccess } from "@/server/admin/guard";

export const metadata = { title: "Reviews" };

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex text-brand", className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStarFilled key={i} className={cn("size-4", i >= Math.round(value) && "text-muted-foreground/25")} aria-hidden />
      ))}
    </span>
  );
}

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAccess("reviews", "/admin/reviews");
  const sp = await searchParams;
  const ratingParam = Array.isArray(sp.rating) ? sp.rating[0] : sp.rating;
  const rating = Number(ratingParam) || undefined;
  const [reviews, summary] = await Promise.all([adminListReviews({ rating }), reviewSummary()]);
  const max = Math.max(1, ...summary.counts.map((c) => c.count));

  return (
    <>
      <PageHeader title="Reviews" description="Remove spam or abusive reviews. Ratings update instantly in the store." />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Card className="relative isolate h-fit lg:sticky lg:top-20">
          <div className="px-(--card-spacing)">
            <p className="text-xs font-medium text-muted-foreground">Average rating</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">{summary.average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">from {summary.total} review{summary.total === 1 ? "" : "s"}</span>
            </p>
            <Stars value={summary.average} className="mt-2" />
          </div>
          {/* Distribution doubles as the filter: click a row to see only those reviews. */}
          <nav aria-label="Filter by rating" className="flex flex-col gap-0.5 px-2">
            {summary.counts.map((c) => {
              const active = rating === c.rating;
              return (
                <Link
                  key={c.rating}
                  href={withQuery("/admin/reviews", { rating: active ? undefined : c.rating })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                    active && "bg-brand-soft hover:bg-brand-soft",
                  )}
                >
                  <span className="w-6 tabular-nums text-muted-foreground">{c.rating}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full origin-left animate-grow-x rounded-full bg-linear-to-r from-chart-2 to-chart-1"
                      style={{ width: `${(c.count / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-8 text-right tabular-nums text-muted-foreground group-hover:text-foreground">{c.count}</span>
                </Link>
              );
            })}
          </nav>
          {rating && (
            <Link href="/admin/reviews" className="px-(--card-spacing) text-sm text-muted-foreground hover:text-foreground">
              Show all ratings
            </Link>
          )}
        </Card>

        <Card className="py-0">
          {reviews.length === 0 ? (
            <EmptyState title={rating ? `No ${rating}★ reviews` : "No reviews yet"} />
          ) : (
            <ul className="divide-y">
              {reviews.map((r, i) => {
                const who = r.user?.name ?? r.user?.email ?? "Customer";
                const enter = rowEnter(i);
                return (
                  <li key={r.id} className={cn("flex gap-4 p-4 transition-colors hover:bg-muted/40", enter.className)} style={enter.style}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                      {who.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-sm font-medium">{who}</span>
                        <Stars value={r.rating} />
                        <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                      </div>
                      <Link href={`/product/${r.product?.slug}`} target="_blank" className="text-xs text-muted-foreground hover:text-brand">
                        on {r.product?.name}
                      </Link>
                      {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : <p className="mt-2 text-sm italic text-muted-foreground">No comment</p>}
                    </div>
                    <DeleteReviewButton id={r.id} product={r.product?.name ?? "the product"} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
