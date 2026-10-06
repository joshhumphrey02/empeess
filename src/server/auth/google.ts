import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "@/prisma/db";

// Google OAuth 2.0 authorization-code flow with PKCE.
// https://developers.google.com/identity/protocols/oauth2/web-server

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_STATE_COOKIE = "empeess_google_state";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL("/api/auth/callback/google", base).toString();
}

/** Builds the consent URL plus the values to stash in a short-lived cookie. */
export function createGoogleAuthRequest() {
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return { url, state, verifier };
}

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(code: string, verifier: string) {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed (${tokenRes.status})`);
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };

  const profileRes = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error(`Google userinfo failed (${profileRes.status})`);
  const profile = (await profileRes.json()) as GoogleProfile;
  return { tokens, profile };
}

/**
 * Finds or creates the local user for a Google profile:
 * 1. an existing Google account link wins;
 * 2. otherwise link to a user with the same (Google-verified) email;
 * 3. otherwise create a new user.
 */
export async function upsertGoogleUser({ tokens, profile }: Awaited<ReturnType<typeof exchangeGoogleCode>>) {
  if (!profile.email || !profile.email_verified) {
    throw new Error("Your Google account's email isn't verified.");
  }
  const email = profile.email.toLowerCase();
  const tokenFields = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    idToken: tokens.id_token ?? null,
    scope: tokens.scope ?? null,
    expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
  };

  return db.transaction(async (tx) => {
    const linked = await tx.orm.public.Account.where({ provider: "google", providerAccountId: profile.sub }).first();
    if (linked) {
      await tx.orm.public.Account.where({ id: linked.id }).update(tokenFields);
      return linked.userId;
    }

    const existing = await tx.orm.public.User.where({ email }).first();
    const user =
      existing ??
      (await tx.orm.public.User.create({
        email,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        emailVerifiedAt: new Date().toISOString(),
      }));

    if (existing && (!existing.emailVerifiedAt || (!existing.avatarUrl && profile.picture))) {
      await tx.orm.public.User.where({ id: existing.id }).update({
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date().toISOString(),
        avatarUrl: existing.avatarUrl ?? profile.picture ?? null,
      });
    }

    await tx.orm.public.Account.create({
      userId: user.id,
      provider: "google",
      providerAccountId: profile.sub,
      ...tokenFields,
    });
    return user.id;
  });
}
