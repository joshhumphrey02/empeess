"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, safeNext } from "@/server/auth/session";
import { mergeGuestCart } from "@/server/cart";

import type { FormState } from "./form-state";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const name = text(form, "name").slice(0, 80);
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { name, email };

  if (!name) return { error: "Tell us your name.", fields };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", fields };
  if (password.length > 200) return { error: "That password is too long.", fields };

  const existing = await db.orm.public.User.where({ email }).select("id", "passwordHash").first();
  if (existing) {
    return {
      error: existing.passwordHash
        ? "An account with this email already exists. Sign in instead."
        : "This email is linked to Google sign-in. Use “Continue with Google”.",
      fields,
    };
  }

  const user = await db.orm.public.User.create({
    email,
    name,
    passwordHash: await hashPassword(password),
  });
  await createSession(user.id);
  await mergeGuestCart(user.id);
  revalidatePath("/", "layout"); // header: signed-in state + merged cart count
  redirect(safeNext(form.get("next")));
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { email };
  if (!email || !password) return { error: "Enter your email and password.", fields };

  const user = await db.orm.public.User.where({ email }).select("id", "passwordHash").first();
  // Same message whether the email or the password is wrong.
  const ok = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return {
      error: user && !user.passwordHash
        ? "This account uses Google sign-in. Use “Continue with Google”."
        : "Incorrect email or password.",
      fields,
    };
  }

  await createSession(user.id);
  await mergeGuestCart(user.id);
  revalidatePath("/", "layout"); // header: signed-in state + merged cart count
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
