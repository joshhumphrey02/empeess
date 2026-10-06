import Link from "next/link";

import { EmptyState, FilterTabs, PageHeader, SearchBox, StatusPill, withQuery } from "@/components/admin/kit";
import { StockEditor } from "@/components/admin/small-actions";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { variantLabel } from "@/lib/format";
import { adminListInventory } from "@/server/admin/catalog-admin";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "Inventory" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin("/admin/inventory");
  const sp = await searchParams;
  const q = one(sp.q);
  const filter = one(sp.filter);
  const variants = await adminListInventory({ q, filter });

  return (
    <>
      <PageHeader title="Inventory" description="Lowest stock first. Edit a number and press Enter to save." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          active={filter ?? "all"}
          hrefFor={(v) => withQuery("/admin/inventory", { q, filter: v === "all" ? undefined : v })}
          options={[
            { value: "all", label: "All variants" },
            { value: "low", label: "Low (1–5)" },
            { value: "out", label: "Out of stock" },
          ]}
        />
        <SearchBox action="/admin/inventory" placeholder="Product or SKU" q={q} keep={{ filter }} />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        {variants.length === 0 ? (
          <EmptyState title="Nothing here">{filter ? "No variants in this stock range." : "No variants match."}</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="pr-4 text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/products/${v.product?.id}`} className="font-medium hover:underline">
                      {v.product?.name}
                    </Link>
                  </TableCell>
                  <TableCell>{variantLabel(v) || "—"}{!v.isActive && <span className="ml-2 text-xs text-muted-foreground">(off)</span>}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{v.sku}</TableCell>
                  <TableCell className="hidden sm:table-cell">{v.product && <StatusPill status={v.product.status} />}</TableCell>
                  <TableCell className="pr-4">
                    <StockEditor variantId={v.id} stock={v.stock} label={`${v.product?.name} ${variantLabel(v)}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {variants.length === 200 && <p className="mt-2 text-xs text-muted-foreground">Showing the first 200 — search to narrow down.</p>}
    </>
  );
}
