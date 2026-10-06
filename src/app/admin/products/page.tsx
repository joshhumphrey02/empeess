import { IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { AdminPagination, EmptyState, FilterTabs, PageHeader, SearchBox, StatusPill, withQuery } from "@/components/admin/kit";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
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

  const [result, categories, counts] = await Promise.all([
    adminListProducts({ q, status, categoryId: category, page }),
    adminListCategories(),
    db.orm.public.Product.groupBy("status").aggregate((a) => ({ count: a.count() })),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?.count ?? 0;
  const all = counts.reduce((n, c) => n + c.count, 0);
  const href = (patch: Record<string, string | number | undefined>) =>
    withQuery("/admin/products", { q, status, category, ...patch });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${all} products in the catalog`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants()}>
            <IconPlus /> Add product
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          active={status ?? "all"}
          hrefFor={(v) => href({ status: v === "all" ? undefined : v, page: undefined })}
          options={[
            { value: "all", label: "All", count: all },
            { value: "ACTIVE", label: "Active", count: countOf("ACTIVE") },
            { value: "DRAFT", label: "Drafts", count: countOf("DRAFT") },
            { value: "ARCHIVED", label: "Archived", count: countOf("ARCHIVED") },
          ]}
        />
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <nav aria-label="Category" className="flex flex-wrap gap-1">
            <Link
              href={href({ category: undefined, page: undefined })}
              className={cn(buttonVariants({ variant: category ? "ghost" : "secondary", size: "sm" }))}
            >
              Any category
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={href({ category: c.id, page: undefined })}
                aria-current={category === c.id ? "page" : undefined}
                className={cn(buttonVariants({ variant: category === c.id ? "secondary" : "ghost", size: "sm" }))}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <SearchBox action="/admin/products" placeholder="Search name, URL or SKU" q={q} keep={{ status, category }} />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {result.products.length === 0 ? (
          <EmptyState title={q || status || category ? "No products match" : "No products yet"}>
            <Link href="/admin/products/new" className="underline underline-offset-4">
              Add your first product
            </Link>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 pl-4" />
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                      {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {p.variantCount} variant{p.variantCount === 1 ? "" : "s"}
                      {p.isFeatured && " · Featured"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(p.basePrice)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", p.stock === 0 && "font-medium text-red-700 dark:text-red-400")}>
                    {p.stock === 0 ? "Out" : p.stock}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(p.updatedAt)}</TableCell>
                  <TableCell className="pr-4">
                    <ProductRowActions id={p.id} name={p.name} slug={p.slug} status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination page={result.page} pageCount={result.pageCount} total={result.total} hrefFor={(n) => href({ page: n > 1 ? n : undefined })} />
      </Card>
    </>
  );
}
