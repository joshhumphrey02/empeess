import type { Metadata } from "next";

import { logout } from "@/app/actions/auth";
import { SubmitButton } from "@/components/store/form-bits";
import { PasswordForm, ProfileForm } from "@/components/store/settings-forms";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Settings — EMPEESS" };

export default async function SettingsPage() {
  const user = await requireUser("/account/settings");
  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-6 text-2xl font-medium tracking-tight">Profile</h1>
        <ProfileForm name={user.name ?? ""} email={user.email} />
      </section>
      <section className="border-t border-neutral-200 pt-10">
        <h2 className="mb-6 text-2xl font-medium tracking-tight">Password</h2>
        <PasswordForm hasPassword={user.hasPassword} />
      </section>
      <section className="border-t border-neutral-200 pt-10">
        <h2 className="mb-4 text-2xl font-medium tracking-tight">Sign out</h2>
        <form action={logout}>
          <SubmitButton variant="outline">Sign out of this device</SubmitButton>
        </form>
      </section>
    </div>
  );
}
