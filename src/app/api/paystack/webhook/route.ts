import { NextResponse, type NextRequest } from "next/server";

import { validWebhookSignature, type PaystackTransaction } from "@/server/paystack";
import { confirmPayment, markRefund } from "@/server/payments";

// Paystack → us. Set this URL in Dashboard → Settings → API Keys & Webhooks:
//   <APP_URL>/api/paystack/webhook
// Every event is signed (x-paystack-signature = HMAC-SHA512 of the raw body).
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!validWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  try {
    switch (event.event) {
      case "charge.success":
        await confirmPayment(event.data as unknown as PaystackTransaction);
        break;
      case "refund.processed":
      case "refund.failed": {
        const data = event.data ?? {};
        const reference =
          (data.transaction_reference as string | undefined) ??
          ((data.transaction as { reference?: string } | undefined)?.reference ?? undefined);
        if (reference) await markRefund(reference, event.event === "refund.processed" ? "processed" : "failed");
        break;
      }
      default:
        break; // Other events aren't used yet; acknowledge so Paystack stops retrying.
    }
  } catch (error) {
    // A 500 makes Paystack retry later, which is what we want for transient failures.
    console.error("[paystack] webhook handling failed", event.event, error);
    return new NextResponse("error", { status: 500 });
  }
  return NextResponse.json({ received: true });
}
