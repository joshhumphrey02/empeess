import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getCurrentUser } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartCount()]);
  return (
    <>
      <SiteHeader solid cartCount={cartCount} signedIn={Boolean(user)} />
      <main className="flex-1 bg-white pb-24 pt-28 sm:pt-32">{children}</main>
      <SiteFooter />
    </>
  );
}
