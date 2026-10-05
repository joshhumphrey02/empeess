import { Categories } from "@/components/landing/categories";
import { Collections } from "@/components/landing/collections";
import { Hero } from "@/components/landing/hero";
import { Lookbook } from "@/components/landing/lookbook";
import { Moments } from "@/components/landing/moments";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Testimonials } from "@/components/landing/testimonials";

export default function Home() {
  return (
    <SmoothScroll>
      <SiteHeader />
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
