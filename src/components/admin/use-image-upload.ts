"use client";

import { useState } from "react";
import { toast } from "sonner";

export type UploadedImage = {
  arkAssetId: string;
  url: string;
  thumbnailUrl: string | null;
  compressedUrl: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
};

const MAX_BYTES = 10 * 1024 * 1024;

async function dimensions(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return { width: null, height: null };
  }
}

/**
 * Uploads files to /api/admin/uploads (which forwards to Ark) one by one,
 * tracking how many are in flight. Each success is passed to `onUploaded`.
 */
export function useImageUpload(onUploaded: (image: UploadedImage, file: File) => void) {
  const [inFlight, setInFlight] = useState(0);

  async function upload(files: File[]) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        continue;
      }
      setInFlight((n) => n + 1);
      try {
        const [dims, res] = await Promise.all([
          dimensions(file),
          fetch("/api/admin/uploads", { method: "POST", body: toForm(file) }),
        ]);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`);
        onUploaded({ ...body, ...dims }, file);
      } catch (error) {
        toast.error(`${file.name}: ${(error as Error).message}`);
      } finally {
        setInFlight((n) => n - 1);
      }
    }
  }

  return { upload, uploading: inFlight > 0, inFlight };
}

/** Tell the server an unsaved upload was removed so Ark can drop it. */
export function discardUpload(arkAssetId: string) {
  void fetch(`/api/admin/uploads?id=${encodeURIComponent(arkAssetId)}`, { method: "DELETE" }).catch(() => {});
}

function toForm(file: File) {
  const form = new FormData();
  form.append("file", file);
  return form;
}
