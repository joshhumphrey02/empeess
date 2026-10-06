"use client";

import { IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { logout } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const LABELS: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  orders: "Orders",
  customers: "Customers",
  reviews: "Reviews",
  new: "New",
};

export function AdminHeader({ user }: { user: { name: string | null; email: string; avatarUrl: string | null } }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => ({
    href: "/" + parts.slice(0, i + 1).join("/"),
    label: LABELS[part] ?? (part.length > 18 ? "Details" : part),
  }));
  const initials = (user.name ?? user.email).split(/[\s@]/).map((s) => s[0]?.toUpperCase()).slice(0, 2).join("");

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <Fragment key={c.href}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden sm:inline-flex" : undefined}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={c.href} />}>{c.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Account menu">
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <span className="block truncate font-medium text-foreground">{user.name ?? "Admin"}</span>
              <span className="block truncate text-xs font-normal">{user.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/account" />}>
            <IconUser /> My account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()}>
            <IconLogout /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
