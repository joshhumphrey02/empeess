import "server-only";

import { db } from "@/prisma/db";

import { productCardsByIds } from "./catalog";

/** Product ids the user has saved (for filling the hearts). */
export async function wishlistIds(userId: string) {
  const rows = await db.orm.public.WishlistItem.where({ userId }).select("productId").all();
  return rows.map((r) => r.productId);
}

/** Saved products as cards, newest first. Hidden or deleted products drop out. */
export async function wishlistProducts(userId: string) {
  const rows = await db.orm.public.WishlistItem.where({ userId })
    .orderBy((w) => w.createdAt.desc())
    .select("productId")
    .all();
  return productCardsByIds(rows.map((r) => r.productId));
}

/** Saves or un-saves; returns the new state. */
export async function setWishlisted(userId: string, productId: string, saved: boolean) {
  if (!saved) {
    await db.orm.public.WishlistItem.where({ userId, productId }).deleteAll();
    return false;
  }
  const product = await db.orm.public.Product.where({ id: productId, status: "ACTIVE" }).select("id").first();
  if (!product) throw new Error("Product not found");
  const existing = await db.orm.public.WishlistItem.where({ userId, productId }).select("id").first();
  if (!existing) {
    try {
      await db.orm.public.WishlistItem.create({ userId, productId });
    } catch {
      // A double-click raced us to the unique (userId, productId); that's fine.
    }
  }
  return true;
}
