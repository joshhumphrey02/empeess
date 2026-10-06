import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/prisma/db";
import { consumeToken } from "@/server/auth/tokens";

// Link from the "Confirm your email" message.
export async function GET(request: NextRequest) {
  const email = await consumeToken(request.nextUrl.searchParams.get("token") ?? "", "EMAIL_VERIFICATION");
  if (email) {
    await db.orm.public.User.where({ email })
      .where((u) => u.emailVerifiedAt.isNull())
      .update({ emailVerifiedAt: new Date().toISOString() });
  }
  return NextResponse.redirect(new URL(`/account?verified=${email ? "1" : "expired"}`, request.url));
}
