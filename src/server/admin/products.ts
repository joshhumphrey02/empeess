import "server-only";

import { or } from "@prisma/orm-postgres/orm-client";

import { db } from "@/prisma/db";

import { deleteImages } from "./ark";

export const ADMIN_PAGE_SIZE = 20;
const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof STATUSES)[number];

const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export async function adminListProducts(opts: {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const filtered = () => {
    let products = db.orm.public.Product.where((p) => p.id.isNotNull());
    if (opts.q) {
      const term = likeTerm(opts.q);
      products = products.where((p) =>
        or(p.name.ilike(term), p.slug.ilike(term), p.variants.some((v) => v.sku.ilike(term))),
      );
    }
    if (opts.status && (STATUSES as readonly string[]).includes(opts.status)) {
      const status = opts.status as ProductStatus;
      products = products.where((p) => p.status.eq(status));
    }
    if (opts.categoryId) {
      const categoryId = opts.categoryId;
      products = products.where((p) => p.categoryId.eq(categoryId));
    }
    return products;
  };

  const [rows, { count }] = await Promise.all([
    filtered()
      .orderBy([(p) => p.updatedAt.desc(), (p) => p.id.desc()])
      .include("category", (c) => c.select("name"))
      .include("images", (i) => i.select("url", "thumbnailUrl").orderBy((x) => x.position.asc()).limit(1))
      .include("variants", (v) =>
        v.combine({ count: v.count(), stock: v.sum("stock"), lowest: v.min("stock") }),
      )
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE)
      .all(),
    filtered().aggregate((a) => ({ count: a.count() })),
  ]);

  return {
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      isFeatured: p.isFeatured,
      basePrice: p.basePrice,
      category: p.category?.name ?? null,
      image: p.images[0]?.thumbnailUrl ?? p.images[0]?.url ?? null,
      variantCount: p.variants.count,
      stock: p.variants.stock ?? 0,
      updatedAt: p.updatedAt,
    })),
    total: count,
    page,
    pageCount: Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE)),
  };
}

export async function adminGetProduct(id: string) {
  return db.orm.public.Product.where({ id })
    .include("variants", (v) => v.orderBy((x) => x.id.asc()))
    .include("images", (i) => i.orderBy((x) => x.position.asc()))
    .first();
}
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof adminGetProduct>>>;

// ─── Save ────────────────────────────────────────────────────────────────────

export type ProductInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  status: ProductStatus;
  isFeatured: boolean;
  basePrice: number; // naira
  compareAtPrice: number | null; // naira
  variants: {
    id?: string;
    sku: string;
    size: string;
    color: string;
    volumeMl: number | null;
    price: number | null; // naira
    stock: number;
    isActive: boolean;
  }[];
  images: {
    id?: string;
    arkAssetId: string;
    url: string;
    thumbnailUrl: string | null;
    compressedUrl: string | null;
    mimeType: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    alt: string;
  }[];
};

export class ProductInputError extends Error {}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

const kobo = (naira: number) => Math.round(naira * 100);

function validate(input: ProductInput) {
  const name = input.name.trim();
  if (!name) throw new ProductInputError("Give the product a name.");
  const slug = slugify(input.slug || name);
  if (!slug) throw new ProductInputError("The URL slug can't be empty.");
  if (!input.categoryId) throw new ProductInputError("Choose a category.");
  if (!STATUSES.includes(input.status)) throw new ProductInputError("Invalid status.");
  if (!(input.basePrice > 0)) throw new ProductInputError("Price must be more than ₦0.");
  if (input.compareAtPrice !== null && !(input.compareAtPrice > input.basePrice)) {
    throw new ProductInputError("“Compare at” price must be higher than the price (or left empty).");
  }
  if (input.variants.length === 0) throw new ProductInputError("Add at least one variant.");

  const skus = new Set<string>();
  const variants = input.variants.map((v, i) => {
    const sku = v.sku.trim().toUpperCase();
    if (!sku) throw new ProductInputError(`Variant ${i + 1} needs a SKU.`);
    if (skus.has(sku)) throw new ProductInputError(`SKU ${sku} is used twice.`);
    skus.add(sku);
    if (!Number.isInteger(v.stock) || v.stock < 0) throw new ProductInputError(`Stock for ${sku} must be a whole number ≥ 0.`);
    if (v.price !== null && !(v.price > 0)) throw new ProductInputError(`Price override for ${sku} must be more than ₦0.`);
    if (v.volumeMl !== null && !(Number.isInteger(v.volumeMl) && v.volumeMl > 0)) {
      throw new ProductInputError(`Volume for ${sku} must be a whole number of ml.`);
    }
    return {
      id: v.id,
      sku,
      size: v.size.trim() || null,
      color: v.color.trim() || null,
      volumeMl: v.volumeMl,
      price: v.price === null ? null : kobo(v.price),
      stock: v.stock,
      isActive: v.isActive,
    };
  });

  const assetIds = new Set<string>();
  for (const img of input.images) {
    if (!img.arkAssetId || !img.url) throw new ProductInputError("An image is missing its upload. Remove it and upload again.");
    if (assetIds.has(img.arkAssetId)) throw new ProductInputError("The same image is attached twice.");
    assetIds.add(img.arkAssetId);
  }

  return {
    name,
    slug,
    description: input.description.trim() || null,
    categoryId: input.categoryId,
    status: input.status,
    isFeatured: input.isFeatured,
    basePrice: kobo(input.basePrice),
    compareAtPrice: input.compareAtPrice === null ? null : kobo(input.compareAtPrice),
    variants,
  };
}

