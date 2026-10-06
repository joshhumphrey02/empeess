import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeProvider, AdminToaster } from "@/components/admin/admin-theme";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { db } from "@/prisma/db";
import { requireAdmin } from "@/server/admin/guard";
import { expireStaleOrders } from "@/server/payments";

export const metadata: Metadata = {
  title: { default: "Dashboard — EMPEESS", template: "%s — EMPEESS Dashboard" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin("/admin");
  // Release stock held by orders that were never paid (no cron needed).
  await expireStaleOrders().catch((e) => console.error("[admin] expiring unpaid orders failed", e));
  const [store, toFulfil, lowStock] = await Promise.all([
    cookies(),
    db.orm.public.Order.where({ status: "PAID" }).aggregate((a) => ({ count: a.count() })),
    db.orm.public.ProductVariant.where((v) => v.isActive.eq(true))
      .where((v) => v.stock.lte(5))
      .aggregate((a) => ({ count: a.count() })),
  ]);
  const defaultOpen = store.get("sidebar_state")?.value !== "false";

  return (
    <AdminThemeProvider>
      <TooltipProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AdminSidebar counts={{ toFulfil: toFulfil.count, lowStock: lowStock.count }} />
          <SidebarInset className="min-w-0">
            <AdminHeader user={user} />
            <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <AdminToaster />
      </TooltipProvider>
    </AdminThemeProvider>
  );
}
