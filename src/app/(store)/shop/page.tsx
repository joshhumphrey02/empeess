import type { Metadata } from "next";

import { PageHeading } from "@/components/store/page-heading";
import { ProductListing } from "@/components/store/product-listing";

export const metadata: Metadata = {
  title: "Shop all | EMPEESS",
  description: "Clothes, joggers, hoodies and perfumes.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <PageHeading
        eyebrow="[Shop]"
        title="Shop all"
        description="Clothes, joggers, hoodies and perfumes. Every piece in one place."
        className="mb-10"
      />
      <ProductListing basePath="/shop" params={params} />
    </div>
  );
}
