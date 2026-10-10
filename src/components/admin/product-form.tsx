"use client";

import {
  IconArrowLeft,
  IconArrowRight,
  IconExternalLink,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconWand,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { deleteProductAction, saveProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AdminProduct, ProductInput, ProductStatus } from "@/server/admin/products";

import { ConfirmAction } from "./confirm-button";
import { discardUpload, useImageUpload } from "./use-image-upload";
import { useAdminAction } from "./use-admin-action";

type VariantRow = {
  key: string;
  id?: string;
  sku: string;
  size: string;
  color: string;
  volumeMl: string;
  price: string;
  stock: string;
  isActive: boolean;
};
type ImageRow = ProductInput["images"][number] & { key: string };

const STATUS_ITEMS = [
  { value: "ACTIVE", label: "Active (visible in the store)" },
  { value: "DRAFT", label: "Draft (hidden)" },
  { value: "ARCHIVED", label: "Archived (hidden)" },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
const naira = (kobo: number | null) => (kobo === null ? "" : String(kobo / 100));
let keySeq = 0;
const nextKey = () => `k${++keySeq}`;

function autoSku(slug: string, v: Pick<VariantRow, "color" | "size" | "volumeMl">) {
  return [slug, v.color, v.size, v.volumeMl ? `${v.volumeMl}ML` : ""]
    .filter(Boolean)
    .join("-")
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-");
}

export function ProductForm({
  product,
  categories,
}: {
  product?: AdminProduct;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { pending, run } = useAdminAction();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(product?.categoryId ?? categories[0]?.id ?? null);
  const [status, setStatus] = useState<ProductStatus>((product?.status as ProductStatus) ?? "DRAFT");
  const [isFeatured, setFeatured] = useState(product?.isFeatured ?? false);
  const [basePrice, setBasePrice] = useState(naira(product?.basePrice ?? null));
  const [compareAt, setCompareAt] = useState(naira(product?.compareAtPrice ?? null));
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      key: nextKey(),
      id: v.id,
      sku: v.sku,
      size: v.size ?? "",
      color: v.color ?? "",
      volumeMl: v.volumeMl ? String(v.volumeMl) : "",
      price: naira(v.price),
      stock: String(v.stock),
      isActive: v.isActive,
    })) ?? [{ key: nextKey(), sku: "", size: "", color: "", volumeMl: "", price: "", stock: "0", isActive: true }],
  );
  const [images, setImages] = useState<ImageRow[]>(
    product?.images.map((i) => ({
      key: nextKey(),
      id: i.id,
      arkAssetId: i.arkAssetId,
      url: i.url,
      thumbnailUrl: i.thumbnailUrl,
      compressedUrl: i.compressedUrl,
      mimeType: i.mimeType,
      size: i.size,
      width: i.width,
      height: i.height,
      alt: i.alt ?? "",
    })) ?? [],
  );
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);

  const { upload, uploading, inFlight } = useImageUpload((img) => {
    setImages((list) => [...list, { ...img, key: nextKey(), alt: name }]);
    touch();
  });

  const effectiveSlug = slugTouched ? slug : slugify(name);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const totalStock = useMemo(() => variants.reduce((n, v) => n + (Number(v.stock) || 0), 0), [variants]);

  function updateVariant(key: string, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    touch();
  }

  function addSizeRun() {
    const color = variants.at(-1)?.color ?? "";
    const existing = new Set(variants.map((v) => `${v.color}|${v.size}`));
    const fresh = ["S", "M", "L", "XL"]
      .filter((size) => !existing.has(`${color}|${size}`))
      .map((size) => ({ key: nextKey(), sku: "", size, color, volumeMl: "", price: "", stock: "0", isActive: true }));
    // Replace a single blank starter row instead of keeping it around.
    setVariants((rows) =>
      rows.length === 1 && !rows[0]!.id && !rows[0]!.size && !rows[0]!.color && !rows[0]!.volumeMl ? fresh : [...rows, ...fresh],
    );
    touch();
  }

  function fillSkus() {
    setVariants((rows) => rows.map((r) => (r.sku ? r : { ...r, sku: autoSku(effectiveSlug, r) })));
    touch();
  }

  function moveImage(index: number, delta: number) {
    setImages((list) => {
      const next = [...list];
      const j = index + delta;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j]!, next[index]!];
      return next;
    });
    touch();
  }

  function removeImage(row: ImageRow) {
    setImages((list) => list.filter((i) => i.key !== row.key));
    if (!row.id) discardUpload(row.arkAssetId); // never saved → drop it from Ark now
    touch();
  }

  function save() {
    const toNumber = (s: string) => (s.trim() === "" ? null : Number(s));
    const payload: ProductInput = {
      id: product?.id,
      name,
      slug: effectiveSlug,
      description,
      categoryId: categoryId ?? "",
      status,
      isFeatured,
      basePrice: Number(basePrice),
      compareAtPrice: toNumber(compareAt),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku || autoSku(effectiveSlug, v),
        size: v.size,
        color: v.color,
        volumeMl: toNumber(v.volumeMl),
        price: toNumber(v.price),
        stock: Number(v.stock),
        isActive: v.isActive,
      })),
      images: images.map((img) => ({
        id: img.id,
        arkAssetId: img.arkAssetId,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        compressedUrl: img.compressedUrl,
        mimeType: img.mimeType,
        size: img.size,
        width: img.width,
        height: img.height,
        alt: img.alt,
      })),
    };
    run(() => saveProductAction(payload), {
      onSuccess: (id) => {
        setDirty(false);
        if (!product && id) router.push(`/admin/products/${id}`);
      },
    });
  }

  const price = Number(basePrice);
  const compare = Number(compareAt);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      onChange={touch}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid min-w-0 gap-4">
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="Cream Statement Hoodie" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-slug">URL</Label>
                <div className="flex items-center rounded-lg border focus-within:ring-3 focus-within:ring-ring/50">
                  <span className="pl-2.5 text-sm text-muted-foreground">/product/</span>
                  <input
                    id="p-slug"
                    value={effectiveSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={4000} placeholder="Fabric, fit, notes…" />
              </div>
            </CardContent>
          </SpotlightCard>

          <SpotlightCard>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Stored on Ark. The first image is the cover; drag order with the arrows.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {images.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence initial={false}>
                    {images.map((img, i) => (
                      <motion.li
                        key={img.key}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group overflow-hidden rounded-xl border bg-card"
                      >
                        <div className="relative aspect-square bg-muted">
                          <Image src={img.thumbnailUrl ?? img.url} alt={img.alt} fill sizes="200px" className="object-cover" unoptimized={!img.url.includes("images.unsplash.com") && !img.url.includes("cdn.nerdstackgrp.com")} />
                          {i === 0 && (
                            <span className="absolute left-2 top-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium uppercase">Cover</span>
                          )}
                          <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <span className="flex gap-1">
                              <Button type="button" size="icon-xs" variant="secondary" disabled={i === 0} onClick={() => moveImage(i, -1)} aria-label="Move earlier">
                                <IconArrowLeft />
                              </Button>
                              <Button type="button" size="icon-xs" variant="secondary" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)} aria-label="Move later">
                                <IconArrowRight />
                              </Button>
                            </span>
                            <Button type="button" size="icon-xs" variant="destructive" className="bg-background/90" onClick={() => removeImage(img)} aria-label="Remove image">
                              <IconTrash />
                            </Button>
                          </div>
                        </div>
                        <input
                          value={img.alt}
                          onChange={(e) => setImages((list) => list.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)))}
                          placeholder="Alt text"
                          aria-label={`Alt text for image ${i + 1}`}
                          className="h-8 w-full border-t bg-transparent px-2 text-xs outline-none focus:bg-muted/50"
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              <FileUpload
                onChange={upload}
                title={uploading ? `Uploading ${inFlight} image${inFlight === 1 ? "" : "s"}…` : "Upload images"}
                hint="JPG, PNG, WebP, AVIF or GIF · up to 10 MB each"
              />
            </CardContent>
          </SpotlightCard>

          <SpotlightCard>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="p-price">Price (₦)</Label>
                <Input id="p-price" type="number" inputMode="decimal" min={1} step="any" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="45000" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-compare">Compare-at price (₦)</Label>
                <Input id="p-compare" type="number" inputMode="decimal" min={1} step="any" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Optional, shows a sale" />
              </div>
              {compare > price && price > 0 && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Shows as on sale: {Math.round((1 - price / compare) * 100)}% off.
                </p>
              )}
            </CardContent>
          </SpotlightCard>

          <SpotlightCard>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  {variants.length} variant{variants.length === 1 ? "" : "s"} · {totalStock} in stock. Leave price empty to use the product price.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={addSizeRun}>
                  <IconWand /> Add S–XL
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={fillSkus}>
                  Generate SKUs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Colour</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium">Volume (ml)</th>
                    <th className="pb-2 font-medium">Price (₦)</th>
                    <th className="pb-2 font-medium">Stock</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium">On</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.key} className="border-t align-middle">
                      <td className="py-2 pr-2"><Input aria-label={`Variant ${i + 1} colour`} value={v.color} onChange={(e) => updateVariant(v.key, { color: e.target.value })} placeholder="Black" /></td>
                      <td className="py-2 pr-2"><Input aria-label={`Variant ${i + 1} size`} value={v.size} onChange={(e) => updateVariant(v.key, { size: e.target.value })} placeholder="M" className="w-20" /></td>
                      <td className="py-2 pr-2"><Input aria-label={`Variant ${i + 1} volume`} type="number" min={1} value={v.volumeMl} onChange={(e) => updateVariant(v.key, { volumeMl: e.target.value })} placeholder="-" className="w-24" /></td>
                      <td className="py-2 pr-2"><Input aria-label={`Variant ${i + 1} price`} type="number" min={1} step="any" value={v.price} onChange={(e) => updateVariant(v.key, { price: e.target.value })} placeholder={basePrice || "-"} className="w-28" /></td>
                      <td className="py-2 pr-2"><Input aria-label={`Variant ${i + 1} stock`} type="number" min={0} step={1} required value={v.stock} onChange={(e) => updateVariant(v.key, { stock: e.target.value })} className={cn("w-20", Number(v.stock) === 0 && "text-red-700 dark:text-red-400")} /></td>
                      <td className="py-2 pr-2"><Input aria-label={`Variant ${i + 1} SKU`} value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value.toUpperCase() })} placeholder={autoSku(effectiveSlug || "SKU", v)} className="w-56 font-mono text-xs" /></td>
                      <td className="py-2 pr-2"><Switch aria-label={`Variant ${i + 1} available`} checked={v.isActive} onCheckedChange={(checked) => updateVariant(v.key, { isActive: checked })} /></td>
                      <td className="py-2">
                        <Button type="button" size="icon-sm" variant="ghost" disabled={variants.length === 1} onClick={() => { setVariants((rows) => rows.filter((r) => r.key !== v.key)); touch(); }} aria-label={`Remove variant ${i + 1}`}>
                          <IconTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  const last = variants.at(-1);
                  setVariants((rows) => [...rows, { key: nextKey(), sku: "", size: "", color: last?.color ?? "", volumeMl: "", price: "", stock: "0", isActive: true }]);
                  touch();
                }}
              >
                <IconPlus /> Add variant
              </Button>
            </CardContent>
          </SpotlightCard>
        </div>

        <div className="grid h-fit gap-4 lg:sticky lg:top-20">
          <SpotlightCard>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select items={STATUS_ITEMS} value={status} onValueChange={(v) => { if (v) { setStatus(v as ProductStatus); touch(); } }}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ITEMS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select
                  items={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onValueChange={(v) => { setCategoryId(v as string | null); touch(); }}
                >
                  <SelectTrigger className="w-full" aria-label="Category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="block font-medium">Featured</span>
                  <span className="block text-xs text-muted-foreground">Shown first in the shop</span>
                </span>
                <Switch checked={isFeatured} onCheckedChange={(c) => { setFeatured(c); touch(); }} />
              </label>
            </CardContent>
          </SpotlightCard>

          {product && (
            <SpotlightCard size="sm">
              <CardContent className="grid gap-2 text-sm">
                <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <IconExternalLink className="size-4" /> View in store
                </Link>
                <ConfirmAction
                  title={`Delete “${product.name}”?`}
                  description="This removes the product, its variants, images and reviews. Past orders keep their line items. This can't be undone. Archive it instead to hide it."
                  action={() => deleteProductAction(product.id)}
                  onDone={() => router.push("/admin/products")}
                  trigger={(open) => (
                    <button type="button" onClick={open} className="inline-flex items-center gap-1.5 text-left text-red-700 hover:underline dark:text-red-400">
                      <IconTrash className="size-4" /> Delete product
                    </button>
                  )}
                />
              </CardContent>
            </SpotlightCard>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 mt-4 border-t bg-background/90 backdrop-blur md:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-end gap-2 px-4 py-3 md:px-6 lg:px-8">
          <span className="mr-auto text-sm text-muted-foreground">
            {uploading ? "Waiting for uploads…" : dirty ? "Unsaved changes" : product ? "All changes saved" : "New product"}
          </span>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || uploading}>
            {pending && <IconLoader2 className="animate-spin" />}
            {product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
