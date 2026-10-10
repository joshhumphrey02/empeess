import "server-only";

import { cleanPermissions, type Permission } from "@/lib/permissions";
import { db } from "@/prisma/db";
import { sendStaffInvite } from "@/server/auth/tokens";

import { AdminInputError } from "./catalog-admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Admins and staff, admins first, then by name. */
export async function listTeam() {
  const rows = await db.orm.public.User.where((u) => u.role.in(["ADMIN", "STAFF"]))
    .select("id", "email", "name", "avatarUrl", "role", "permissions", "bannedAt", "passwordHash", "createdAt")
    .include("accounts", (a) => a.select("provider"))
    .orderBy([(u) => u.role.asc(), (u) => u.name.asc(), (u) => u.email.asc()])
    .all();
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    role: u.role as "ADMIN" | "STAFF",
    permissions: cleanPermissions(u.permissions),
    banned: u.bannedAt !== null,
    // Created by an invite and hasn't set a password or linked Google yet.
    pending: u.passwordHash === null && u.accounts.length === 0,
    createdAt: u.createdAt,
  }));
}
export type TeamMember = Awaited<ReturnType<typeof listTeam>>[number];

/** The staff row an action targets. Admins are never managed from here. */
async function staffOrThrow(id: string, actingUserId: string) {
  if (id === actingUserId) throw new AdminInputError("You can't change your own access.");
  const user = await db.orm.public.User.where({ id }).select("id", "email", "name", "role").first();
  if (!user || user.role !== "STAFF") throw new AdminInputError("That person isn't a staff member.");
  return user;
}

/**
 * Makes the person with this email a staff member. An existing customer is
 * promoted; otherwise an account is created and invited to set a password.
 */
export async function addStaff(input: { email: string; name?: string; permissions: string[] }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim().slice(0, 80) || null;
  const permissions = cleanPermissions(input.permissions);
  if (!EMAIL_RE.test(email)) throw new AdminInputError("Enter a valid email address.");
  if (permissions.length === 0) throw new AdminInputError("Choose at least one privilege.");

  const existing = await db.orm.public.User.where({ email }).select("id", "role", "name", "bannedAt").first();
  if (existing) {
    if (existing.role === "ADMIN") throw new AdminInputError("That person is already an admin.");
    if (existing.role === "STAFF") throw new AdminInputError("That person is already on the team. Edit their privileges instead.");
    if (existing.bannedAt) throw new AdminInputError("That account is banned.");
    await db.orm.public.User.where({ id: existing.id }).update({ role: "STAFF", permissions, name: existing.name ?? name });
    return { invited: false, emailed: false };
  }

  const user = await db.orm.public.User.create({ email, name, role: "STAFF", permissions });
  // Best effort: the account exists either way, and "Forgot password" works.
  const emailed = await sendStaffInvite(user).catch((e) => {
    console.error("[team] invite email failed", e);
    return false;
  });
  return { invited: true, emailed };
}

export async function setStaffPermissions(id: string, input: string[], actingUserId: string) {
  await staffOrThrow(id, actingUserId);
  const permissions: Permission[] = cleanPermissions(input);
  if (permissions.length === 0) throw new AdminInputError("Choose at least one privilege, or remove them from the team.");
  await db.orm.public.User.where({ id }).update({ permissions });
}

/** Back to a normal customer account. Also lifts a ban, so the account isn't left locked with no way to unlock it. */
export async function removeStaff(id: string, actingUserId: string) {
  await staffOrThrow(id, actingUserId);
  await db.orm.public.User.where({ id }).update({ role: "CUSTOMER", permissions: [], bannedAt: null });
}

/** Banning signs the person out everywhere and blocks sign-in until lifted. */
export async function setStaffBanned(id: string, banned: boolean, actingUserId: string) {
  await staffOrThrow(id, actingUserId);
  await db.orm.public.User.where({ id }).update({ bannedAt: banned ? new Date().toISOString() : null });
  if (banned) await db.orm.public.Session.where({ userId: id }).deleteAll();
}
