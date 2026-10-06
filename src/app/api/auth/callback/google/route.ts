import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { exchangeGoogleCode, GOOGLE_STATE_COOKIE, upsertGoogleUser } from "@/server/auth/google";
import { createSession, safeNext } from "@/server/auth/session";
import { mergeGuestCart } from "@/server/cart";

export async function GET(request: NextRequest) {
  const store = await cookies();
  const raw = store.get(GOOGLE_STATE_COOKIE)?.value;
  store.delete(GOOGLE_STATE_COOKIE);

  const fail = (error: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  };

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fail("google_cancelled");

  let stash: { state: string; verifier: string; next: string };
  try {
    stash = JSON.parse(raw ?? "");
  } catch {
    return fail("google_failed");
  }
  const code = params.get("code");
  if (!code || params.get("state") !== stash.state) return fail("google_failed");

  try {
    const userId = await upsertGoogleUser(await exchangeGoogleCode(code, stash.verifier));
    await createSession(userId);
    await mergeGuestCart(userId);
  } catch (error) {
    console.error("Google sign-in failed", error);
    return fail("google_failed");
  }
  return NextResponse.redirect(new URL(safeNext(stash.next), request.url));
}
