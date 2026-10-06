"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex w-max gap-2 lg:w-auto lg:flex-col lg:gap-1">
        {links.map((l) => {
          const active = l.href === "/account" ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center rounded-full px-4 text-sm transition-colors",
                  active ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        {isAdmin && (
          <li>
            <Link
              href="/admin"
              className="flex h-10 items-center rounded-full px-4 text-sm font-medium text-brand hover:bg-neutral-100"
            >
              Dashboard →
            </Link>
          </li>
        )}
        <li>
          <form action={logout}>
            <button type="submit" className="flex h-10 items-center rounded-full px-4 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950">
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
