import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/store/auth-forms";
import { AuthShell } from "@/components/store/auth-shell";

export const metadata: Metadata = { title: "Forgot password — EMPEESS" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter the email you shop with and we'll send you a link to choose a new one.">
      <ForgotPasswordForm />
      <p className="mt-8 text-sm text-neutral-600">
        Remembered it?{" "}
        <Link href="/login" className="text-neutral-950 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