/** Creates or updates a product with its variants and images in one transaction. */
export async function saveProduct(input: ProductInput) {
  const data = validate(input);

  const [slugOwner, category] = await Promise.all([
    db.orm.public.Product.where({ slug: data.slug }).select("id").first(),
    db.orm.public.Category.where({ id: data.categoryId }).select("id").first(),
  ]);
  if (!category) throw new ProductInputError("That category no longer exists.");
  if (slugOwner && slugOwner.id !== input.id) throw new ProductInputError(`Another product already uses the URL “${data.slug}”.`);
  for (const v of data.variants) {
    const owner = await db.orm.public.ProductVariant.where({ sku: v.sku }).select("id", "productId").first();
    if (owner && owner.productId !== input.id) throw new ProductInputError(`SKU ${v.sku} belongs to another product.`);
  }

  const removedAssets: string[] = [];

  const productId = await db.transaction(async (tx) => {
    const { variants, ...fields } = data;
    let id = input.id;
    if (id) {
      const updated = await tx.orm.public.Product.where({ id }).update(fields);
      if (!updated) throw new ProductInputError("This product was deleted.");
    } else {
      id = (await tx.orm.public.Product.create(fields)).id;
    }

    // Variants: update kept rows, delete dropped ones, insert new ones.
    const existing = await tx.orm.public.ProductVariant.where({ productId: id }).select("id", "sku").all();
    const keep = new Set(variants.flatMap((v) => (v.id ? [v.id] : [])));
    for (const old of existing) {
      if (!keep.has(old.id)) await tx.orm.public.ProductVariant.where({ id: old.id }).delete();
    }
    // Free SKUs first so swapping SKUs between rows can't hit the unique index.
    for (const v of variants) {
      if (v.id && existing.some((e) => e.id === v.id)) {
        await tx.orm.public.ProductVariant.where({ id: v.id }).update({ sku: `__tmp__${v.id}` });
      }
    }
    for (const v of variants) {
      const { id: variantId, ...variantFields } = v;
      if (variantId && existing.some((e) => e.id === variantId)) {
        await tx.orm.public.ProductVariant.where({ id: variantId }).update(variantFields);
      } else {
        await tx.orm.public.ProductVariant.create({ productId: id, ...variantFields });
      }
    }

    // Images: same diff; array order is display order.
    const oldImages = await tx.orm.public.ProductImage.where({ productId: id }).select("id", "arkAssetId").all();
    const keptImageIds = new Set(input.images.flatMap((i) => (i.id ? [i.id] : [])));
    for (const old of oldImages) {
      if (!keptImageIds.has(old.id)) {
        await tx.orm.public.ProductImage.where({ id: old.id }).delete();
        removedAssets.push(old.arkAssetId);
      }
    }
    for (const [position, img] of input.images.entries()) {
      const fields = { alt: img.alt.trim() || null, position };
      if (img.id && oldImages.some((o) => o.id === img.id)) {
        await tx.orm.public.ProductImage.where({ id: img.id }).update(fields);
      } else {
        await tx.orm.public.ProductImage.create({
          productId: id,
          arkAssetId: img.arkAssetId,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          compressedUrl: img.compressedUrl,
          mimeType: img.mimeType,
          size: img.size,
          width: img.width,
          height: img.height,
          ...fields,
        });
      }
    }
    return id;
  });

  // Only after the rows are gone, so a failed save never loses a live image.
  await deleteImages(removedAssets);
  return productId;
}

export async function deleteProduct(id: string) {
  const images = await db.orm.public.ProductImage.where({ productId: id }).select("arkAssetId").all();
  // Variants/images/reviews cascade; order items keep their snapshot (variantId → NULL).
  const deleted = await db.orm.public.Product.where({ id }).delete();
  if (deleted) await deleteImages(images.map((i) => i.arkAssetId));
  return Boolean(deleted);
}

export async function setProductStatus(id: string, status: ProductStatus) {
  await db.orm.public.Product.where({ id }).update({ status });
}
