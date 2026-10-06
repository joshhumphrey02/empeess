import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleButton, RegisterForm } from "@/components/store/auth-forms";
import { AuthShell } from "@/components/store/auth-shell";
import { getCurrentUser, safeNext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create account — EMPEESS" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell title="Create account" subtitle="Save addresses, track orders and check out in seconds.">
      <GoogleButton next={next} />
      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wide text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <RegisterForm next={next} />
      <p className="mt-8 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-neutral-950 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
