import "server-only";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";

/**
 * Every admin page and admin Server Action calls this first. Signed-out
 * visitors go to sign-in; signed-in non-admins get a 404 so the dashboard's
 * existence isn't advertised.
 */
export async function requireAdmin(next = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.role !== "ADMIN") notFound();
  return user;
}

/** For admin Server Actions: same check, but throws instead of redirecting. */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");
  return user;
}
