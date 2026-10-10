import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/store/info-page";
import { formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, PAYMENT_WINDOW_MINUTES, SHIPPING_FLAT_FEE } from "@/lib/store-config";

export const metadata: Metadata = { title: "Shipping & delivery | EMPEESS" };

// Fees come from store-config so this page can't drift from checkout.
// TODO(owner): confirm the delivery times below.
export default function ShippingPage() {
  return (
    <InfoPage eyebrow="[Help]" title="Shipping & delivery" description="We deliver to every state in Nigeria." current="/shipping" updated="6 October 2026">
      <section>
        <h2>Delivery fees</h2>
        <ul>
          <li>
            Flat {formatMoney(SHIPPING_FLAT_FEE)} on orders under {formatMoney(FREE_SHIPPING_THRESHOLD)}.
          </li>
          <li>Free delivery on orders of {formatMoney(FREE_SHIPPING_THRESHOLD)} or more.</li>
        </ul>
        <p>The fee is shown in your cart and at checkout before you pay.</p>
      </section>
      <section>
        <h2>How long it takes</h2>
        <ul>
          <li>Lagos: 1 to 3 working days.</li>
          <li>Other states: 3 to 7 working days.</li>
        </ul>
        <p>Orders are packed once payment is confirmed. Orders paid after 4pm or at weekends are packed the next working day.</p>
      </section>
      <section>
        <h2>Payment and reservations</h2>
        <p>
          You pay securely with Paystack by card, bank transfer or USSD. When you place an order we hold your items for {PAYMENT_WINDOW_MINUTES}{" "}
          minutes while you pay; if payment isn&apos;t completed in that time the order is cancelled and the items go back on sale.
        </p>
      </section>
      <section>
        <h2>Tracking your order</h2>
        <p>
          Follow every step, from paid to delivered, in <Link href="/account/orders">your orders</Link>. We&apos;ll also call the phone number on
          your delivery address to arrange the drop-off.
        </p>
      </section>
    </InfoPage>
  );
}
