"use server";

import { refresh } from "next/cache";

import { MAX_QTY_PER_LINE } from "@/lib/store-config";
import { addItem, CartError, setItemQuantity } from "@/server/cart";

import type { FormState } from "./form-state";

export async function addToCart(_prev: FormState, form: FormData): Promise<FormState> {
  const variantId = String(form.get("variantId") ?? "");
  const quantity = Math.trunc(Number(form.get("quantity") ?? 1));
  if (!variantId) return { error: "Choose an option first." };
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
    return { error: `Choose a quantity between 1 and ${MAX_QTY_PER_LINE}.` };
  }

  try {
    const { capped, quantity: inCart } = await addItem(variantId, quantity);
    refresh();
    return {
      ok: true,
      message: capped ? `Added — limited to ${inCart} by available stock.` : "Added to cart.",
      fields: { quantity: String(capped ? inCart : quantity) },
    };
  } catch (error) {
    if (error instanceof CartError) return { error: error.message };
    throw error;
  }
}

export async function updateCartLine(form: FormData) {
  const itemId = String(form.get("itemId") ?? "");
  const quantity = Math.trunc(Number(form.get("quantity")));
  if (!itemId || !Number.isFinite(quantity)) return;
  try {
    await setItemQuantity(itemId, Math.max(0, Math.min(quantity, MAX_QTY_PER_LINE)));
  } catch (error) {
    // An unavailable variant just stays flagged in the cart; anything else is a bug.
    if (!(error instanceof CartError)) throw error;
  }
  refresh();
}

export async function removeCartLine(form: FormData) {
  const itemId = String(form.get("itemId") ?? "");
  if (itemId) await setItemQuantity(itemId, 0);
  refresh();
}
