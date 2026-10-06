"use client";

import {
  IconArrowLeft,
  IconHome,
  IconLayoutDashboard,
  IconLogout,
  IconMapPin,
  IconReceipt,
  IconSettings,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const links = [
  { href: "/account", label: "Overview", icon: IconHome, exact: true },
  { href: "/account/orders", label: "Orders", icon: IconReceipt },
  { href: "/account/addresses", label: "Addresses", icon: IconMapPin },
  { href: "/account/settings", label: "Settings", icon: IconSettings },
];

export function AccountSidebar({
  user,
  activeOrders,
}: {
  user: { name: string | null; email: string; avatarUrl: string | null; isAdmin: boolean };
  activeOrders: number;
}) {
  const pathname = usePathname();
  const initials = (user.name ?? user.email).split(/[\s@]/).map((s) => s[0]?.toUpperCase()).slice(0, 2).join("");

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="gap-6 px-4 pt-5">
        <Link href="/" className="text-2xl text-neutral-950">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="bg-neutral-950 text-sm text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name ?? "Your account"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((l) => {
                const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
                return (
                  <SidebarMenuItem key={l.href}>
                    <SidebarMenuButton size="lg" isActive={active} render={<Link href={l.href} />}>
                      <l.icon />
                      <span>{l.label}</span>
                    </SidebarMenuButton>
                    {l.href === "/account/orders" && activeOrders > 0 && (
                      <SidebarMenuBadge aria-label={`${activeOrders} orders in progress`} className="text-brand">
                        {activeOrders}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                      <IconLayoutDashboard />
                      <span>Store dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/shop" />}>
              <IconArrowLeft />
              <span>Back to shop</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logout()}>
              <IconLogout />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
