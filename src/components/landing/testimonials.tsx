import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

import { testimonialRating, testimonials as defaults } from "./content";
import { BlurReveal } from "./primitives";

export function Testimonials({ content: testimonials = defaults }: { content?: typeof defaults }) {
  return (
    <section aria-label="Customer testimonials" className="bg-canvas py-24 sm:py-32">
      <BlurReveal className="mx-auto max-w-360 px-4 sm:px-8">
        <AnimatedTestimonials testimonials={testimonials} rating={testimonialRating} />
      </BlurReveal>
    </section>
  );
}
