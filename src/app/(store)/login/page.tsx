import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleButton, LoginForm } from "@/components/store/auth-forms";
import { AUTH_ERRORS, AuthShell } from "@/components/store/auth-shell";
import { getCurrentUser, safeNext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in | EMPEESS" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);
  if (await getCurrentUser()) redirect(next);
  const error = AUTH_ERRORS[String(params.error ?? "")];

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to check out faster and track your orders.">
      {error && <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <GoogleButton next={next} />
      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wide text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <LoginForm next={next} />
      <p className="mt-8 text-sm text-neutral-600">
        New here?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-neutral-950 underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
