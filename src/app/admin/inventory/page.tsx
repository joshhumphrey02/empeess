import { IconAlertTriangle, IconBan, IconPackages, IconStack2 } from "@tabler/icons-react";
import Link from "next/link";

import {
  AdminPagination,
  ClearFilters,
  EmptyState,
  PageHeader,
  rowEnter,
  SearchBox,
  SelectFilter,
  SortHeader,
  StatCards,
  StatusPill,
  withQuery,
} from "@/components/admin/kit";
import { StockEditor } from "@/components/admin/small-actions";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { variantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { adminListCategories, adminListInventory, inventorySummary } from "@/server/admin/catalog-admin";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "Inventory" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const FILTER_PARAMS = ["q", "stock", "category", "status", "visibility"];

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin("/admin/inventory");
  const sp = await searchParams;
  const params = {
    q: one(sp.q),
    stock: one(sp.stock),
    category: one(sp.category),
    status: one(sp.status),
    visibility: one(sp.visibility),
    sort: one(sp.sort),
  };
  const page = Number(one(sp.page)) || 1;

  const [result, sum, categories] = await Promise.all([
    adminListInventory({ ...params, page }),
    inventorySummary(),
    adminListCategories(),
  ]);
  const href = (patch: Record<string, string | number | undefined>) => withQuery("/admin/inventory", { ...params, ...patch });
  const stockHref = (s: string | undefined) => href({ stock: params.stock === s ? undefined : s, page: undefined });
  const sortHref = (next: string) => href({ sort: next || undefined, page: undefined });
  const filtered = FILTER_PARAMS.some((k) => params[k as keyof typeof params]);

  return (
    <>
      <PageHeader title="Inventory" description="Lowest stock first. Edit a number and press Enter to save." />
      <StatCards
        items={[
          { key: "all", label: "Variants", value: sum.variants, icon: <IconStack2 />, href: href({ stock: undefined, page: undefined }), active: !params.stock },
          { key: "units", label: "Units in stock", value: sum.units, icon: <IconPackages />, tone: "success", hint: "Across every variant" },
          { key: "low", label: "Running low", value: sum.low, icon: <IconAlertTriangle />, tone: "warning", hint: "1–5 left", href: stockHref("low"), active: params.stock === "low" },
          { key: "out", label: "Out of stock", value: sum.out, icon: <IconBan />, tone: "danger", hint: "Can't be bought", href: stockHref("out"), active: params.stock === "out" },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox
          action="/admin/inventory"
          placeholder="Product or SKU"
          q={params.q}
          keep={{ stock: params.stock, category: params.category, status: params.status, visibility: params.visibility, sort: params.sort }}
        />
        <SelectFilter
          param="stock"
          label="Stock level"
          allLabel="Any stock level"
          options={[
            { value: "in", label: "In stock (6+)" },
            { value: "low", label: "Running low (1–5)" },
            { value: "out", label: "Out of stock" },
          ]}
        />
        <SelectFilter param="category" label="Category" allLabel="All categories" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <SelectFilter
          param="status"
          label="Product status"
          allLabel="Any product status"
          options={[
            { value: "ACTIVE", label: "Active products" },
            { value: "DRAFT", label: "Draft products" },
            { value: "ARCHIVED", label: "Archived products" },
          ]}
        />
        <SelectFilter
          param="visibility"
          label="Variant visibility"
          allLabel="On and off variants"
          options={[
            { value: "on", label: "On (sellable)" },
            { value: "off", label: "Off (hidden)" },
          ]}
        />
        <ClearFilters params={FILTER_PARAMS} />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {result.variants.length === 0 ? (
          <EmptyState title="Nothing here">{filtered ? "No variants match these filters." : "No variants yet."}</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>Variant</TableHead>
                <SortHeader label="SKU" field="sku" sort={params.sort} defaultSort="stock" hrefFor={sortHref} className="hidden md:table-cell" />
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <SortHeader label="Stock" field="stock" sort={params.sort} defaultSort="stock" hrefFor={sortHref} className="pr-4 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.variants.map((v, i) => (
                <TableRow key={v.id} className={rowEnter(i).className} style={rowEnter(i).style}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/products/${v.product?.id}`} className="font-medium hover:text-brand">
                      {v.product?.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {variantLabel(v) || "—"}
                    {!v.isActive && <span className="ml-2 rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">Off</span>}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{v.sku}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{v.product?.category?.name ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{v.product && <StatusPill status={v.product.status} />}</TableCell>
                  <TableCell className="pr-4">
                    <span className="flex items-center justify-end gap-3">
                      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
                        <span
                          className={cn("block h-full origin-left animate-grow-x rounded-full", v.stock === 0 ? "bg-red-500" : v.stock <= 5 ? "bg-amber-500" : "bg-brand")}
                          style={{ width: `${v.stock === 0 ? 100 : Math.max(8, Math.min(100, (v.stock / 30) * 100))}%` }}
                        />
                      </span>
                      <StockEditor variantId={v.id} stock={v.stock} label={`${v.product?.name} ${variantLabel(v)}`} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          hrefFor={(n) => href({ page: n > 1 ? n : undefined })}
          pageSize={result.pageSize}
        />
      </Card>
    </>
  );
}
