import Link from "next/link";

import { listCategories, listProducts, parseProductQuery, SORTS } from "@/server/catalog";

import { Pagination } from "./pagination";
import { ProductGrid } from "./product-card";
import { ShopToolbar } from "./shop-toolbar";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Filter toolbar + product grid + pagination, shared by the shop and category pages. */
export async function ProductListing({
  basePath,
  params,
  categoryId,
  showCategories = true,
}: {
  basePath: string;
  params: Params;
  /** Pin the listing to one category (category pages). */
  categoryId?: string;
  showCategories?: boolean;
}) {
  const categories = await listCategories();
  // With the pills showing, the category is a filter read from the URL.
  const picked = showCategories ? categories.find((c) => c.slug === one(params.category)) : undefined;
  const query = { ...parseProductQuery(params), categoryId: categoryId ?? picked?.id };
  const result = await listProducts(query);
  const hasFilters = query.minPrice !== undefined || query.maxPrice !== undefined || query.inStock;

  return (
    <>
      <ShopToolbar
        action={basePath}
        categories={categories}
        sorts={SORTS}
        showCategories={showCategories}
        hidden={query.q ? { q: query.q } : undefined}
        values={{ category: picked?.slug, sort: one(params.sort), min: one(params.min), max: one(params.max), stock: one(params.stock) }}
      />
      <p className="mb-8 mt-6 text-sm text-neutral-500" aria-live="polite">
        {result.total} {result.total === 1 ? "product" : "products"}
        {query.q && (
          <>
            {" "}
            for “<span className="text-neutral-950">{query.q}</span>”.{" "}
            <Link href={basePath} className="underline underline-offset-4 hover:text-neutral-950">
              Clear search
            </Link>
          </>
        )}
      </p>
      <ProductGrid
        products={result.products}
        empty={
          <div className="space-y-3">
            <p className="text-lg font-medium text-neutral-950">Nothing here yet.</p>
            <p className="text-sm text-neutral-600">
              {hasFilters ? "Try widening the price range or including sold-out items." : "Try another search or browse all products."}
            </p>
            <Link href="/shop" className="inline-block text-sm underline underline-offset-4">
              Browse all products
            </Link>
          </div>
        }
      />
      <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} params={params} />
    </>
  );
}
