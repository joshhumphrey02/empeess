import { notFound } from "next/navigation";

import { PageHeader, StatusPill } from "@/components/admin/kit";
import { ProductForm } from "@/components/admin/product-form";
import { adminListCategories } from "@/server/admin/catalog-admin";
import { requireAccess } from "@/server/admin/guard";
import { adminGetProduct } from "@/server/admin/products";

export async function generateMetadata({ params }: PageProps<"/admin/products/[id]">) {
  const product = await adminGetProduct((await params).id).catch(() => null);
  return { title: product ? `Edit ${product.name}` : "Product" };
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  await requireAccess("catalog", `/admin/products/${id}`);
  const [product, categories] = await Promise.all([adminGetProduct(id).catch(() => null), adminListCategories()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusPill status={product.status} /> /product/{product.slug}
          </span>
        }
      />
      {/* key: remount the form with fresh state after a save re-renders the page */}
      <ProductForm key={product.updatedAt} product={product} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
