import { NextResponse, type NextRequest } from "next/server";

import { verifyAndConfirm } from "@/server/payments";

// Paystack sends the customer back here with ?reference=…&trxref=… after the
// checkout page. We verify server-side (never trust the query string) and
// show the order with the outcome. The webhook may already have done this.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref");
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  if (!reference) return to("/account/orders");

  try {
    const outcome = await verifyAndConfirm(reference);
    if (outcome.result === "unknown") return to("/account/orders");
    const state = outcome.result === "paid" ? "success" : outcome.result;
    return to(`/account/orders/${outcome.orderNumber}?payment=${state}`);
  } catch (error) {
    console.error("[paystack] callback verify failed", reference, error);
    const orderNumber = reference.replace(/-[A-F0-9]{6}$/, "");
    return to(`/account/orders/${encodeURIComponent(orderNumber)}?payment=pending`);
  }
}
