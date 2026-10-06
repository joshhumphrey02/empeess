import "server-only";

import { Ark, ArkError } from "@nerdstackgrp/ark-server";

// Ark image storage. The SDK appends `/api/<version>` itself, so strip it from
// ARK_BASE_URL (which .env documents as the full API base).

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

let client: Ark | null = null;

export function arkConfigured() {
  return Boolean(process.env.ARK_TOKEN);
}

function ark() {
  if (!process.env.ARK_TOKEN) {
    throw new ArkError({ code: "UNAUTHORIZED", message: "ARK_TOKEN is not set" });
  }
  client ??= new Ark({
    token: process.env.ARK_TOKEN,
    baseUrl: process.env.ARK_BASE_URL?.replace(/\/api\/v\d+\/?$/, "") || undefined,
  });
  return client;
}

export type UploadedImage = {
  arkAssetId: string;
  url: string;
  thumbnailUrl: string | null;
  compressedUrl: string | null;
  mimeType: string;
  size: number;
};

export async function uploadImage(file: File): Promise<UploadedImage> {
  const uploaded = await ark().files.upload(file, {
    filename: file.name,
    contentType: file.type,
  });
  // Ark's URLs are permanent CDN addresses — store them verbatim (Ark docs §6).
  return {
    arkAssetId: uploaded.id,
    url: uploaded.url,
    thumbnailUrl: uploaded.thumbnailUrl,
    compressedUrl: uploaded.compressedUrl,
    mimeType: uploaded.mimeType || file.type,
    size: uploaded.size || file.size,
  };
}

/**
 * Best-effort delete. A failure only leaves an orphaned file in Ark, so it's
 * logged, not thrown. Seeded placeholder images (`seed:` ids) aren't in Ark.
 */
export async function deleteImages(assetIds: (string | null | undefined)[]) {
  const ids = assetIds.filter((id): id is string => Boolean(id) && !id!.startsWith("seed:"));
  if (ids.length === 0 || !arkConfigured()) return;
  await Promise.all(
    ids.map((id) =>
      ark()
        .files.delete(id)
        .catch((error) => console.error(`Ark delete failed for ${id}`, error)),
    ),
  );
}

export function arkErrorMessage(error: unknown) {
  if (error instanceof ArkError) {
    if (error.code === "UNAUTHORIZED") return "Ark rejected the token. Check ARK_TOKEN in .env.";
    return `Ark: ${error.message}`;
  }
  return "Upload failed. Please try again.";
}
