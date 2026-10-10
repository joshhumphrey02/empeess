"use client";

import {
  IconBox,
  IconCategory,
  IconExternalLink,
  IconLayoutDashboard,
  IconMailCheck,
  IconMessage,
  IconPackages,
  IconReceipt,
  IconStar,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Permission } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: typeof IconBox;
  exact?: boolean;
  badge?: "toFulfil" | "lowStock" | "unread";
  /** The privilege needed to see this item; "admin" is admins only. */
  needs: Permission | "admin";
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Store",
    items: [
      { href: "/admin", label: "Overview", icon: IconLayoutDashboard, exact: true, needs: "overview" },
      { href: "/admin/orders", label: "Orders", icon: IconReceipt, badge: "toFulfil", needs: "orders" },
      { href: "/admin/customers", label: "Customers", icon: IconUsers, needs: "customers" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: IconBox, needs: "catalog" },
      { href: "/admin/categories", label: "Categories", icon: IconCategory, needs: "catalog" },
      { href: "/admin/inventory", label: "Inventory", icon: IconPackages, badge: "lowStock", needs: "catalog" },
      { href: "/admin/reviews", label: "Reviews", icon: IconStar, needs: "reviews" },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/admin/messages", label: "Messages", icon: IconMessage, badge: "unread", needs: "messages" },
      { href: "/admin/subscribers", label: "Subscribers", icon: IconMailCheck, needs: "subscribers" },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/team", label: "Team", icon: IconUsersGroup, needs: "admin" }],
  },
];

export function AdminSidebar({
  counts,
  access,
  isAdmin,
}: {
  counts: { toFulfil: number; lowStock: number; unread: number };
  /** Privileges this person holds; items they can't open are left out. */
  access: Permission[];
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (item.needs === "admin" ? isAdmin : access.includes(item.needs))),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
              <BrandMark className="size-8" />
              <span className="flex flex-col leading-tight">
                <span className="font-logo text-base font-semibold uppercase tracking-tight">Empeess</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {visible.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  const count = item.badge ? counts[item.badge] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                        className="relative isolate data-active:bg-transparent data-active:text-sidebar-accent-foreground"
                      >
                        {active && (
                          // One indicator that glides between items as you navigate.
                          <motion.span
                            layoutId="admin-nav-active"
                            className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent shadow-[inset_2px_0_0_var(--brand)]"
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          />
                        )}
                        <item.icon className={active ? "text-brand" : undefined} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge
                          className={item.badge === "lowStock" ? "text-amber-700 dark:text-amber-400" : "text-brand"}
                          aria-label={`${count} ${item.badge === "toFulfil" ? "paid orders to fulfil" : item.badge === "unread" ? "unread messages" : "low-stock variants"}`}
                        >
                          {count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="View store" render={<Link href="/" target="_blank" />}>
              <IconExternalLink />
              <span>View store</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
