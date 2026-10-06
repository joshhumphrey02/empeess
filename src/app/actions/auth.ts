"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/prisma/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, getCurrentUser, safeNext } from "@/server/auth/session";
import { consumeToken, sendEmailVerification, sendPasswordReset, TokenRateLimited } from "@/server/auth/tokens";
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
  // Best effort: a mail outage must not block sign-up.
  await sendEmailVerification(user).catch((e) => console.error("[auth] verification email failed", e));
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

/** Always answers the same way, so it can't be used to discover accounts. */
export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields: { email } };
  const user = await db.orm.public.User.where({ email }).select("email", "name").first();
  if (user) {
    try {
      await sendPasswordReset(user);
    } catch (error) {
      if (error instanceof TokenRateLimited) return { error: error.message, fields: { email } };
      throw error;
    }
  }
  return { ok: true, message: `If an account exists for ${email}, we've sent a link to reset its password. Check your inbox (and spam).` };
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters for your new password." };
  if (password.length > 200) return { error: "That password is too long." };
  if (password !== String(form.get("confirm") ?? "")) return { error: "The two passwords don't match." };

  const email = await consumeToken(token, "PASSWORD_RESET");
  if (!email) return { error: "This reset link has expired or was already used. Request a new one." };
  const user = await db.orm.public.User.where({ email }).select("id", "emailVerifiedAt").first();
  if (!user) return { error: "This reset link has expired or was already used. Request a new one." };

  await db.orm.public.User.where({ id: user.id }).update({
    passwordHash: await hashPassword(password),
    // Opening the link proves they own the mailbox.
    emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
  });
  // Sign out everywhere (a reset often follows a compromise), then sign in here.
  await db.orm.public.Session.where({ userId: user.id }).deleteAll();
  await createSession(user.id);
  await mergeGuestCart(user.id);
  revalidatePath("/", "layout");
  redirect("/account?reset=1");
}

// Signature matches useActionState; the previous state isn't needed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function resendVerification(_prev: FormState): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (user.emailVerified) return { ok: true, message: "Your email is already confirmed." };
  try {
    await sendEmailVerification(user);
  } catch (error) {
    if (error instanceof TokenRateLimited) return { error: error.message };
    throw error;
  }
  return { ok: true, message: `We've sent a new link to ${user.email}.` };
}
