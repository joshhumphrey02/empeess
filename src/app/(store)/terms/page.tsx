import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = { title: "Terms & conditions | EMPEESS" };

// TODO(owner): a draft for a Nigerian online store; have a lawyer review before launch.
export default function TermsPage() {
  return (
    <InfoPage eyebrow="[Legal]" title="Terms & conditions" current="/terms" updated="6 October 2026">
      <section>
        <h2>About these terms</h2>
        <p>
          These terms apply when you browse or buy from EMPEESS (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By placing an order you agree to them. If
          anything is unclear, <Link href="/contact">contact us</Link>.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <ul>
          <li>Keep your password private. You&apos;re responsible for activity on your account.</li>
          <li>Give us accurate contact and delivery details so we can fulfil your orders.</li>
        </ul>
      </section>
      <section>
        <h2>Orders and prices</h2>
        <ul>
          <li>Prices are in Nigerian naira and include any applicable taxes. Delivery fees are shown at checkout.</li>
          <li>An order is accepted once payment is confirmed. We may cancel and fully refund an order if an item is unavailable or a price was shown in error.</li>
          <li>Unpaid orders are held for a short time and then cancelled automatically.</li>
        </ul>
      </section>
      <section>
        <h2>Payment</h2>
        <p>Payments are processed by Paystack. We never see or store your full card details.</p>
      </section>
      <section>
        <h2>Delivery, returns and refunds</h2>
        <p>
          See <Link href="/shipping">Shipping &amp; delivery</Link> and <Link href="/returns">Returns &amp; refunds</Link>. These don&apos;t affect
          your rights under Nigerian consumer protection law.
        </p>
      </section>
      <section>
        <h2>Reviews and content</h2>
        <p>Reviews must be honest and respectful. We may remove reviews that are abusive, misleading or spam.</p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          We&apos;re responsible for losses that are a foreseeable result of us breaking these terms, up to the value of your order. Nothing here
          limits liability that can&apos;t be limited by law.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update these terms. The version in force when you place an order applies to that order. These terms are governed by the laws of Nigeria.</p>
      </section>
    </InfoPage>
  );
}
