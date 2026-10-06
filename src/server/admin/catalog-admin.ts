import "server-only";

import { and, or } from "@prisma/orm-postgres/orm-client";

import { db } from "@/prisma/db";

import { deleteImages } from "./ark";
import { slugify } from "./products";

export class AdminInputError extends Error {}
const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// ─── Categories ──────────────────────────────────────────────────────────────

export async function adminListCategories() {
  const rows = await db.orm.public.Category.orderBy([(c) => c.sortOrder.asc(), (c) => c.name.asc()])
    .include("products", (p) => p.count())
    .all();
  return rows.map((c) => ({ ...c, productCount: c.products }));
}
export type AdminCategory = Awaited<ReturnType<typeof adminListCategories>>[number];

export type CategoryInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  image: { arkAssetId: string; url: string } | null;
};

export async function saveCategory(input: CategoryInput) {
  const name = input.name.trim();
  if (!name) throw new AdminInputError("Give the category a name.");
  const slug = slugify(input.slug || name);
  if (!slug) throw new AdminInputError("The URL slug can't be empty.");

  const clash = await db.orm.public.Category.where((c) => or(c.name.eq(name), c.slug.eq(slug)))
    .select("id", "name", "slug")
    .first();
  if (clash && clash.id !== input.id) {
    throw new AdminInputError(clash.slug === slug ? `URL “${slug}” is already used.` : `“${name}” already exists.`);
  }

  const fields = {
    name,
    slug,
    description: input.description.trim() || null,
    isActive: input.isActive,
    imageArkId: input.image?.arkAssetId || null, // seeded images have a URL but no Ark id
    imageUrl: input.image?.url ?? null,
  };

  if (input.id) {
    const before = await db.orm.public.Category.where({ id: input.id }).select("imageArkId").first();
    if (!before) throw new AdminInputError("This category was deleted.");
    await db.orm.public.Category.where({ id: input.id }).update(fields);
    if (before.imageArkId && before.imageArkId !== fields.imageArkId) await deleteImages([before.imageArkId]);
    return input.id;
  }
  const { max } = await db.orm.public.Category.aggregate((a) => ({ max: a.max("sortOrder") }));
  return (await db.orm.public.Category.create({ ...fields, sortOrder: (max ?? -1) + 1 })).id;
}

export async function deleteCategory(id: string) {
  const { count } = await db.orm.public.Product.where({ categoryId: id }).aggregate((a) => ({ count: a.count() }));
  if (count > 0) throw new AdminInputError(`Move or delete its ${count} product${count === 1 ? "" : "s"} first.`);
  const deleted = await db.orm.public.Category.where({ id }).delete();
  if (deleted?.imageArkId) await deleteImages([deleted.imageArkId]);
}

/** Swap sort order with the neighbour above/below. */
export async function moveCategory(id: string, direction: "up" | "down") {
  const all = await db.orm.public.Category.select("id", "sortOrder")
    .orderBy([(c) => c.sortOrder.asc(), (c) => c.name.asc()])
    .all();
  const i = all.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  const reordered = [...all];
  [reordered[i], reordered[j]] = [reordered[j]!, reordered[i]!];
  await db.transaction(async (tx) => {
    for (const [sortOrder, c] of reordered.entries()) {
      await tx.orm.public.Category.where({ id: c.id }).update({ sortOrder });
    }
  });
}

// ─── Inventory ───────────────────────────────────────────────────────────────

/** Headline numbers for the inventory page. */
export async function inventorySummary() {
  const [all, low, out] = await Promise.all([
    db.orm.public.ProductVariant.aggregate((a) => ({ count: a.count(), units: a.sum("stock") })),
    db.orm.public.ProductVariant.where((v) => and(v.stock.gt(0), v.stock.lte(5))).aggregate((a) => ({ count: a.count() })),
    db.orm.public.ProductVariant.where((v) => v.stock.eq(0)).aggregate((a) => ({ count: a.count() })),
  ]);
  return { variants: all.count, units: all.units ?? 0, low: low.count, out: out.count };
}

