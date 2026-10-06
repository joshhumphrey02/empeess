import { IconStarFilled } from "@tabler/icons-react";
import Link from "next/link";

import { EmptyState, FilterTabs, PageHeader, withQuery } from "@/components/admin/kit";
import { DeleteReviewButton } from "@/components/admin/small-actions";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { adminListReviews } from "@/server/admin/catalog-admin";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin("/admin/reviews");
  const sp = await searchParams;
  const ratingParam = Array.isArray(sp.rating) ? sp.rating[0] : sp.rating;
  const rating = Number(ratingParam) || undefined;
  const reviews = await adminListReviews({ rating });

  return (
    <>
      <PageHeader title="Reviews" description="Remove spam or abusive reviews. Ratings update instantly in the store." />
      <div className="mb-4">
        <FilterTabs
          active={rating ? String(rating) : "all"}
          hrefFor={(v) => withQuery("/admin/reviews", { rating: v === "all" ? undefined : v })}
          options={[{ value: "all", label: "All" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}★` }))]}
        />
      </div>
      <Card className="py-0">
        {reviews.length === 0 ? (
          <EmptyState title="No reviews yet" />
        ) : (
          <ul className="divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="flex gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex text-brand" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <IconStarFilled key={i} className={i < r.rating ? "size-4" : "size-4 text-muted"} aria-hidden />
                      ))}
                    </span>
                    <Link href={`/product/${r.product?.slug}`} target="_blank" className="text-sm font-medium hover:underline">
                      {r.product?.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {r.user?.name ?? r.user?.email} · {formatDate(r.createdAt)}
                    </span>
                  </div>
                  {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : <p className="mt-2 text-sm italic text-muted-foreground">No comment</p>}
                </div>
                <DeleteReviewButton id={r.id} product={r.product?.name ?? "the product"} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
