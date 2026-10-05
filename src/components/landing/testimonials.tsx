import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

import { testimonialRating, testimonials } from "./content";
import { BlurReveal } from "./primitives";

export function Testimonials() {
  return (
    <section aria-label="Customer testimonials" className="bg-canvas py-24 sm:py-32">
      <BlurReveal className="mx-auto max-w-360 px-4 sm:px-8">
        <AnimatedTestimonials testimonials={testimonials} rating={testimonialRating} />
      </BlurReveal>
    </section>
  );
}
