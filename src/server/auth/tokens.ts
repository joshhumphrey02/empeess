import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "@/prisma/db";

import { absoluteUrl, layout, sendEmail } from "../mail";

// One-time email links (password reset, email verification). The link carries
// a random token; only its hash is stored, and each token works once.

type Purpose = "PASSWORD_RESET" | "EMAIL_VERIFICATION";
const TTL_MINUTES: Record<Purpose, number> = { PASSWORD_RESET: 60, EMAIL_VERIFICATION: 24 * 60 };
const MAX_PER_HOUR = 3;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export class TokenRateLimited extends Error {}

async function issue(email: string, purpose: Purpose) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db.orm.public.VerificationToken.where({ email, purpose })
    .where((t) => t.createdAt.gte(hourAgo))
    .aggregate((a) => ({ count: a.count() }));
  if (count >= MAX_PER_HOUR) throw new TokenRateLimited("Too many requests. Please wait a while and try again.");

  const token = randomBytes(32).toString("base64url");
  await db.orm.public.VerificationToken.create({
    email,
    purpose,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TTL_MINUTES[purpose] * 60 * 1000).toISOString(),
  });
  return token;
}

/** Marks the token used and returns its email, or null if unknown, used or expired. */
export async function consumeToken(token: string, purpose: Purpose) {
  if (!token) return null;
  const row = await db.orm.public.VerificationToken.where({ tokenHash: sha256(token), purpose }).first();
  if (!row || row.consumedAt || new Date(row.expiresAt).getTime() < Date.now()) return null;
  // Compare-and-set: two clicks on the same link can't both succeed.
  const used = await db.orm.public.VerificationToken.where({ id: row.id })
    .where((t) => t.consumedAt.isNull())
    .update({ consumedAt: new Date().toISOString() });
  return used ? row.email : null;
}

/** Peek without consuming (to show the reset form only for a live link). */
export async function tokenIsLive(token: string, purpose: Purpose) {
  if (!token) return false;
  const row = await db.orm.public.VerificationToken.where({ tokenHash: sha256(token), purpose }).first();
  return Boolean(row && !row.consumedAt && new Date(row.expiresAt).getTime() > Date.now());
}

export async function sendPasswordReset(user: { email: string; name: string | null }) {
  const token = await issue(user.email, "PASSWORD_RESET");
  const url = absoluteUrl(`/reset-password?token=${token}`);
  const { html, text } = layout({
    heading: "Reset your password",
    paragraphs: [
      `Hi${user.name ? ` ${user.name.split(" ")[0]}` : ""}, we got a request to reset the password for your EMPEESS account.`,
      "The link below works once and expires in 1 hour.",
    ],
    button: { label: "Choose a new password", url },
    footnote: "If you didn't ask for this, you can ignore this email. Your password won't change.",
  });
  await sendEmail({ to: user.email, subject: "Reset your EMPEESS password", html, text });
}

export async function sendEmailVerification(user: { email: string; name: string | null }) {
  const token = await issue(user.email, "EMAIL_VERIFICATION");
  const url = absoluteUrl(`/api/auth/verify-email?token=${token}`);
  const { html, text } = layout({
    heading: "Confirm your email",
    paragraphs: [
      `Welcome to EMPEESS${user.name ? `, ${user.name.split(" ")[0]}` : ""}! Confirm this is your email so we can send your receipts and delivery updates.`,
    ],
    button: { label: "Confirm my email", url },
    footnote: "This link expires in 24 hours. If you didn't create an account, ignore this email.",
  });
  await sendEmail({ to: user.email, subject: "Confirm your EMPEESS email", html, text });
}

/**
 * Invite for a staff account an admin just created: a password-reset link, so
 * the new person chooses their own password. Returns false if it wasn't sent.
 */
export async function sendStaffInvite(user: { email: string; name: string | null }) {
  const token = await issue(user.email, "PASSWORD_RESET");
  const url = absoluteUrl(`/reset-password?token=${token}`);
  const { html, text } = layout({
    heading: "You've been added to the EMPEESS team",
    paragraphs: [
      `Hi${user.name ? ` ${user.name.split(" ")[0]}` : ""}, an admin gave you access to the EMPEESS dashboard.`,
      "Choose a password to finish setting up your account. The link works once and expires in 1 hour.",
    ],
    button: { label: "Set my password", url },
    footnote: "Link expired? Use “Forgot password” on the sign-in page with this email address.",
  });
  return sendEmail({ to: user.email, subject: "Your EMPEESS dashboard access", html, text });
}
