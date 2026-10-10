import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = { title: "Privacy policy | EMPEESS" };

// TODO(owner): a draft aligned with the Nigeria Data Protection Act 2023; have it reviewed before launch.
export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="[Legal]" title="Privacy policy" description="What we collect, why, and the choices you have." current="/privacy" updated="6 October 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your name, email address and, if you set one, a password (stored only as a secure hash).</li>
          <li>Orders and delivery: the items you buy, delivery addresses and phone numbers.</li>
          <li>Your activity in the store: cart, wishlist and reviews.</li>
          <li>Messages you send through the contact page, and your email if you join the newsletter.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To process and deliver your orders and send receipts and delivery updates.</li>
          <li>To run your account, keep it secure, and help when you contact us.</li>
          <li>To send the newsletter, only if you subscribe. Every newsletter has an unsubscribe link.</li>
        </ul>
      </section>
      <section>
        <h2>Who we share it with</h2>
        <ul>
          <li>Paystack, to take payments. Card details go directly to Paystack; we never see them.</li>
          <li>Google, if you choose to sign in with Google.</li>
          <li>Our email provider, to send account and order emails.</li>
          <li>Delivery partners, who receive your name, address and phone number for your order.</li>
        </ul>
        <p>We don&apos;t sell your personal data.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          We use essential cookies only: one keeps you signed in and one remembers a guest cart. We don&apos;t use advertising or tracking
          cookies.
        </p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>We keep order records as long as the law requires for tax and accounting, and account data until you ask us to delete your account.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Under the Nigeria Data Protection Act 2023 you can ask to see, correct or delete your data, or object to how we use it.{" "}
          <Link href="/contact">Contact us</Link> and we&apos;ll respond within 30 days.
        </p>
      </section>
    </InfoPage>
  );
}
