import type { Metadata } from "next";

import { ProductGrid } from "@/components/store/product-card";
import { WishlistEmpty } from "@/components/store/wishlist";
import { requireUser } from "@/server/auth/session";
import { wishlistProducts } from "@/server/wishlist";

export const metadata: Metadata = { title: "Wishlist — EMPEESS" };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const products = await wishlistProducts(user.id);
  return (
    <section>
      <h1 className="mb-1 text-2xl font-medium tracking-tight">Wishlist</h1>
      <p className="mb-6 text-sm text-neutral-600">
        {products.length ? `${products.length} saved item${products.length === 1 ? "" : "s"}. Tap a heart to remove it.` : "Pieces you save show up here."}
      </p>
      <ProductGrid products={products} empty={<WishlistEmpty />} />
    </section>
  );
}
