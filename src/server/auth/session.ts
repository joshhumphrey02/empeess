import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/prisma/db";

export const SESSION_COOKIE = "empeess_session";
const SESSION_DAYS = 30;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ADMIN";
  avatarUrl: string | null;
  hasPassword: boolean;
};

/**
 * Creates a session row and sets the cookie. The cookie carries a random
 * token; only its SHA-256 hash is stored, so a database leak can't be
 * replayed as a login. Call from a Server Action or Route Handler only.
 */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const h = await headers();

  await db.orm.public.Session.create({
    userId,
    tokenHash: sha256(token),
    expiresAt: expires.toISOString(),
    userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Deletes the current session row and cookie. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.orm.public.Session.where({ tokenHash: sha256(token) }).delete();
  }
  store.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.orm.public.Session.where({ tokenHash: sha256(token) })
    .include("user")
    .first();
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    avatarUrl: u.avatarUrl,
    hasPassword: u.passwordHash !== null,
  };
});

/** For pages and actions that need a signed-in user. */
export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Only allow same-site relative redirects (blocks `//evil.com`, `https://…`). */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/account") {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}