export const INVENTORY_PAGE_SIZE = 25;
const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;

/**
 * One page of variants with every inventory filter applied.
 * stock: "low" (1–5), "out" (0) or "in" (more than 5); status: the product's;
 * visibility: "on"/"off" for the variant itself; sort: "stock" | "sku", "-" for descending.
 */
export async function adminListInventory(opts: {
  q?: string;
  stock?: string;
  category?: string;
  status?: string;
  visibility?: string;
  sort?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const filtered = () => {
    let variants = db.orm.public.ProductVariant.where((v) => v.id.isNotNull());
    if (opts.q) {
      const term = likeTerm(opts.q);
      variants = variants.where((v) => or(v.sku.ilike(term), v.product.some((p) => p.name.ilike(term))));
    }
    if (opts.stock === "low") variants = variants.where((v) => and(v.stock.gt(0), v.stock.lte(5)));
    if (opts.stock === "out") variants = variants.where((v) => v.stock.eq(0));
    if (opts.stock === "in") variants = variants.where((v) => v.stock.gt(5));
    if (opts.category) {
      const categoryId = opts.category;
      variants = variants.where((v) => v.product.some((p) => p.categoryId.eq(categoryId)));
    }
    if (opts.status && (PRODUCT_STATUSES as readonly string[]).includes(opts.status)) {
      const status = opts.status as (typeof PRODUCT_STATUSES)[number];
      variants = variants.where((v) => v.product.some((p) => p.status.eq(status)));
    }
    if (opts.visibility === "on") variants = variants.where((v) => v.isActive.eq(true));
    if (opts.visibility === "off") variants = variants.where((v) => v.isActive.eq(false));
    return variants;
  };

  const desc = opts.sort?.startsWith("-") ?? false;
  const key = opts.sort?.replace(/^-/, "") ?? "stock";
  const [variants, { count }] = await Promise.all([
    filtered()
      .orderBy([
        (v) => {
          const col = key === "sku" ? v.sku : v.stock;
          return desc ? col.desc() : col.asc();
        },
        (v) => v.sku.asc(),
      ])
      .include("product", (p) => p.select("id", "name", "status").include("category", (c) => c.select("name")))
      .limit(INVENTORY_PAGE_SIZE)
      .offset((page - 1) * INVENTORY_PAGE_SIZE)
      .all(),
    filtered().aggregate((a) => ({ count: a.count() })),
  ]);
  return { variants, total: count, page, pageSize: INVENTORY_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(count / INVENTORY_PAGE_SIZE)) };
}

export async function setStock(variantId: string, stock: number) {
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) throw new AdminInputError("Stock must be a whole number ≥ 0.");
  await db.orm.public.ProductVariant.where({ id: variantId }).update({ stock });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

/** Review count per star rating, 5★ first. */
export async function reviewSummary() {
  const rows = await db.orm.public.Review.groupBy("rating").aggregate((a) => ({ count: a.count() }));
  const counts = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: rows.find((r) => r.rating === rating)?.count ?? 0 }));
  const total = counts.reduce((n, c) => n + c.count, 0);
  const average = total ? counts.reduce((n, c) => n + c.rating * c.count, 0) / total : 0;
  return { counts, total, average };
}

export async function adminListReviews(opts: { rating?: number; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  let reviews = db.orm.public.Review.where((r) => r.id.isNotNull());
  if (opts.rating && opts.rating >= 1 && opts.rating <= 5) {
    const rating = opts.rating;
    reviews = reviews.where((r) => r.rating.eq(rating));
  }
  return reviews
    .orderBy([(r) => r.createdAt.desc(), (r) => r.id.desc()])
    .include("product", (p) => p.select("name", "slug"))
    .include("user", (u) => u.select("name", "email"))
    .limit(50)
    .offset((page - 1) * 50)
    .all();
}

export async function deleteReview(id: string) {
  await db.orm.public.Review.where({ id }).delete();
}
