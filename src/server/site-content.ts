import "server-only";

import { cache } from "react";

import { applyOverrides, CONTENT_FIELDS, defaultFor, isUploadedImageUrl, siteDefaults } from "@/lib/site-content";
import { db } from "@/prisma/db";

import { deleteImages } from "./admin/ark";
import { AdminInputError } from "./admin/catalog-admin";

/** The client's saved values, keyed by path. */
export const getContentOverrides = cache(async () => {
  const rows = await db.orm.public.SiteContent.select("key", "value", "arkId").all();
  return rows;
});

/**
 * Storefront content: the defaults with the client's edits applied. Cached per
 * request. A failed read falls back to the defaults, so a database hiccup
 * can't take the home page down over its copy.
 */
export const getSiteContent = cache(async () => {
  try {
    const rows = await getContentOverrides();
    return applyOverrides(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (error) {
    console.error("[site-content] falling back to defaults", error);
    return siteDefaults;
  }
});

export type ContentChange = { value: string; arkId?: string | null } | null;

/**
 * Saves edits from the dashboard. `null`, an empty value, or a value equal to
 * the default removes the override. Replaced uploads are deleted from Ark.
 */
export async function saveSiteContent(changes: Record<string, ContentChange>) {
  const entries = Object.entries(changes);
  if (entries.length === 0) return;
  if (entries.length > CONTENT_FIELDS.size) throw new AdminInputError("Too many changes at once.");

  const clean: { key: string; value: string | null; arkId: string | null }[] = [];
  for (const [key, change] of entries) {
    const rule = CONTENT_FIELDS.get(key);
    if (!rule) throw new AdminInputError("That field can't be edited.");
    const value = change?.value.trim() ?? "";
    if (!value || value === defaultFor(key)) {
      clean.push({ key, value: null, arkId: null });
      continue;
    }
    if (rule.type === "image") {
      if (!isUploadedImageUrl(value)) throw new AdminInputError("Upload the image rather than pasting a link.");
      clean.push({ key, value, arkId: change?.arkId ?? null });
    } else {
      if (value.length > rule.max) throw new AdminInputError(`Keep that text under ${rule.max} characters.`);
      clean.push({ key, value, arkId: null });
    }
  }

  const keys = clean.map((c) => c.key);
  const previous = await db.orm.public.SiteContent.where((c) => c.key.in(keys)).select("key", "arkId").all();
  await db.transaction(async (tx) => {
    await tx.orm.public.SiteContent.where((c) => c.key.in(keys)).deleteAll();
    for (const c of clean) {
      if (c.value !== null) await tx.orm.public.SiteContent.create({ key: c.key, value: c.value, arkId: c.arkId });
    }
  });

  // Drop uploads that nothing points at any more.
  const kept = new Set(clean.map((c) => c.arkId));
  await deleteImages(previous.map((p) => p.arkId).filter((id) => id && !kept.has(id)));
}
