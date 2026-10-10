import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = { title: "Returns & refunds | EMPEESS" };

// TODO(owner): confirm the return window and conditions.
export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="[Help]" title="Returns & refunds" description="Not the right fit? You can return it within 7 days of delivery." current="/returns" updated="6 October 2026">
      <section>
        <h2>What can be returned</h2>
        <ul>
          <li>Clothing, joggers and hoodies that are unworn, unwashed and still have their tags.</li>
          <li>Perfumes only if the box is unopened and the seal is intact.</li>
          <li>Items marked final sale can&apos;t be returned.</li>
        </ul>
      </section>
      <section>
        <h2>How to return</h2>
        <ul>
          <li>
            <Link href="/contact">Contact us</Link> within 7 days of delivery with your order number and what you&apos;d like to return.
          </li>
          <li>We&apos;ll reply with how to send it back or arrange a pickup.</li>
          <li>Once it arrives and passes a quick check, we process your refund or exchange.</li>
        </ul>
      </section>
      <section>
        <h2>Refunds</h2>
        <p>
          Refunds go back to the card or account you paid with through Paystack. They&apos;re usually processed within 2 working days of us
          receiving the item; your bank may take a few more days to show it.
        </p>
        <p>If we cancel an order or an item is unavailable after you&apos;ve paid, we refund you in full straight away.</p>
      </section>
      <section>
        <h2>Unpaid orders</h2>
        <p>
          Orders that haven&apos;t been paid for can be cancelled from <Link href="/account/orders">your orders</Link> at any time.
        </p>
      </section>
    </InfoPage>
  );
}
