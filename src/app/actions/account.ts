"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getCurrentUser, requireUser } from "@/server/auth/session";
import { cancelOrder, CheckoutError, placeOrder } from "@/server/orders";

import type { FormState } from "./form-state";

const text = (form: FormData, key: string, max = 120) => String(form.get(key) ?? "").trim().slice(0, max);

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account/settings");
  const name = text(form, "name", 80);
  if (!name) return { error: "Name can't be empty." };
  await db.orm.public.User.where({ id: user.id }).update({ name });
  refresh();
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account/settings");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  if (next.length < 8) return { error: "Use at least 8 characters for your new password." };
  if (next.length > 200) return { error: "That password is too long." };

  const row = await db.orm.public.User.where({ id: user.id }).select("passwordHash").first();
  if (row?.passwordHash && !(await verifyPassword(current, row.passwordHash))) {
    return { error: "Your current password is incorrect." };
  }
  await db.orm.public.User.where({ id: user.id }).update({ passwordHash: await hashPassword(next) });
  // Sign out other devices; keep only the newest session (this one).
  const sessions = await db.orm.public.Session.where({ userId: user.id })
    .select("id")
    .orderBy((s) => s.createdAt.desc())
    .all();
  for (const s of sessions.slice(1)) await db.orm.public.Session.where({ id: s.id }).delete();
  refresh();
  return { ok: true, message: row?.passwordHash ? "Password changed." : "Password set. You can now sign in with email too." };
}

export async function addAddress(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  const fields = {
    fullName: text(form, "fullName", 80),
    phone: text(form, "phone", 30),
    line1: text(form, "line1"),
    line2: text(form, "line2"),
    city: text(form, "city", 60),
    state: text(form, "state", 60),
    postalCode: text(form, "postalCode", 20),
  };
  const missing = (["fullName", "phone", "line1", "city", "state"] as const).filter((k) => !fields[k]);
  if (missing.length) return { error: "Fill in name, phone, address, city and state.", fields };
  if (!/^[+\d][\d\s-]{6,}$/.test(fields.phone)) return { error: "Enter a valid phone number.", fields };

  const { count } = await db.orm.public.Address.where({ userId: user.id }).aggregate((a) => ({ count: a.count() }));
  const makeDefault = count === 0 || form.get("isDefault") === "on";

  await db.transaction(async (tx) => {
    if (makeDefault) {
      await tx.orm.public.Address.where({ userId: user.id, isDefault: true }).updateAll({ isDefault: false });
    }
    await tx.orm.public.Address.create({
      userId: user.id,
      ...fields,
      line2: fields.line2 || null,
      postalCode: fields.postalCode || null,
      country: "NG",
      isDefault: makeDefault,
    });
  });
  refresh();
  return { ok: true, message: "Address saved." };
}

export async function deleteAddress(form: FormData) {
  const user = await requireUser("/account/addresses");
  const id = String(form.get("addressId") ?? "");
  const deleted = await db.orm.public.Address.where({ id, userId: user.id }).delete();
  if (deleted?.isDefault) {
    const next = await db.orm.public.Address.where({ userId: user.id }).orderBy((a) => a.createdAt.desc()).first();
    if (next) await db.orm.public.Address.where({ id: next.id }).update({ isDefault: true });
  }
  refresh();
}

export async function setDefaultAddress(form: FormData) {
  const user = await requireUser("/account/addresses");
  const id = String(form.get("addressId") ?? "");
  const address = await db.orm.public.Address.where({ id, userId: user.id }).first();
  if (!address) return;
  await db.transaction(async (tx) => {
    await tx.orm.public.Address.where({ userId: user.id, isDefault: true }).updateAll({ isDefault: false });
    await tx.orm.public.Address.where({ id }).update({ isDefault: true });
  });
  refresh();
}

export async function checkout(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/checkout");
  const addressId = String(form.get("addressId") ?? "");
  let orderNumber: string;
  try {
    const order = await placeOrder({ userId: user.id, addressId, note: text(form, "note", 500) });
    orderNumber = order.orderNumber;
  } catch (error) {
    if (error instanceof CheckoutError) return { error: error.message };
    throw error;
  }
  // The store layout (header cart badge) must re-render after the redirect.
  revalidatePath("/", "layout");
  redirect(`/account/orders/${orderNumber}?placed=1`);
}

export async function cancelMyOrder(form: FormData) {
  const user = await requireUser("/account/orders");
  const orderNumber = String(form.get("orderNumber") ?? "");
  try {
    await cancelOrder(user.id, orderNumber);
  } catch (error) {
    if (!(error instanceof CheckoutError)) throw error;
  }
  refresh();
}

export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to leave a review." };
  const productId = String(form.get("productId") ?? "");
  const rating = Math.trunc(Number(form.get("rating")));
  const comment = text(form, "comment", 1000) || null;
  if (!(rating >= 1 && rating <= 5)) return { error: "Choose a rating from 1 to 5 stars." };

  const product = await db.orm.public.Product.where({ id: productId, status: "ACTIVE" }).select("id").first();
  if (!product) return { error: "Product not found." };

  const existing = await db.orm.public.Review.where({ productId, userId: user.id }).select("id").first();
  if (existing) await db.orm.public.Review.where({ id: existing.id }).update({ rating, comment });
  else await db.orm.public.Review.create({ productId, userId: user.id, rating, comment });
  refresh();
  return { ok: true, message: existing ? "Review updated." : "Thanks for your review!" };
}
