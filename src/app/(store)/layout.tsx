import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StoreToaster } from "@/components/store/store-toaster";
import { WishlistProvider } from "@/components/store/wishlist";
import { getCurrentUser } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";
import { wishlistIds } from "@/server/wishlist";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const [cartCount, saved] = await Promise.all([getCartCount(), user ? wishlistIds(user.id) : Promise.resolve([])]);
  return (
    <WishlistProvider ids={saved} signedIn={Boolean(user)}>
      <SiteHeader solid cartCount={cartCount} signedIn={Boolean(user)} />
      <main className="flex-1 bg-white pb-24 pt-28 sm:pt-32">{children}</main>
      <SiteFooter />
      <StoreToaster />
    </WishlistProvider>
  );
}
