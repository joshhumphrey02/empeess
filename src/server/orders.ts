import "server-only";

import { randomBytes } from "node:crypto";

import { variantLabel } from "@/lib/format";
import { shippingFor } from "@/lib/store-config";
import { db } from "@/prisma/db";

export class CheckoutError extends Error {}

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function orderNumber() {
  const d = new Date();
  const date = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const suffix = Array.from(randomBytes(5), (b) => ORDER_ALPHABET[b % ORDER_ALPHABET.length]).join("");
  return `EMP-${date}-${suffix}`;
}

/**
 * Turns the user's cart into an order in one transaction: re-checks stock,
 * decrements it with a compare-and-set (so two buyers can't both take the
 * last unit), snapshots prices and the address, then empties the cart.
 */
export async function placeOrder(input: { userId: string; addressId: string; note?: string }) {
  return db.transaction(async (tx) => {
    const address = await tx.orm.public.Address.where({ id: input.addressId, userId: input.userId }).first();
    if (!address) throw new CheckoutError("Choose a delivery address.");

    const cart = await tx.orm.public.Cart.where({ userId: input.userId })
      .include("items", (i) =>
        i.include("variant", (v) =>
          v.include("product", (p) =>
            p
              .select("id", "name", "status", "basePrice", "currency")
              .include("images", (img) => img.select("url").orderBy((x) => x.position.asc()).limit(1)),
          ),
        ),
      )
      .first();
    if (!cart || cart.items.length === 0) throw new CheckoutError("Your cart is empty.");

    const lines = cart.items.map((item) => {
      const v = item.variant;
      const product = v?.product;
      if (!v || !product || !v.isActive || product.status !== "ACTIVE") {
        throw new CheckoutError("An item in your cart is no longer available. Please review your cart.");
      }
      if (v.stock < item.quantity) {
        throw new CheckoutError(`Only ${v.stock} left of ${product.name} (${variantLabel(v)}). Please update your cart.`);
      }
      const unitPrice = v.price ?? product.basePrice;
      return { item, v, product, unitPrice, lineTotal: unitPrice * item.quantity };
    });

    for (const { item, v, product } of lines) {
      const updated = await tx.orm.public.ProductVariant.where({ id: v.id, stock: v.stock }).update({
        stock: v.stock - item.quantity,
      });
      if (!updated) {
        throw new CheckoutError(`Stock for ${product.name} just changed. Please try again.`);
      }
    }

    const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
    const shippingFee = shippingFor(subtotal);
    const order = await tx.orm.public.Order.create({
      orderNumber: orderNumber(),
      userId: input.userId,
      currency: lines[0]!.product.currency,
      subtotal,
      shippingFee,
      discount: 0,
      total: subtotal + shippingFee,
      shippingFullName: address.fullName,
      shippingPhone: address.phone,
      shippingLine1: address.line1,
      shippingLine2: address.line2,
      shippingCity: address.city,
      shippingState: address.state,
      shippingPostalCode: address.postalCode,
      shippingCountry: address.country,
      note: input.note?.trim() || null,
    });

    for (const { item, v, product, unitPrice, lineTotal } of lines) {
      await tx.orm.public.OrderItem.create({
        orderId: order.id,
        variantId: v.id,
        productName: product.name,
        variantLabel: variantLabel(v) || null,
        sku: v.sku,
        imageUrl: product.images[0]?.url ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    await tx.orm.public.CartItem.where({ cartId: cart.id }).deleteAll();
    return order;
  });
}

export async function listOrders(userId: string, limit?: number) {
  let orders = db.orm.public.Order.where({ userId })
    .orderBy([(o) => o.createdAt.desc(), (o) => o.id.desc()])
    .include("items", (i) => i.count());
  if (limit) orders = orders.limit(limit);
  return orders.all();
}

export async function getOrder(userId: string, orderNumber: string) {
  return db.orm.public.Order.where({ userId, orderNumber })
    .include("items", (i) => i.orderBy((x) => x.id.asc()))
    .include("payments", (p) => p.select("status", "rawResponse", "paidAt").orderBy((x) => x.createdAt.desc()))
    .first();
}

/** Customers may cancel their own order while it's still pending; stock goes back. */
export async function cancelOrder(userId: string, orderNumber: string) {
  return db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.where({ userId, orderNumber })
      .include("items", (i) => i.select("variantId", "quantity"))
      .first();
    if (!order) throw new CheckoutError("Order not found.");
    if (order.status !== "PENDING") throw new CheckoutError("This order can no longer be cancelled.");

    const updated = await tx.orm.public.Order.where({ id: order.id, status: "PENDING" }).update({
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
    });
    if (!updated) throw new CheckoutError("This order can no longer be cancelled.");

    for (const item of order.items) {
      if (!item.variantId) continue;
      const variant = await tx.orm.public.ProductVariant.where({ id: item.variantId }).select("stock").first();
      if (variant) {
        await tx.orm.public.ProductVariant.where({ id: item.variantId }).update({ stock: variant.stock + item.quantity });
      }
    }
  });
}
