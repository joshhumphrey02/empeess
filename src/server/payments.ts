import "server-only";

import { randomBytes } from "node:crypto";

import { formatMoney } from "@/lib/format";
import { PAYMENT_WINDOW_MINUTES } from "@/lib/store-config";
import { db } from "@/prisma/db";

import { absoluteUrl, escapeHtml, layout, sendEmail } from "./mail";
import { createRefund, initializeTransaction, PaystackError, paystackConfigured, verifyTransaction, type PaystackTransaction } from "./paystack";

// Order payment lifecycle with Paystack:
//   placeOrder → PENDING order (stock reserved) → startPayment → Paystack page
//   → callback/webhook → confirmPayment → PAID (idempotent; either can arrive first)
//   Unpaid orders past the payment window are cancelled and restocked.

export class PaymentError extends Error {}

export const PROVIDER = "paystack";
const WINDOW_MS = PAYMENT_WINDOW_MINUTES * 60 * 1000;

/** When an unpaid order stops holding stock. */
export const paymentDeadline = (createdAt: string) => new Date(new Date(createdAt).getTime() + WINDOW_MS);

// Paystack allows - . = and alphanumerics in references.
const newReference = (orderNumber: string) => `${orderNumber}-${randomBytes(3).toString("hex").toUpperCase()}`;

/** Creates a payment attempt for a pending order and returns the Paystack checkout URL. */
export async function startPayment(input: { userId: string; orderNumber: string; email: string }) {
  if (!paystackConfigured()) throw new PaymentError("Online payment isn't set up yet. Please try again later.");
  const order = await db.orm.public.Order.where({ userId: input.userId, orderNumber: input.orderNumber }).first();
  if (!order) throw new PaymentError("Order not found.");
  if (order.status !== "PENDING") throw new PaymentError("This order doesn't need payment.");
  if (paymentDeadline(order.createdAt).getTime() < Date.now()) {
    await expireOrder(order.id);
    throw new PaymentError("The time to pay for this order ran out, so it was cancelled and the items released.");
  }

  const reference = newReference(order.orderNumber);
  await db.orm.public.Payment.create({
    orderId: order.id,
    provider: PROVIDER,
    reference,
    status: "PENDING",
    amount: order.total,
    currency: order.currency,
  });
  try {
    const init = await initializeTransaction({
      email: input.email,
      amount: order.total,
      currency: order.currency,
      reference,
      callbackUrl: absoluteUrl("/api/paystack/callback"),
      metadata: { orderNumber: order.orderNumber, orderId: order.id },
    });
    return init.authorization_url;
  } catch (error) {
    await db.orm.public.Payment.where({ reference }).update({ status: "FAILED" });
    if (error instanceof PaystackError) throw new PaymentError(error.message);
    throw error;
  }
}

type Outcome =
  | { result: "paid"; orderNumber: string; firstTime: boolean }
  | { result: "failed" | "pending"; orderNumber: string }
  | { result: "unknown" };

/**
 * Applies a verified Paystack transaction to its payment and order. Safe to
 * call any number of times, from the callback and the webhook concurrently:
 * only the call that flips the payment from PENDING records the sale.
 */
