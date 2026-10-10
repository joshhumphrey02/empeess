import { CategoryManager } from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/kit";
import { adminListCategories } from "@/server/admin/catalog-admin";
import { requireAccess } from "@/server/admin/guard";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAccess("catalog", "/admin/categories");
  const categories = await adminListCategories();
  return (
    <>
      <PageHeader title="Categories" description="The order here is the order in the shop menu." />
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          isActive: c.isActive,
          imageUrl: c.imageUrl,
          imageArkId: c.imageArkId,
          productCount: c.productCount,
        }))}
      />
    </>
  );
}
