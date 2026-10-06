"use client";

import { IconArchive, IconDots, IconEdit, IconExternalLink, IconEye, IconEyeOff, IconTrash } from "@tabler/icons-react";
import Link from "next/link";

import { deleteProductAction, setProductStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmAction } from "./confirm-button";
import { useAdminAction } from "./use-admin-action";

export function ProductRowActions({ id, name, slug, status }: { id: string; name: string; slug: string; status: string }) {
  const { pending, run } = useAdminAction();
  return (
    <ConfirmAction
      title={`Delete “${name}”?`}
      description="This removes the product, its variants, images and reviews. Past orders keep their line items. Archive it instead if you might sell it again."
      action={() => deleteProductAction(id)}
      trigger={(openDelete) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} disabled={pending} />}>
            <IconDots />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem render={<Link href={`/admin/products/${id}`} />}>
              <IconEdit /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/product/${slug}`} target="_blank" />}>
              <IconExternalLink /> View in store
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status !== "ACTIVE" && (
              <DropdownMenuItem onClick={() => run(() => setProductStatusAction(id, "ACTIVE"))}>
                <IconEye /> Publish
              </DropdownMenuItem>
            )}
            {status !== "DRAFT" && (
              <DropdownMenuItem onClick={() => run(() => setProductStatusAction(id, "DRAFT"))}>
                <IconEyeOff /> Move to drafts
              </DropdownMenuItem>
            )}
            {status !== "ARCHIVED" && (
              <DropdownMenuItem onClick={() => run(() => setProductStatusAction(id, "ARCHIVED"))}>
                <IconArchive /> Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={openDelete}>
              <IconTrash /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
