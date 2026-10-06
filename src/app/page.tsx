import { Categories } from "@/components/landing/categories";
import { Collections } from "@/components/landing/collections";
import { Hero } from "@/components/landing/hero";
import { Lookbook } from "@/components/landing/lookbook";
import { Moments } from "@/components/landing/moments";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Testimonials } from "@/components/landing/testimonials";
import { getCurrentUser } from "@/server/auth/session";
import { getCartCount } from "@/server/cart";

export default async function Home() {
  const [user, cartCount] = await Promise.all([getCurrentUser(), getCartCount()]);
  return (
    <SmoothScroll>
      <SiteHeader cartCount={cartCount} signedIn={Boolean(user)} />
      <main className="flex-1 bg-white">
        <Hero />
        <Moments />
        <Categories />
        <Testimonials />
        <Lookbook />
        <Collections />
      </main>
      <SiteFooter />
    </SmoothScroll>
  );
}
