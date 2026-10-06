import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/store/auth-forms";
import { AuthShell } from "@/components/store/auth-shell";
import { tokenIsLive } from "@/server/auth/tokens";

export const metadata: Metadata = { title: "Choose a new password — EMPEESS", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const raw = (await searchParams).token;
  const token = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const live = await tokenIsLive(token, "PASSWORD_RESET");

  return (
    <AuthShell
      title={live ? "Choose a new password" : "This link has expired"}
      subtitle={live ? "You'll be signed in on this device and signed out everywhere else." : "Reset links work once and expire after an hour."}
    >
      {live ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Link
          href="/forgot-password"
          className="inline-flex h-12 items-center rounded-full bg-neutral-950 px-6 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
        >
          Send a new link
        </Link>
      )}
    </AuthShell>
  );
}
