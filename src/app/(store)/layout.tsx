import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StoreToaster } from "@/components/store/store-toaster";
import { WishlistProvider } from "@/components/store/wishlist";
import { isTeamMember } from "@/lib/permissions";
import { getCurrentUser } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";
import { getSiteContent } from "@/server/site-content";
import { wishlistIds } from "@/server/wishlist";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const [cartCount, saved, content] = await Promise.all([
    getCartCount(),
    user ? wishlistIds(user.id) : Promise.resolve([]),
    getSiteContent(),
  ]);
  return (
    <WishlistProvider ids={saved} signedIn={Boolean(user)}>
      <SiteHeader
        solid
        cartCount={cartCount}
        signedIn={Boolean(user)}
        showDashboard={Boolean(user && isTeamMember(user))}
        menuImage={{ src: content.hero.src, alt: content.hero.imageAlt }}
      />
      <main className="flex-1 bg-white pb-24 pt-28 sm:pt-32">{children}</main>
      <SiteFooter content={content.footer} />
      <StoreToaster />
    </WishlistProvider>
  );
}
