"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { lookbook } from "./content";
import { BlurReveal, Eyebrow, WordsReveal } from "./primitives";

const ease = [0.22, 1, 0.36, 1] as const;

export function Lookbook() {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; left: number } | null>(null);

  // The card nearest the scroller's centre is "active" and lifts up.
  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centre);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // Open on the second slide so cards peek in from both sides.
    const first = el.children[1] as HTMLElement | undefined;
    if (first) el.scrollLeft = first.offsetLeft - (el.clientWidth - first.offsetWidth) / 2;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const goTo = (index: number) => {
    const el = scroller.current;
    const card = el?.children[index] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({
      left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  const count = lookbook.slides.length;

  return (
    <section aria-labelledby="lookbook-heading" className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto flex max-w-360 flex-wrap items-end justify-between gap-6 px-4 sm:px-8">
        <h2
          id="lookbook-heading"
          className="text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-neutral-950"
        >
          <WordsReveal text={lookbook.title[0]} />
          <br />
          <WordsReveal text={lookbook.title[1]} delay={0.1} />
        </h2>
        <BlurReveal className="hidden text-sm text-neutral-600 md:block">{lookbook.year}</BlurReveal>
        <div className="flex items-center gap-8">
          <Eyebrow className="text-neutral-900">[Lookbook]</Eyebrow>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous look"
              onClick={() => goTo(Math.max(0, active - 1))}
              className="grid h-10 w-12 place-items-center rounded-full border border-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              <IconArrowLeft className="size-4" stroke={1.5} />
            </button>
            <button
              type="button"
              aria-label="Next look"
              onClick={() => goTo(Math.min(count - 1, active + 1))}
              className="grid h-10 w-12 place-items-center rounded-full border border-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              <IconArrowRight className="size-4" stroke={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        role="region"
        aria-label="Lookbook carousel"
        tabIndex={0}
        className="mt-14 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc((100vw-90rem)/2+2rem))] pb-8 pt-10 [scrollbar-width:none] active:cursor-grabbing sm:gap-5 [&::-webkit-scrollbar]:hidden"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          drag.current = { x: e.clientX, left: scroller.current?.scrollLeft ?? 0 };
          scroller.current?.style.setProperty("scroll-snap-type", "none");
        }}
        onPointerMove={(e) => {
          if (!drag.current || !scroller.current) return;
          scroller.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => {
          if (!drag.current) return;
          drag.current = null;
          scroller.current?.style.removeProperty("scroll-snap-type");
          goTo(active);
        }}
        onPointerLeave={() => {
          if (!drag.current) return;
          drag.current = null;
          scroller.current?.style.removeProperty("scroll-snap-type");
          goTo(active);
        }}
      >
        {lookbook.slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <motion.figure
              key={`${slide.src}-${i}`}
              className="relative w-[70vw] shrink-0 snap-center select-none sm:w-[42vw] lg:w-[22vw]"
              animate={{ y: isActive ? -40 : 0 }}
              transition={{ duration: 0.7, ease }}
            >
              <motion.div
                className={cn("chamfer relative overflow-hidden bg-neutral-100", "aspect-3/4")}
                style={{ ["--cut" as string]: "12%" }}
                animate={{ scale: isActive ? 1 : 0.94 }}
                transition={{ duration: 0.7, ease }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 42vw, 70vw"
                  className="object-cover"
                />
              </motion.div>
              <motion.figcaption
                className="mt-5 text-center text-sm text-neutral-900"
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              >
                {slide.label}
              </motion.figcaption>
            </motion.figure>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center gap-2" aria-hidden>
        {lookbook.slides.map((slide, i) => (
          <span key={`${slide.src}-dot-${i}`} className="relative h-0.5 w-8 overflow-hidden bg-neutral-200">
            <motion.span
              className="absolute inset-0 origin-left bg-neutral-950"
              animate={{ scaleX: i === active ? 1 : 0 }}
              transition={{ duration: 0.5, ease }}
            />
          </span>
        ))}
      </div>
    </section>
  );
}
