import Link from "next/link";

import { PageHeader } from "@/components/admin/kit";
import { ProductForm } from "@/components/admin/product-form";
import { adminListCategories } from "@/server/admin/catalog-admin";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  const categories = await adminListCategories();
  return (
    <>
      <PageHeader title="Add product" description="Starts as a draft — publish when it's ready." />
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a <Link href="/admin/categories" className="underline">category</Link> first.
        </p>
      ) : (
        <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </>
  );
}
