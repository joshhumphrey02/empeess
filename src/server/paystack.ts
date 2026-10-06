import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal Paystack client over fetch (https://paystack.com/docs/api/).
// Amounts are in the currency's smallest unit (kobo), like our Money type.

export class PaystackError extends Error {}

const baseUrl = () => (process.env.PAYSTACK_BASE_URL || "https://api.paystack.co").replace(/\/+$/, "");
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

export const paystackConfigured = () => secret().length > 0;

/** Verified transaction, trimmed to what we store and check. */
export type PaystackTransaction = {
  id: number;
  status: string; // "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed" | …
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string | null;
  gateway_response: string | null;
  customer?: { email?: string } | null;
};

async function call<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  if (!paystackConfigured()) throw new PaystackError("Online payment isn't set up yet.");
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: init.method,
      headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("[paystack] network error", path, error);
    throw new PaystackError("We couldn't reach the payment provider. Please try again.");
  }
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !json?.status) {
    console.error("[paystack] request failed", path, res.status, json?.message);
    throw new PaystackError(json?.message || "The payment provider rejected the request.");
  }
  return json.data as T;
}

export function initializeTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: input.email,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    },
  });
}

export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
}

export function createRefund(input: { reference: string; amount?: number; merchantNote?: string }) {
  return call<{ status: string; amount?: number }>("/refund", {
    method: "POST",
    body: { transaction: input.reference, amount: input.amount, merchant_note: input.merchantNote },
  });
}

/** Webhooks are signed with HMAC-SHA512 of the raw body using the secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !paystackConfigured()) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
