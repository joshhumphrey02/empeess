"use client";

import { IconArrowDown, IconArrowUp, IconEdit, IconLoader2, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";

import { deleteCategoryAction, moveCategoryAction, saveCategoryAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { ConfirmAction } from "./confirm-button";
import { StatusPill } from "./kit";
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
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 pl-4">Order</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="w-28 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="pl-4">
                  <div className="flex gap-0.5">
                    <Button size="icon-xs" variant="ghost" disabled={i === 0 || pending} onClick={() => run(() => moveCategoryAction(c.id, "up"))} aria-label={`Move ${c.name} up`}>
                      <IconArrowUp />
                    </Button>
                    <Button size="icon-xs" variant="ghost" disabled={i === categories.length - 1 || pending} onClick={() => run(() => moveCategoryAction(c.id, "down"))} aria-label={`Move ${c.name} down`}>
                      <IconArrowDown />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">/shop/{c.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{c.productCount}</TableCell>
                <TableCell>
                  <StatusPill status={c.isActive ? "ACTIVE" : "ARCHIVED"} />
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
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
                        <Button size="icon-sm" variant="ghost" onClick={open} aria-label={`Delete ${c.name}`}>
                          <IconTrash />
                        </Button>
                      )}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <CategoryDialog key={formKey} category={editing} open={open} onOpenChange={setOpen} />
    </>
  );
}
