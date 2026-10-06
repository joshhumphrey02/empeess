import { AccountNav } from "@/components/store/account-nav";
import { requireUser } from "@/server/auth/session";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">[Account]</p>
      <p className="mt-2 text-[clamp(2.25rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.045em]">
        Hi, {user.name?.split(" ")[0] ?? "there"}
      </p>
      <p className="mt-2 text-sm text-neutral-500">{user.email}</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <AccountNav isAdmin={user.role === "ADMIN"} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
