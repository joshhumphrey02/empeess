import "server-only";

import { notFound, redirect } from "next/navigation";

import { can, isTeamMember, PERMISSION_HOME, type Permission } from "@/lib/permissions";
import { getCurrentUser, type SessionUser } from "@/server/auth/session";

/**
 * What a dashboard page or action needs: one privilege, "team" for anyone on
 * the team (admin or staff), or "admin" for admins only.
 */
export type AdminAccess = Permission | "team" | "admin";

function allowed(user: SessionUser, access: AdminAccess) {
  if (access === "admin") return user.role === "ADMIN";
  if (access === "team") return isTeamMember(user);
  return can(user, access);
}

/**
 * Every admin page calls this first. Signed-out visitors go to sign-in;
 * signed-in people without the access get a 404 so the dashboard's existence
 * isn't advertised.
 */
export async function requireAccess(access: AdminAccess, next = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!allowed(user, access)) notFound();
  return user;
}

/** Admin-only pages (team management). */
export const requireAdmin = (next = "/admin") => requireAccess("admin", next);

/** For admin Server Actions and route handlers: same check, but throws instead of redirecting. */
export async function assertAccess(access: AdminAccess) {
  const user = await getCurrentUser();
  if (!user || !allowed(user, access)) throw new Error("Not authorized");
  return user;
}

/** The first section this team member may open, for staff without the overview. */
export function homeFor(user: SessionUser) {
  if (user.role === "ADMIN") return "/admin";
  const first = user.permissions[0];
  return first ? PERMISSION_HOME[first] : null;
}
