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
import { getSiteContent } from "@/server/site-content";

export default async function Home() {
  const [user, cartCount, content] = await Promise.all([getCurrentUser(), getCartCount(), getSiteContent()]);
  return (
    <SmoothScroll>
      <SiteHeader
        cartCount={cartCount}
        signedIn={Boolean(user)}
        menuImage={{ src: content.hero.src, alt: content.hero.imageAlt }}
      />
      <main className="flex-1 bg-white">
        <Hero content={content.hero} />
        <Moments content={content.moments} />
        <Categories content={content.categories} />
        <Testimonials content={content.testimonials} />
        <Lookbook content={content.lookbook} />
        <Collections content={content.collections} />
      </main>
      <SiteFooter content={content.footer} />
    </SmoothScroll>
  );
}
