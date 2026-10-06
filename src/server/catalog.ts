import "server-only";

import { and, or } from "@prisma/orm-postgres/orm-client";
import { cache } from "react";

import { PRODUCTS_PER_PAGE } from "@/lib/store-config";
import { db } from "@/prisma/db";

export const SORTS = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
export type Sort = keyof typeof SORTS;

export type ProductQuery = {
  categoryId?: string;
  q?: string;
  sort?: Sort;
  minPrice?: number; // kobo
  maxPrice?: number; // kobo
  inStock?: boolean;
  page?: number;
};

/** Escape LIKE wildcards so a search for "100%" matches literally. */
const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

function filtered(query: ProductQuery) {
  let products = db.orm.public.Product.where((p) => p.status.eq("ACTIVE"));
  if (query.categoryId) {
    const categoryId = query.categoryId;
    products = products.where((p) => p.categoryId.eq(categoryId));
  }
  if (query.q) {
    const term = likeTerm(query.q);
    products = products.where((p) =>
      or(p.name.ilike(term), p.description.ilike(term), p.category.some((c) => c.name.ilike(term))),
    );
  }
  if (query.minPrice !== undefined) {
    const min = query.minPrice;
    products = products.where((p) => p.basePrice.gte(min));
  }
  if (query.maxPrice !== undefined) {
    const max = query.maxPrice;
    products = products.where((p) => p.basePrice.lte(max));
  }
  if (query.inStock) {
    products = products.where((p) => p.variants.some((v) => and(v.isActive.eq(true), v.stock.gt(0))));
  }
  return products;
}

const withCardRelations = <C extends ReturnType<typeof filtered>>(products: C) =>
  products
    .include("images", (i) => i.select("url", "alt").orderBy((x) => x.position.asc()).limit(2))
    .include("category", (c) => c.select("name", "slug"))
    .include("variants", (v) => v.where((x) => and(x.isActive.eq(true), x.stock.gt(0))).count());

/** One page of product cards plus the total match count. */
export async function listProducts(query: ProductQuery) {
  const page = Math.max(1, query.page ?? 1);
  const sort = query.sort ?? "featured";
  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const { count: total } = await filtered(query).aggregate((a) => ({ count: a.count() }));

  let rows: CardRow[];
  if (sort === "featured") {
    // Featured first, then newest. Booleans can't be ordered on, so read the
    // two groups separately and stitch this page's window across them.
    const featuredQuery = filtered(query).where((p) => p.isFeatured.eq(true));
    const { count: featuredTotal } = await featuredQuery.aggregate((a) => ({ count: a.count() }));
    const fromFeatured = Math.max(0, Math.min(PRODUCTS_PER_PAGE, featuredTotal - start));
    const [featured, rest] = await Promise.all([
      fromFeatured > 0
        ? withCardRelations(featuredQuery)
            .orderBy([(p) => p.createdAt.asc(), (p) => p.id.asc()])
            .limit(fromFeatured)
            .offset(start)
            .all()
        : Promise.resolve([]),
      PRODUCTS_PER_PAGE - fromFeatured > 0
        ? withCardRelations(filtered(query).where((p) => p.isFeatured.eq(false)))
            .orderBy([(p) => p.createdAt.asc(), (p) => p.id.asc()])
            .limit(PRODUCTS_PER_PAGE - fromFeatured)
            .offset(Math.max(0, start - featuredTotal))
            .all()
        : Promise.resolve([]),
    ]);
    rows = [...featured, ...rest];
  } else {
    const products = withCardRelations(filtered(query));
    const ordered =
      sort === "newest"
        ? products.orderBy([(p) => p.createdAt.desc(), (p) => p.id.desc()])
        : sort === "price-asc"
          ? products.orderBy([(p) => p.basePrice.asc(), (p) => p.id.asc()])
          : products.orderBy([(p) => p.basePrice.desc(), (p) => p.id.asc()]);
    rows = await ordered.limit(PRODUCTS_PER_PAGE).offset(start).all();
  }

  return {
    products: rows.map(toCard),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

type CardRow = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  currency: string;
  images: { url: string; alt: string | null }[];
  category: { name: string; slug: string } | null;
  variants: number;
};

function toCard(p: CardRow) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency,
    image: p.images[0] ?? null,
    hoverImage: p.images[1] ?? null,
    category: p.category,
    inStock: p.variants > 0,
  };
}
export type ProductCardData = ReturnType<typeof toCard>;

/** Active categories with their live product counts, in display order. */
export const listCategories = cache(async () => {
  const rows = await db.orm.public.Category.where((c) => c.isActive.eq(true))
    .orderBy([(c) => c.sortOrder.asc(), (c) => c.name.asc()])
    .include("products", (p) => p.where((x) => x.status.eq("ACTIVE")).count())
    .all();
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c.products,
  }));
});

export const getCategoryBySlug = cache(async (slug: string) => {
  const categories = await listCategories();
  return categories.find((c) => c.slug === slug) ?? null;
});

/** Full product detail for the product page, or null when missing/inactive. */
export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.orm.public.Product.where((p) => and(p.slug.eq(slug), p.status.eq("ACTIVE")))
    .include("category", (c) => c.select("id", "name", "slug"))
    .include("images", (i) => i.select("id", "url", "alt").orderBy((x) => x.position.asc()))
    .include("variants", (v) =>
      v
        .where((x) => x.isActive.eq(true))
        .select("id", "sku", "size", "color", "volumeMl", "price", "stock")
        .orderBy((x) => x.id.asc()),
    )
    .include("reviews", (r) =>
      r
        .select("id", "rating", "comment", "createdAt", "userId")
        .include("user", (u) => u.select("name"))
        .orderBy((x) => x.createdAt.desc())
        .limit(20),
    )
    .first();
  if (!product) return null;

  const { ratingAvg, ratingCount } = await db.orm.public.Review.where({ productId: product.id }).aggregate(
    (a) => ({ ratingAvg: a.avg("rating"), ratingCount: a.count() }),
  );

  return { ...product, ratingAvg, ratingCount };
});
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** A few other products from the same category. */
export async function relatedProducts(productId: string, categoryId: string, limit = 4) {
  const rows = await db.orm.public.Product.where((p) =>
    and(p.status.eq("ACTIVE"), p.categoryId.eq(categoryId), p.id.neq(productId)),
  )
    .orderBy([(p) => p.createdAt.asc(), (p) => p.id.asc()])
    .include("images", (i) => i.select("url", "alt").orderBy((x) => x.position.asc()).limit(2))
    .include("category", (c) => c.select("name", "slug"))
    .include("variants", (v) => v.where((x) => and(x.isActive.eq(true), x.stock.gt(0))).count())
    .limit(limit)
    .all();
  return rows.map(toCard);
}

/** Parse shop/search URL params into a validated query. */
export function parseProductQuery(params: Record<string, string | string[] | undefined>): ProductQuery {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const naira = (k: string) => {
    const n = Number(one(k));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
  };
  const sort = one("sort");
  const page = Number(one("page"));
  return {
    q: one("q")?.trim().slice(0, 100) || undefined,
    sort: sort && sort in SORTS ? (sort as Sort) : undefined,
    minPrice: naira("min"),
    maxPrice: naira("max"),
    inStock: one("stock") === "1",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}
