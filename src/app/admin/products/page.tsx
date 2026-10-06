import { IconArchive, IconBox, IconCircleCheck, IconPencil, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

import { AdminPagination, EmptyState, FilterTabs, PageHeader, SearchBox, SortHeader, StatCards, withQuery } from "@/components/admin/kit";
import { ProductsTable } from "@/components/admin/products-table";
import { Card } from "@/components/ui/card";
import { MovingBorderLink } from "@/components/ui/moving-border";
import { db } from "@/prisma/db";
import { adminListCategories } from "@/server/admin/catalog-admin";
import { requireAdmin } from "@/server/admin/guard";
import { adminListProducts } from "@/server/admin/products";

export const metadata = { title: "Products" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin("/admin/products");
  const sp = await searchParams;
  const q = one(sp.q);
  const status = one(sp.status);
  const category = one(sp.category);
  const page = Number(one(sp.page)) || 1;
  const sort = one(sp.sort);

  const [result, categories, counts] = await Promise.all([
    adminListProducts({ q, status, categoryId: category, page, sort }),
    adminListCategories(),
    db.orm.public.Product.groupBy("status").aggregate((a) => ({ count: a.count() })),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?.count ?? 0;
  const all = counts.reduce((n, c) => n + c.count, 0);
  const href = (patch: Record<string, string | number | undefined>) =>
    withQuery("/admin/products", { q, status, category, sort, ...patch });
  const sortHref = (next: string) => href({ sort: next || undefined, page: undefined });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${all} products in the catalog. Select rows for bulk actions.`}
        actions={
          <MovingBorderLink href="/admin/products/new">
            <IconPlus /> Add product
          </MovingBorderLink>
        }
      />

      <StatCards
        items={[
          { key: "all", label: "All products", value: all, icon: <IconBox />, href: href({ status: undefined, page: undefined }), active: !status },
          { key: "ACTIVE", label: "Active", value: countOf("ACTIVE"), icon: <IconCircleCheck />, tone: "success", hint: "Live in the store", href: href({ status: "ACTIVE", page: undefined }), active: status === "ACTIVE" },
          { key: "DRAFT", label: "Drafts", value: countOf("DRAFT"), icon: <IconPencil />, tone: "warning", hint: "Hidden until published", href: href({ status: "DRAFT", page: undefined }), active: status === "DRAFT" },
          { key: "ARCHIVED", label: "Archived", value: countOf("ARCHIVED"), icon: <IconArchive />, tone: "danger", hint: "No longer sold", href: href({ status: "ARCHIVED", page: undefined }), active: status === "ARCHIVED" },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          active={category ?? "any"}
          hrefFor={(v) => href({ category: v === "any" ? undefined : v, page: undefined })}
          options={[{ value: "any", label: "Any category" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <SearchBox action="/admin/products" placeholder="Search name, URL or SKU" q={q} keep={{ status, category, sort }} />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {result.products.length === 0 ? (
          <EmptyState title={q || status || category ? "No products match" : "No products yet"}>
            <Link href="/admin/products/new" className="underline underline-offset-4">
              Add your first product
            </Link>
          </EmptyState>
        ) : (
          <ProductsTable
            rows={result.products}
            headers={{
              name: <SortHeader label="Product" field="name" sort={sort} defaultSort="-updated" hrefFor={sortHref} />,
              price: <SortHeader label="Price" field="price" sort={sort} defaultSort="-updated" hrefFor={sortHref} className="text-right" />,
              updated: <SortHeader label="Updated" field="updated" sort={sort} defaultSort="-updated" hrefFor={sortHref} className="hidden lg:table-cell" />,
            }}
          />
        )}
        <AdminPagination page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
      </Card>
    </>
  );
}
