import { IconLock, IconRefresh, IconStarFilled, IconTruckDelivery } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/store/add-to-cart";
import { ProductGrid } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { ReviewForm } from "@/components/store/review-form";
import { WishlistButton } from "@/components/store/wishlist";
import { formatDate, formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { getCurrentUser } from "@/server/auth/session";
import { getProductBySlug, relatedProducts } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Not found | EMPEESS" };
  return {
    title: `${product.name} | EMPEESS`,
    description: product.description ?? undefined,
    openGraph: { images: product.images[0] ? [product.images[0].url] : undefined },
  };
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStarFilled key={n} aria-hidden className={`inline size-4 ${value >= n - 0.25 ? "text-brand" : "text-neutral-300"}`} />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [product, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!product) notFound();

  const related = product.category ? await relatedProducts(product.id, product.category.id) : [];
  const myReview = user ? product.reviews.find((r) => r.userId === user.id) : undefined;

  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-neutral-500">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/shop" className="hover:text-neutral-950">Shop</Link> /
          </li>
          {product.category && (
            <li>
              <Link href={`/shop/${product.category.slug}`} className="hover:text-neutral-950">
                {product.category.name}
              </Link>{" "}
              /
            </li>
          )}
          <li aria-current="page" className="text-neutral-950">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ProductGallery
          images={product.images}
          name={product.name}
          overlay={<WishlistButton productId={product.id} name={product.name} className="size-11" />}
        />

        <div className="lg:sticky lg:top-32 lg:self-start">
          {product.category && (
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">[{product.category.name}]</p>
          )}
          <h1 className="mt-2 text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[0.98] tracking-[-0.04em] text-neutral-950">
            {product.name}
          </h1>
          {product.ratingCount > 0 && product.ratingAvg !== null && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-600">
              <Stars value={product.ratingAvg} />
              {product.ratingAvg.toFixed(1)} ({product.ratingCount} review{product.ratingCount === 1 ? "" : "s"})
            </a>
          )}

          <div className="mt-8">
            <AddToCart
              product={{ name: product.name, image: product.images[0]?.url ?? null }}
              variants={product.variants}
              basePrice={product.basePrice}
              compareAtPrice={product.compareAtPrice}
              currency={product.currency}
            />
          </div>

          {product.description && (
            <div className="mt-10 border-t border-neutral-200 pt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-600">Details</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{product.description}</p>
            </div>
          )}
          <ul className="mt-6 space-y-3 border-t border-neutral-200 pt-6 text-sm text-neutral-700">
            <li className="flex gap-3">
              <IconTruckDelivery className="size-5 shrink-0" stroke={1.5} />
              Free delivery on orders over {formatMoney(FREE_SHIPPING_THRESHOLD)}.
            </li>
            <li className="flex gap-3">
              <IconLock className="size-5 shrink-0" stroke={1.5} />
              Secure payment by card, bank transfer or USSD with Paystack.
            </li>
            <li className="flex gap-3">
              <IconRefresh className="size-5 shrink-0" stroke={1.5} />
              <span>
                Easy returns within 7 days.{" "}
                <Link href="/returns" className="underline underline-offset-4">
                  Returns policy
                </Link>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <section id="reviews" aria-labelledby="reviews-heading" className="mt-24 grid gap-10 border-t border-neutral-200 pt-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 id="reviews-heading" className="text-3xl font-medium tracking-tight">Reviews</h2>
          {product.ratingCount > 0 && product.ratingAvg !== null ? (
            <p className="mt-3 flex items-center gap-2 text-neutral-600">
              <Stars value={product.ratingAvg} /> {product.ratingAvg.toFixed(1)} out of 5 · {product.ratingCount} review
              {product.ratingCount === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="mt-3 text-neutral-600">No reviews yet.</p>
          )}
          <div className="mt-8">
            {user ? (
              <ReviewForm productId={product.id} existing={myReview} />
            ) : (
              <p className="text-sm text-neutral-600">
                <Link href={`/login?next=/product/${product.slug}%23reviews`} className="text-neutral-950 underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            )}
          </div>
        </div>
        <ul className="divide-y divide-neutral-200">
          {product.reviews.map((r) => (
            <li key={r.id} className="py-6 first:pt-0">
              <div className="flex items-center justify-between gap-4">
                <Stars value={r.rating} />
                <span className="text-xs text-neutral-500">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="mt-3 text-neutral-800">{r.comment}</p>}
              <p className="mt-2 text-sm text-neutral-500">{r.user?.name ?? "Customer"}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <h2 id="related-heading" className="mb-8 text-3xl font-medium tracking-tight">
            You may also like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
