// What the client may edit from the dashboard, and how their edits are laid
// over the defaults in content.ts. Shared by the server (read/save) and the
// admin editor, so it must stay free of server-only imports.

import {
  categories,
  collections,
  footer,
  hero,
  lookbook,
  moments,
  testimonials,
} from "@/components/landing/content";

export const siteDefaults = { hero, moments, categories, testimonials, lookbook, collections, footer };
export type SiteContentData = typeof siteDefaults;

export type ContentField = {
  /** Dot path into `siteDefaults`, e.g. "moments.primary.src". Also the storage key. */
  path: string;
  label: string;
  type: "text" | "textarea" | "image";
  /** Character limit for text. */
  max?: number;
  /** For images: the path of the matching description (alt text), edited alongside. */
  altPath?: string;
};
export type ContentSection = { id: string; title: string; description: string; fields: ContentField[] };

const text = (path: string, label: string, max: number): ContentField => ({ path, label, type: "text", max });
const area = (path: string, label: string, max: number): ContentField => ({ path, label, type: "textarea", max });
const image = (path: string, label: string, altPath?: string): ContentField => ({ path, label, type: "image", altPath });

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    id: "hero",
    title: "Hero",
    description: "The first screen of the home page.",
    fields: [
      image("hero.src", "Main photo", "hero.imageAlt"),
      area("hero.blurb", "Intro text (desktop)", 220),
      text("hero.blurbShort", "Intro text (phones)", 90),
    ],
  },
  {
    id: "moments",
    title: "Moments",
    description: "The two large photos under the hero.",
    fields: [
      text("moments.title.0", "Heading, line 1", 30),
      text("moments.title.1", "Heading, line 2", 30),
      text("moments.copy", "Short text", 120),
      text("moments.price", "Price label", 20),
      image("moments.thumb.src", "Small photo", "moments.thumb.alt"),
      image("moments.primary.src", "First large photo", "moments.primary.alt"),
      text("moments.primary.caption", "First photo caption", 60),
      image("moments.secondary.src", "Second large photo", "moments.secondary.alt"),
      text("moments.secondary.caption", "Second photo caption", 60),
      text("moments.secondary.badge", "Second photo badge", 12),
    ],
  },
  {
    id: "categories",
    title: "Categories",
    description: "The section that steps through each category as you scroll.",
    fields: [
      area("categories.copy", "Intro text", 220),
      ...categories.items.map((item, i) => image(`categories.items.${i}.src`, `${item.name} photo`, `categories.items.${i}.alt`)),
    ],
  },
  {
    id: "testimonials",
    title: "Testimonials",
    description: "Customer quotes.",
    fields: testimonials.flatMap((_, i) => [
      image(`testimonials.${i}.src`, `Quote ${i + 1}: photo`),
      text(`testimonials.${i}.name`, `Quote ${i + 1}: name`, 40),
      text(`testimonials.${i}.role`, `Quote ${i + 1}: role`, 40),
      area(`testimonials.${i}.quote`, `Quote ${i + 1}: text`, 320),
    ]),
  },
  {
    id: "lookbook",
    title: "Lookbook",
    description: "The sliding gallery.",
    fields: [
      text("lookbook.title.0", "Heading, line 1", 30),
      text("lookbook.title.1", "Heading, line 2", 30),
      ...lookbook.slides.flatMap((_, i) => [
        image(`lookbook.slides.${i}.src`, `Slide ${i + 1}: photo`, `lookbook.slides.${i}.alt`),
        text(`lookbook.slides.${i}.label`, `Slide ${i + 1}: label`, 30),
      ]),
    ],
  },
  {
    id: "collections",
    title: "Collections",
    description: "The list of collections near the bottom of the home page.",
    fields: [
      area("collections.intro", "Intro text", 220),
      text("collections.outro", "Closing line", 60),
      ...collections.items.flatMap((_, i) => [
        text(`collections.items.${i}.title`, `Collection ${i + 1}: title`, 40),
        area(`collections.items.${i}.copy`, `Collection ${i + 1}: text`, 160),
        image(`collections.items.${i}.src`, `Collection ${i + 1}: large photo`),
        image(`collections.items.${i}.thumb`, `Collection ${i + 1}: small photo`),
      ]),
    ],
  },
  {
    id: "footer",
    title: "Footer and contact details",
    description: "Shown at the bottom of every page and on the contact page.",
    fields: [
      text("footer.headline.0", "Heading, line 1", 40),
      text("footer.headline.1", "Heading, line 2", 40),
      ...footer.contact.map((item, i) => text(`footer.contact.${i}.value`, item.label[0] + item.label.slice(1).toLowerCase(), 80)),
    ],
  },
];

/** Every editable path (including image descriptions) with its rules. */
export const CONTENT_FIELDS: ReadonlyMap<string, { type: ContentField["type"]; max: number }> = new Map(
  CONTENT_SECTIONS.flatMap((s) => s.fields).flatMap((f) => [
    [f.path, { type: f.type, max: f.max ?? 2000 }] as const,
    ...(f.altPath ? [[f.altPath, { type: "text" as const, max: 160 }] as const] : []),
  ]),
);

/** Uploaded images must come from our own CDN (also the only remote host next/image allows). */
export const isUploadedImageUrl = (value: string) => value.startsWith("https://cdn.nerdstackgrp.com/apps/");

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function at(root: Json, path: string): Json | undefined {
  let node: Json | undefined = root;
  for (const key of path.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = Array.isArray(node) ? node[Number(key)] : node[key];
  }
  return node;
}

/** The built-in value for an editable path. */
export function defaultFor(path: string) {
  const value = at(siteDefaults as unknown as Json, path);
  return typeof value === "string" ? value : "";
}

/** The defaults with the client's saved values laid over them. Unknown or stale keys are ignored. */
export function applyOverrides(overrides: Record<string, string>): SiteContentData {
  const data = structuredClone(siteDefaults) as unknown as Json;
  for (const [path, value] of Object.entries(overrides)) {
    if (!CONTENT_FIELDS.has(path)) continue;
    const keys = path.split(".");
    const last = keys.pop()!;
    const parent = at(data, keys.join("."));
    if (parent === null || typeof parent !== "object") continue;
    if (Array.isArray(parent)) parent[Number(last)] = value;
    else parent[last] = value;
  }
  return data as unknown as SiteContentData;
}
