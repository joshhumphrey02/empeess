import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/prisma/db";
import {
  arkConfigured,
  arkErrorMessage,
  deleteImages,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadImage,
} from "@/server/admin/ark";
import { assertAdmin } from "@/server/admin/guard";

// Images go browser → this handler → Ark, so the Ark token never reaches the
// browser. Ark returns permanent CDN URLs that the product/category form saves.

async function authorized() {
  try {
    await assertAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (!arkConfigured()) {
    return NextResponse.json(
      { error: "Image uploads need ARK_TOKEN in .env (Ark dashboard → Apps)." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, AVIF or GIF image." }, { status: 415 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
  }

  try {
    return NextResponse.json(await uploadImage(file));
  } catch (error) {
    console.error("Ark upload failed", error);
    return NextResponse.json({ error: arkErrorMessage(error) }, { status: 502 });
  }
}

/** Discard an upload that was removed from a form before it was saved. */
export async function DELETE(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Never delete an asset something still points at.
  const [image, category] = await Promise.all([
    db.orm.public.ProductImage.where({ arkAssetId: id }).select("id").first(),
    db.orm.public.Category.where({ imageArkId: id }).select("id").first(),
  ]);
  if (image || category) return NextResponse.json({ deleted: false, reason: "in use" });

  await deleteImages([id]);
  return NextResponse.json({ deleted: true });
}
