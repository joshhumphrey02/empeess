import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/store/page-heading";
import { ProductListing } from "@/components/store/product-listing";
import { getCategoryBySlug } from "@/server/catalog";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category);
  if (!category) return { title: "Not found — EMPEESS" };
  return { title: `${category.name} — EMPEESS`, description: category.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <div className="mb-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
        <PageHeading eyebrow={`[Category] ${category.productCount} products`} title={category.name} description={category.description} />
        {category.imageUrl && (
          <div className="chamfer relative hidden aspect-4/3 w-64 overflow-hidden bg-neutral-100 md:block" style={{ ["--cut" as string]: "16%" }}>
            <Image src={category.imageUrl} alt="" fill sizes="256px" className="object-cover" preload />
          </div>
        )}
      </div>
      <ProductListing
        basePath={`/shop/${category.slug}`}
        params={query}
        categoryId={category.id}
        activeCategory={category.slug}
      />
    </div>
  );
}