export async function confirmPayment(tx: PaystackTransaction): Promise<Outcome> {
  const payment = await db.orm.public.Payment.where({ reference: tx.reference })
    .include("order", (o) => o.select("id", "orderNumber", "status", "total", "currency", "userId"))
    .first();
  const order = payment?.order;
  if (!payment || !order) return { result: "unknown" };
  const raw = {
    id: tx.id,
    status: tx.status,
    amount: tx.amount,
    currency: tx.currency,
    channel: tx.channel,
    paid_at: tx.paid_at,
    gateway_response: tx.gateway_response,
  };

  if (payment.status === "SUCCESS" || payment.status === "REFUNDED") {
    return { result: "paid", orderNumber: order.orderNumber, firstTime: false };
  }
  if (tx.status !== "success") {
    const final = ["failed", "abandoned", "reversed"].includes(tx.status);
    if (final) await db.orm.public.Payment.where({ id: payment.id, status: "PENDING" }).update({ status: "FAILED", rawResponse: raw });
    return { result: final ? "failed" : "pending", orderNumber: order.orderNumber };
  }
  // Never trust a success for the wrong amount (e.g. a tampered client-side init).
  if (tx.amount !== payment.amount || tx.currency !== payment.currency) {
    console.error("[payments] amount mismatch", tx.reference, tx.amount, payment.amount);
    await db.orm.public.Payment.where({ id: payment.id }).update({ status: "FAILED", rawResponse: { ...raw, mismatch: true } });
    return { result: "failed", orderNumber: order.orderNumber };
  }

  const paidAt = tx.paid_at ? new Date(tx.paid_at).toISOString() : new Date().toISOString();
  const outcome = await db.transaction(async (t) => {
    const flipped = await t.orm.public.Payment.where({ id: payment.id, status: payment.status }).update({ status: "SUCCESS", paidAt, rawResponse: raw });
    if (!flipped) return { firstTime: false, orderPaid: false };
    const markedPaid = await t.orm.public.Order.where({ id: order.id, status: "PENDING" }).update({ status: "PAID", paidAt });
    return { firstTime: true, orderPaid: Boolean(markedPaid) };
  });

  // Paid after the window closed and the order was cancelled: take the stock
  // again if it's still there. Separate transaction, so the recorded payment
  // stands even when the items have sold out (the admin refunds those).
  if (outcome.firstTime && !outcome.orderPaid) {
    try {
      await db.transaction(async (t) => {
        const current = await t.orm.public.Order.where({ id: order.id, status: "CANCELLED" }).include("items", (i) => i.select("variantId", "quantity")).first();
        if (!current) throw new Error("not-cancelled");
        await reserveAgain(t, current.items);
        await t.orm.public.Order.where({ id: order.id, status: "CANCELLED" }).update({ status: "PAID", paidAt, cancelledAt: null });
      });
    } catch {
      console.warn("[payments] payment landed on a closed order; refund it from the dashboard", order.orderNumber);
    }
  }

  if (outcome.firstTime) await sendReceipt(order.id).catch((e) => console.error("[payments] receipt failed", e));
  return { result: "paid", orderNumber: order.orderNumber, firstTime: outcome.firstTime };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Compare-and-set stock decrement for every line; throws (rolling back the caller's transaction) if any can't be taken. */
async function reserveAgain(t: Tx, items: { variantId: string | null; quantity: number }[]) {
  for (const item of items) {
    if (!item.variantId) throw new Error("restock-unavailable");
    const v = await t.orm.public.ProductVariant.where({ id: item.variantId }).select("stock").first();
    if (!v || v.stock < item.quantity) throw new Error("restock-unavailable");
    const ok = await t.orm.public.ProductVariant.where({ id: item.variantId, stock: v.stock }).update({ stock: v.stock - item.quantity });
    if (!ok) throw new Error("restock-unavailable");
  }
}

/** Looks up a reference at Paystack and applies it. */
export async function verifyAndConfirm(reference: string) {
  return confirmPayment(await verifyTransaction(reference));
}

/** Cancels one unpaid order and puts its stock back (no-op if it moved on). */
async function expireOrder(orderId: string) {
  await db.transaction(async (t) => {
    const order = await t.orm.public.Order.where({ id: orderId }).include("items", (i) => i.select("variantId", "quantity")).first();
    if (!order) return;
    const cancelled = await t.orm.public.Order.where({ id: orderId, status: "PENDING" }).update({ status: "CANCELLED", cancelledAt: new Date().toISOString() });
    if (!cancelled) return;
    for (const item of order.items) {
      if (!item.variantId) continue;
      const v = await t.orm.public.ProductVariant.where({ id: item.variantId }).select("stock").first();
      if (v) await t.orm.public.ProductVariant.where({ id: item.variantId }).update({ stock: v.stock + item.quantity });
    }
    await t.orm.public.Payment.where({ orderId, status: "PENDING" }).updateAll({ status: "FAILED" });
  });
}

/**
 * Cancels unpaid orders whose window has passed. Before giving up on one, ask
 * Paystack about its latest attempt in case a webhook never arrived.
 * Called opportunistically (checkout, order pages, dashboard), so no cron is needed.
 */
export async function expireStaleOrders(opts: { userId?: string; limit?: number } = {}) {
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
  let stale = db.orm.public.Order.where({ status: "PENDING" }).where((o) => o.createdAt.lt(cutoff));
  if (opts.userId) stale = stale.where({ userId: opts.userId });
  const orders = await stale
    .include("payments", (p) => p.select("reference", "status").orderBy((x) => x.createdAt.desc()).limit(1))
    .limit(opts.limit ?? 20)
    .all();
  for (const order of orders) {
    const last = order.payments[0];
    if (last && paystackConfigured()) {
      try {
        const outcome = await verifyAndConfirm(last.reference);
        if (outcome.result === "paid") continue;
      } catch {
        // Unknown at Paystack (never opened) or unreachable: treat as unpaid.
      }
    }
    await expireOrder(order.id);
  }
  return orders.length;
}

/** Admin refund of a paid order through Paystack; the order becomes REFUNDED and unshipped stock returns. */
export async function refundOrder(orderNumber: string, note?: string) {
  const order = await db.orm.public.Order.where({ orderNumber })
    .include("payments", (p) => p.where((x) => x.status.eq("SUCCESS")).orderBy((x) => x.createdAt.desc()).limit(1))
    .include("items", (i) => i.select("variantId", "quantity"))
    .first();
  if (!order) throw new PaymentError("Order not found.");
  const payment = order.payments[0];
  if (!payment) throw new PaymentError("This order has no successful payment to refund.");

  try {
    await createRefund({ reference: payment.reference, merchantNote: note });
  } catch (error) {
    if (error instanceof PaystackError) throw new PaymentError(error.message);
    throw error;
  }

  const restock = order.status === "PAID" || order.status === "PROCESSING";
  await db.transaction(async (t) => {
    await t.orm.public.Payment.where({ id: payment.id }).update({ status: "REFUNDED" });
    const updated = await t.orm.public.Order.where({ id: order.id, status: order.status }).update({ status: "REFUNDED" });
    if (updated && restock) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const v = await t.orm.public.ProductVariant.where({ id: item.variantId }).select("stock").first();
        if (v) await t.orm.public.ProductVariant.where({ id: item.variantId }).update({ stock: v.stock + item.quantity });
      }
    }
  });
}

