import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

import { variantLabel } from "@/lib/format";
import { MAX_QTY_PER_LINE, shippingFor } from "@/lib/store-config";
import { db } from "@/prisma/db";

import { getCurrentUser } from "./auth/session";

export const GUEST_CART_COOKIE = "empeess_cart";

/** The current cart's id (user cart when signed in, else the guest cart). */
async function findCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const cart = await db.orm.public.Cart.where({ userId: user.id }).select("id").first();
    return cart?.id ?? null;
  }
  const token = (await cookies()).get(GUEST_CART_COOKIE)?.value;
  if (!token) return null;
  const cart = await db.orm.public.Cart.where({ guestToken: token }).select("id").first();
  return cart?.id ?? null;
}

/** Finds or creates the cart. Sets the guest cookie, so actions only. */
export async function ensureCartId(): Promise<string> {
  const existing = await findCartId();
  if (existing) return existing;

  const user = await getCurrentUser();
  if (user) {
    const cart = await db.orm.public.Cart.create({ userId: user.id });
    return cart.id;
  }
  const token = randomBytes(24).toString("base64url");
  const cart = await db.orm.public.Cart.create({ guestToken: token });
  (await cookies()).set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return cart.id;
}

/** Everything the cart page, header badge and checkout need. */
export const getCart = cache(async () => {
  const cartId = await findCartId();
  if (!cartId) return emptyCart();

  const items = await db.orm.public.CartItem.where({ cartId })
    .orderBy((i) => i.createdAt.asc())
    .include("variant", (v) =>
      v.include("product", (p) =>
        p
          .select("id", "name", "slug", "basePrice", "status")
          .include("images", (i) => i.select("url", "alt").orderBy((x) => x.position.asc()).limit(1)),
      ),
    )
    .all();

  const lines = items.flatMap((item) => {
    const v = item.variant;
    const product = v?.product;
    if (!v || !product) return []; // FKs make this unreachable; keeps types honest.
    const unitPrice = v.price ?? product.basePrice;
    const available = v.isActive && product.status === "ACTIVE" ? v.stock : 0;
    return [{
      id: item.id,
      variantId: v.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      sku: v.sku,
      label: variantLabel(v),
      available,
      problem:
        available === 0
          ? ("unavailable" as const)
          : item.quantity > available
            ? ("insufficient" as const)
            : null,
      product: { id: product.id, name: product.name, slug: product.slug, image: product.images[0] ?? null },
    }];
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shipping = shippingFor(subtotal);
  return {
    id: cartId,
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    canCheckout: lines.length > 0 && lines.every((l) => l.problem === null),
  };
});
export type CartView = Awaited<ReturnType<typeof getCart>>;

function emptyCart() {
  return {
    id: null,
    lines: [] as never[],
    itemCount: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
    canCheckout: false,
  };
}

/** Header badge count without loading the whole cart. */
export const getCartCount = cache(async () => {
  const cartId = await findCartId();
  if (!cartId) return 0;
  const { qty } = await db.orm.public.CartItem.where({ cartId }).aggregate((a) => ({ qty: a.sum("quantity") }));
  return qty ?? 0;
});

export class CartError extends Error {}

async function purchasableVariant(variantId: string) {
  const variant = await db.orm.public.ProductVariant.where({ id: variantId })
    .include("product", (p) => p.select("status"))
    .first();
  if (!variant || !variant.isActive || variant.product?.status !== "ACTIVE") {
    throw new CartError("This item is no longer available.");
  }
  return variant;
}

export async function addItem(variantId: string, quantity: number) {
  const variant = await purchasableVariant(variantId);
  if (variant.stock <= 0) throw new CartError("Sorry, that option is sold out.");

  const cartId = await ensureCartId();
  const existing = await db.orm.public.CartItem.where({ cartId, variantId }).first();
  const limit = Math.min(variant.stock, MAX_QTY_PER_LINE);
  const wanted = (existing?.quantity ?? 0) + quantity;
  const next = Math.min(wanted, limit);

  if (existing) {
    if (existing.quantity >= limit) {
      throw new CartError(`You already have the maximum (${limit}) of this item in your cart.`);
    }
    await db.orm.public.CartItem.where({ id: existing.id }).update({ quantity: next });
  } else {
    await db.orm.public.CartItem.create({ cartId, variantId, quantity: next });
  }
  return { capped: next < wanted, quantity: next };
}

/** Sets a line's quantity (0 removes it). Only touches lines in this cart. */
export async function setItemQuantity(itemId: string, quantity: number) {
  const cartId = await findCartId();
  if (!cartId) return;
  const item = await db.orm.public.CartItem.where({ id: itemId, cartId }).first();
  if (!item) return;

  if (quantity <= 0) {
    await db.orm.public.CartItem.where({ id: item.id }).delete();
    return;
  }
  const variant = await purchasableVariant(item.variantId);
  const next = Math.min(quantity, variant.stock, MAX_QTY_PER_LINE);
  if (next <= 0) {
    await db.orm.public.CartItem.where({ id: item.id }).delete();
    return;
  }
  await db.orm.public.CartItem.where({ id: item.id }).update({ quantity: next });
}

/**
 * After sign-in: fold the guest cart into the user's cart (quantities add up,
 * capped at stock) and drop the guest cart and cookie.
 */
export async function mergeGuestCart(userId: string) {
  const store = await cookies();
  const token = store.get(GUEST_CART_COOKIE)?.value;
  if (!token) return;
  store.delete(GUEST_CART_COOKIE);

  const guest = await db.orm.public.Cart.where({ guestToken: token })
    .include("items", (i) => i.include("variant", (v) => v.select("stock")))
    .first();
  if (!guest) return;

  await db.transaction(async (tx) => {
    if (guest.items.length > 0) {
      const userCart =
        (await tx.orm.public.Cart.where({ userId }).select("id").first()) ??
        (await tx.orm.public.Cart.create({ userId }));

      for (const item of guest.items) {
        const existing = await tx.orm.public.CartItem.where({ cartId: userCart.id, variantId: item.variantId }).first();
        const qty = Math.min((existing?.quantity ?? 0) + item.quantity, item.variant?.stock ?? 0, MAX_QTY_PER_LINE);
        if (qty <= 0) continue;
        if (existing) await tx.orm.public.CartItem.where({ id: existing.id }).update({ quantity: qty });
        else await tx.orm.public.CartItem.create({ cartId: userCart.id, variantId: item.variantId, quantity: qty });
      }
    }
    await tx.orm.public.Cart.where({ id: guest.id }).delete();
  });
}
