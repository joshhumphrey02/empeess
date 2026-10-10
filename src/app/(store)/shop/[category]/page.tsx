import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/store/page-heading";
import { ProductListing } from "@/components/store/product-listing";
import { getCategoryBySlug } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category);
  if (!category) return { title: "Not found | EMPEESS" };
  return { title: `${category.name} | EMPEESS`, description: category.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <PageHeading
        eyebrow={`[Category] ${category.productCount} products`}
        title={category.name}
        description={category.description}
        className="mb-10"
      />
      <ProductListing
        basePath={`/shop/${category.slug}`}
        params={query}
        categoryId={category.id}
        showCategories={false}
      />
    </div>
  );
}