/** Webhook: Paystack finished (or failed) a refund we started. */
export async function markRefund(transactionReference: string, status: "processed" | "failed") {
  if (status === "failed") {
    console.error("[payments] Paystack refund failed", transactionReference);
    return;
  }
  await db.orm.public.Payment.where({ reference: transactionReference, status: "SUCCESS" }).update({ status: "REFUNDED" });
}

async function sendReceipt(orderId: string) {
  const order = await db.orm.public.Order.where({ id: orderId })
    .include("items", (i) => i.orderBy((x) => x.id.asc()))
    .include("user", (u) => u.select("email", "name"))
    .first();
  if (!order?.user) return;
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;font-size:14px;color:#111">${escapeHtml(i.productName)}${i.variantLabel ? ` <span style="color:#71717a">· ${escapeHtml(i.variantLabel)}</span>` : ""} × ${i.quantity}</td><td style="padding:8px 0;font-size:14px;text-align:right;color:#111">${formatMoney(i.lineTotal, order.currency)}</td></tr>`,
    )
    .join("");
  const totals = `<tr><td style="padding:12px 0 0;border-top:1px solid #e4e4e7;font-size:14px;color:#71717a">Delivery</td><td style="padding:12px 0 0;border-top:1px solid #e4e4e7;text-align:right;font-size:14px">${order.shippingFee ? formatMoney(order.shippingFee, order.currency) : "Free"}</td></tr>
<tr><td style="padding:6px 0;font-size:16px;font-weight:700">Total paid</td><td style="padding:6px 0;text-align:right;font-size:16px;font-weight:700">${formatMoney(order.total, order.currency)}</td></tr>`;
  const { html, text } = layout({
    heading: `Thanks${order.user.name ? `, ${order.user.name.split(" ")[0]}` : ""}! Your order is confirmed.`,
    paragraphs: [
      `We've received your payment for order ${order.orderNumber}. We'll let you know when it ships to ${order.shippingCity}, ${order.shippingState}.`,
    ],
    rowsHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">${rows}${totals}</table>`,
    button: { label: "View your order", url: absoluteUrl(`/account/orders/${order.orderNumber}`) },
  });
  await sendEmail({
    to: order.user.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html,
    text: `${text}\n\nTotal paid: ${formatMoney(order.total, order.currency)}`,
  });
}
