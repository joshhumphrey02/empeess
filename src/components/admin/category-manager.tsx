"use client";

import { IconArrowLeft, IconArrowRight, IconEdit, IconExternalLink, IconLoader2, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { deleteCategoryAction, moveCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { ConfirmAction } from "./confirm-button";
import { useAdminAction } from "./use-admin-action";
import { discardUpload, useImageUpload } from "./use-image-upload";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  imageUrl: string | null;
  imageArkId: string | null;
  productCount: number;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { pending, run } = useAdminAction();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setActive] = useState(category?.isActive ?? true);
  const [image, setImage] = useState<{ arkAssetId: string; url: string } | null>(
    category?.imageUrl ? { arkAssetId: category.imageArkId ?? "", url: category.imageUrl } : null,
  );
  const { upload, uploading } = useImageUpload((img) => {
    // A fresh upload replaces an unsaved previous one.
    if (image && image.arkAssetId !== category?.imageArkId) discardUpload(image.arkAssetId);
    setImage({ arkAssetId: img.arkAssetId, url: img.url });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? `Edit ${category.name}` : "New category"}</DialogTitle>
          <DialogDescription>Categories group products in the shop menu and filters.</DialogDescription>
        </DialogHeader>
        <form
          id="category-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                saveCategoryAction({
                  id: category?.id,
                  name,
                  slug: slug || slugify(name),
                  description,
                  isActive,
                  image,
                }),
              { onSuccess: () => onOpenChange(false) },
            );
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-slug">URL</Label>
            <Input id="c-slug" value={slug} placeholder={slugify(name) || "e.g. hoodies"} onChange={(e) => setSlug(slugify(e.target.value))} />
            <p className="text-xs text-muted-foreground">/shop/{slug || slugify(name) || "…"}</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Image</Label>
            {image ? (
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                <Image src={image.url} alt="" fill sizes="480px" className="object-cover" />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="absolute right-2 top-2"
                  aria-label="Remove image"
                  onClick={() => {
                    if (image.arkAssetId && image.arkAssetId !== category?.imageArkId) discardUpload(image.arkAssetId);
                    setImage(null);
                  }}
                >
                  <IconX />
                </Button>
              </div>
            ) : (
              <FileUpload multiple={false} onChange={upload} title={uploading ? "Uploading…" : "Upload image"} hint="Used on the category page header" />
            )}
          </div>
          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="block font-medium">Visible in the store</span>
              <span className="block text-xs text-muted-foreground">Hidden categories keep their products but drop out of menus.</span>
            </span>
            <Switch checked={isActive} onCheckedChange={setActive} />
          </label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={pending || uploading}>
            {pending && <IconLoader2 className="animate-spin" />}
            {category ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { pending, run } = useAdminAction();

  const openDialog = (c: Category | null) => {
    setEditing(c);
    setFormKey((k) => k + 1); // fresh form state each time
    setOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openDialog(null)}>
          <IconPlus /> New category
        </Button>
      </div>
      {/* Cards glide to their new place when reordered (motion layout animation). */}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((c, i) => (
          <motion.li
            key={c.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ layout: { type: "spring", stiffness: 300, damping: 30 }, delay: i * 0.06 }}
            className="group relative overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_12px_40px_-16px_color-mix(in_oklch,var(--brand)_45%,transparent)]"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-muted">
              {c.imageUrl && (
                <Image
                  src={c.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  loading={i < 4 ? "eager" : undefined}
                  className={cn("object-cover transition-transform duration-700 group-hover:scale-105", !c.isActive && "grayscale")}
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
              <span className="absolute left-3 top-3 grid size-7 place-items-center rounded-full bg-black/50 text-xs font-semibold text-white backdrop-blur">
                {i + 1}
              </span>
              <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                <span aria-hidden className={cn("size-1.5 rounded-full", c.isActive ? "bg-emerald-400" : "bg-white/50")} />
                {c.isActive ? "Visible" : "Hidden"}
              </span>
              <div className="absolute inset-x-3 bottom-3 text-white">
                <p className="text-lg font-semibold">{c.name}</p>
                <p className="text-xs text-white/75">
                  {c.productCount} product{c.productCount === 1 ? "" : "s"} · /shop/{c.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 p-2">
              <div className="flex gap-0.5">
                <Button size="icon-sm" variant="ghost" disabled={i === 0 || pending} onClick={() => run(() => moveCategoryAction(c.id, "up"))} aria-label={`Move ${c.name} earlier`}>
                  <IconArrowLeft />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={i === categories.length - 1 || pending}
                  onClick={() => run(() => moveCategoryAction(c.id, "down"))}
                  aria-label={`Move ${c.name} later`}
                >
                  <IconArrowRight />
                </Button>
              </div>
              <div className="flex gap-0.5">
                <Link href={`/shop/${c.slug}`} target="_blank" className={buttonVariants({ size: "icon-sm", variant: "ghost" })} aria-label={`View ${c.name} in the store`}>
                  <IconExternalLink />
                </Link>
                <Button size="icon-sm" variant="ghost" onClick={() => openDialog(c)} aria-label={`Edit ${c.name}`}>
                  <IconEdit />
                </Button>
                <ConfirmAction
                  title={`Delete ${c.name}?`}
                  description={
                    c.productCount > 0
                      ? `It still has ${c.productCount} product${c.productCount === 1 ? "" : "s"}. Move them to another category first.`
                      : "This can't be undone."
                  }
                  action={() => deleteCategoryAction(c.id)}
                  trigger={(open) => (
                    <Button size="icon-sm" variant="ghost" onClick={open} aria-label={`Delete ${c.name}`} className="hover:text-destructive">
                      <IconTrash />
                    </Button>
                  )}
                />
              </div>
            </div>
          </motion.li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => openDialog(null)}
            className="flex size-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-brand hover:bg-brand-soft/40 hover:text-brand"
          >
            <IconPlus className="size-6" />
            Add a category
          </button>
        </li>
      </ul>
      <CategoryDialog key={formKey} category={editing} open={open} onOpenChange={setOpen} />
    </>
  );
}
