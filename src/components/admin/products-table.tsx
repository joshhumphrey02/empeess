"use client";

import { IconArchive, IconEye, IconEyeOff, IconTrash, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { bulkDeleteProductsAction, bulkSetProductStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ConfirmAction } from "./confirm-button";
import { StatusPill } from "./kit";
import { ProductRowActions } from "./product-row-actions";
import { useAdminAction } from "./use-admin-action";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  basePrice: number;
  category: string | null;
  image: string | null;
  variantCount: number;
  stock: number;
  updatedAt: string;
};

/**
 * Products table with row selection and a floating bulk-action bar.
 * Sortable headers are rendered on the server and passed in as nodes.
 */
export function ProductsTable({
  rows,
  headers,
}: {
  rows: ProductRow[];
  headers: { name: React.ReactNode; price: React.ReactNode; updated: React.ReactNode };
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { pending, run } = useAdminAction();

  // Drop selections that left the page (after a delete or a filter change).
  const visible = new Set(rows.map((r) => r.id));
  const chosen = [...selected].filter((id) => visible.has(id));
  const all = chosen.length === rows.length && rows.length > 0;

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const clear = () => setSelected(new Set());

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pl-4">
              <Checkbox
                aria-label="Select all products on this page"
                checked={all}
                indeterminate={chosen.length > 0 && !all}
                onCheckedChange={(on) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set())}
              />
            </TableHead>
            <TableHead className="w-14" />
            {headers.name}
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            {headers.price}
            <TableHead className="text-right">Stock</TableHead>
            {headers.updated}
            <TableHead className="w-12 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => {
            const isSelected = chosen.includes(p.id);
            return (
              <TableRow
                key={p.id}
                data-state={isSelected ? "selected" : undefined}
                className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-500"
                style={{ animationDelay: `${Math.min(i, 16) * 30}ms` }}
              >
                <TableCell className="pl-4">
                  <Checkbox aria-label={`Select ${p.name}`} checked={isSelected} onCheckedChange={(on) => toggle(p.id, on)} />
                </TableCell>
                <TableCell>
                  <div className="group/img relative size-11 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                    {p.image && (
                      <Image src={p.image} alt="" fill sizes="44px" className="object-cover transition-transform duration-500 group-hover/img:scale-110" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-brand hover:underline">
                    {p.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {p.variantCount} variant{p.variantCount === 1 ? "" : "s"}
                    {p.isFeatured && <span className="ml-1.5 rounded bg-brand-soft px-1.5 py-px text-[10px] font-medium text-brand">Featured</span>}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusPill status={p.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">{p.category}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(p.basePrice)}</TableCell>
                <TableCell className="text-right">
                  <StockMeter stock={p.stock} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(p.updatedAt)}</TableCell>
                <TableCell className="pr-4">
                  <ProductRowActions id={p.id} name={p.name} slug={p.slug} status={p.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AnimatePresence>
        {chosen.length > 0 && (
          <motion.div
            role="toolbar"
            aria-label="Bulk actions"
            initial={{ y: 80, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 80, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-2xl border bg-popover/95 p-1.5 text-popover-foreground shadow-2xl shadow-brand/20 backdrop-blur"
          >
            <span className="flex items-center gap-2 whitespace-nowrap px-3 text-sm font-medium">
              <motion.span key={chosen.length} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs leading-6 text-primary-foreground">
                {chosen.length}
              </motion.span>
              selected
            </span>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => bulkSetProductStatusAction(chosen, "ACTIVE"), { onSuccess: clear })}>
              <IconEye /> Publish
            </Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => bulkSetProductStatusAction(chosen, "DRAFT"), { onSuccess: clear })}>
              <IconEyeOff /> Draft
            </Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => bulkSetProductStatusAction(chosen, "ARCHIVED"), { onSuccess: clear })}>
              <IconArchive /> Archive
            </Button>
            <ConfirmAction
              title={`Delete ${chosen.length} product${chosen.length === 1 ? "" : "s"}?`}
              description="This removes them with their variants, images and reviews. Past orders keep their line items. Archive instead if you might sell them again."
              action={() => bulkDeleteProductsAction(chosen)}
              onDone={clear}
              trigger={(open) => (
                <Button variant="ghost" size="sm" disabled={pending} onClick={open} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <IconTrash /> Delete
                </Button>
              )}
            />
            <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={clear}>
              <IconX />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Units in stock with a small bar; red when out, amber when low. */
function StockMeter({ stock }: { stock: number }) {
  const pct = Math.min(100, (stock / 50) * 100);
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
        <span
          className={cn("block h-full origin-left animate-grow-x rounded-full", stock === 0 ? "bg-red-500" : stock <= 5 ? "bg-amber-500" : "bg-brand")}
          style={{ width: `${stock === 0 ? 100 : Math.max(6, pct)}%` }}
        />
      </span>
      <span className={cn("w-8 tabular-nums", stock === 0 && "font-medium text-red-700 dark:text-red-400")}>{stock === 0 ? "Out" : stock}</span>
    </span>
  );
}
