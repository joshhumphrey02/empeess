import { IconShoppingBag } from "@tabler/icons-react";
import { cookies } from "next/headers";
import Link from "next/link";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { StoreToaster } from "@/components/store/store-toaster";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { db } from "@/prisma/db";
import { requireUser } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";

// The account area is its own app shell: no storefront header or footer.
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  const [store, cartCount, active] = await Promise.all([
    cookies(),
    getCartCount(),
    db.orm.public.Order.where({ userId: user.id })
      .where((o) => o.status.in(["PENDING", "PAID", "PROCESSING", "SHIPPED"]))
      .aggregate((a) => ({ count: a.count() })),
  ]);
  const firstName = user.name?.split(" ")[0];

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={store.get("sidebar_state")?.value !== "false"} className="bg-canvas">
        <AccountSidebar
          user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl, isAdmin: user.role === "ADMIN" }}
          activeOrders={active.count}
        />
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
            <SidebarTrigger className="md:hidden" />
            <p className="text-lg font-medium tracking-tight">
              Hi{firstName ? `, ${firstName}` : ""} <span aria-hidden>👋</span>
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/shop"
                className="hidden h-10 items-center rounded-full px-4 text-sm text-neutral-700 hover:bg-neutral-100 sm:inline-flex"
              >
                Shop
              </Link>
              <Link
                href="/cart"
                aria-label={cartCount ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Cart"}
                className="relative grid size-10 place-items-center rounded-full bg-neutral-950 text-white transition-transform hover:scale-105"
              >
                <IconShoppingBag className="size-5" stroke={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-5 text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </header>
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8 md:py-10">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <StoreToaster />
    </TooltipProvider>
  );
}
