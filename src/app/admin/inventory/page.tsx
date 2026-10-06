import { IconAlertTriangle, IconBan, IconPackages, IconStack2 } from "@tabler/icons-react";
import Link from "next/link";

import { EmptyState, PageHeader, rowEnter, SearchBox, StatCards, StatusPill, withQuery } from "@/components/admin/kit";
import { StockEditor } from "@/components/admin/small-actions";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { variantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { adminListInventory, inventorySummary } from "@/server/admin/catalog-admin";
import { requireAdmin } from "@/server/admin/guard";

export const metadata = { title: "Inventory" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin("/admin/inventory");
  const sp = await searchParams;
  const q = one(sp.q);
  const filter = one(sp.filter);
  const [variants, sum] = await Promise.all([adminListInventory({ q, filter }), inventorySummary()]);
  const href = (f: string | undefined) => withQuery("/admin/inventory", { q, filter: f });

  return (
    <>
      <PageHeader title="Inventory" description="Lowest stock first. Edit a number and press Enter to save." />
      <StatCards
        items={[
          { key: "all", label: "Variants", value: sum.variants, icon: <IconStack2 />, href: href(undefined), active: !filter },
          { key: "units", label: "Units in stock", value: sum.units, icon: <IconPackages />, tone: "success", hint: "Across every variant" },
          { key: "low", label: "Running low", value: sum.low, icon: <IconAlertTriangle />, tone: "warning", hint: "1–5 left", href: href(filter === "low" ? undefined : "low"), active: filter === "low" },
          { key: "out", label: "Out of stock", value: sum.out, icon: <IconBan />, tone: "danger", hint: "Can't be bought", href: href(filter === "out" ? undefined : "out"), active: filter === "out" },
        ]}
      />
      <div className="mb-4 flex justify-end">
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
              {variants.map((v, i) => (
                <TableRow key={v.id} className={rowEnter(i).className} style={rowEnter(i).style}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/products/${v.product?.id}`} className="font-medium hover:text-brand">
                      {v.product?.name}
                    </Link>
                  </TableCell>
                  <TableCell>{variantLabel(v) || "—"}{!v.isActive && <span className="ml-2 text-xs text-muted-foreground">(off)</span>}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{v.sku}</TableCell>
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
      </Card>
      {variants.length === 200 && <p className="mt-2 text-xs text-muted-foreground">Showing the first 200 — search to narrow down.</p>}
    </>
  );
}
