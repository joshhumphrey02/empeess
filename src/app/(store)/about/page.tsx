import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage } from "@/components/store/info-page";

export const metadata: Metadata = { title: "About us | EMPEESS", description: "EMPEESS makes everyday streetwear and fragrances in Lagos." };

// TODO(owner): replace with the brand's own story and photos.
export default function AboutPage() {
  return (
    <InfoPage eyebrow="[About]" title="Made for everyday style" description="Clothes, joggers, hoodies and perfumes, chosen to be worn hard and loved for a long time." current="/about">
      <section>
        <h2>Who we are</h2>
        <p>
          EMPEESS is an urban fashion label from Lagos. We design relaxed, well-made pieces you can wear from the morning commute to a late
          night out, and pair them with fragrances that last.
        </p>
        <p>We release in small drops so every piece gets the attention it deserves, and restock the favourites you ask for.</p>
      </section>
      <section>
        <h2>What we care about</h2>
        <ul>
          <li>Heavyweight fabrics and clean finishing that hold up wash after wash.</li>
          <li>Fits that work on real bodies, with clear sizing on every product.</li>
          <li>Honest prices in naira, secure checkout and fast delivery across Nigeria.</li>
        </ul>
      </section>
      <section>
        <h2>Say hello</h2>
        <p>
          Questions about sizing, an order or a collaboration? <Link href="/contact">Get in touch</Link>, or{" "}
          <Link href="/shop">browse the shop</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
