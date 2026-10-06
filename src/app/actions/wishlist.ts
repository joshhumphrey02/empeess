"use server";

import { refresh } from "next/cache";

import { getCurrentUser } from "@/server/auth/session";
import { setWishlisted } from "@/server/wishlist";

export async function toggleWishlist(productId: string, saved: boolean): Promise<{ ok: true; saved: boolean } | { ok: false; signIn?: boolean; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, signIn: true, error: "Sign in to save items to your wishlist." };
  try {
    const now = await setWishlisted(user.id, productId, saved);
    refresh();
    return { ok: true, saved: now };
  } catch {
    return { ok: false, error: "That product is no longer available." };
  }
}
