import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createGoogleAuthRequest, GOOGLE_STATE_COOKIE, googleConfigured } from "@/server/auth/google";
import { safeNext } from "@/server/auth/session";

// Starts "Continue with Google": stash state + PKCE verifier, then redirect.
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  if (!googleConfigured()) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "google_unavailable");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const { url, state, verifier } = createGoogleAuthRequest();
  (await cookies()).set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(url);
}
