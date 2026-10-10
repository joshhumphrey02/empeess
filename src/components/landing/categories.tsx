"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { categories } from "./content";
import { BlurReveal, Eyebrow, PillLink } from "./primitives";

const ease = [0.22, 1, 0.36, 1] as const;
const items = categories.items;

export function Categories() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const current = items[active];

  // Pin the section and step through categories as you scroll. Phones pin too,
  // as long as the screen is tall enough to show the whole section at once.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and ((min-width: 1024px) or (min-height: 560px))", () => {
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          // A full screen of scrolling per category, so each photo has time
          // to finish its reveal before the next one starts.
          end: `+=${items.length * 100}%`,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            const next = Math.min(items.length - 1, Math.floor(self.progress * items.length));
            setActive((prev) => (prev === next ? prev : next));
          },
        });
        return () => st.kill();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="categories-heading"
      className="relative flex h-svh min-h-140 items-center overflow-hidden bg-white py-6 lg:h-auto lg:min-h-svh lg:py-20"
    >
      <h2 id="categories-heading" className="sr-only">
        Shop by category
      </h2>
      {/* Below lg everything has to fit one screen so it can pin: the photo
          takes whatever height the list and CTA leave over. */}
      <div className="mx-auto grid h-full w-full max-w-360 grid-cols-12 grid-rows-[minmax(0,1fr)_auto_auto] gap-x-4 gap-y-5 px-4 sm:px-8 lg:h-auto lg:grid-rows-none lg:items-center lg:gap-y-10">
        {/* Copy + CTA */}
        <div className="order-3 col-span-12 flex items-center justify-between gap-8 lg:order-0 lg:col-span-3 lg:h-[62vh] lg:flex-col lg:items-start">
          <BlurReveal as="p" className="hidden max-w-64 text-sm leading-relaxed text-neutral-600 lg:block">
            {categories.copy}
          </BlurReveal>
          <PillLink href={`/shop/${current.slug}`} className="w-fit">
            See {current.name}
          </PillLink>
          <Link
            href="/shop"
            className="text-[11px] uppercase tracking-wide text-neutral-900 underline-offset-4 hover:underline lg:hidden"
          >
            View all
          </Link>
        </div>

        {/* Photo: wipes to the active category */}
        <div className="relative order-1 col-span-12 min-h-0 lg:order-0 lg:col-span-4 lg:col-start-4 lg:h-[62vh]">
          <div className="chamfer absolute inset-0 overflow-hidden bg-neutral-100" style={{ ["--cut" as string]: "16%" }}>
            <AnimatePresence initial={false}>
              <motion.div
                key={current.slug}
                className="absolute inset-0"
                initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.15 }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                exit={{ opacity: 0.6 }}
                transition={{ duration: 1, ease }}
              >
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="(min-width: 1024px) 34vw, 90vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            {/* Notch from the reference design */}
            <span aria-hidden className="absolute bottom-[22%] right-0 h-[16%] w-[12%] bg-white" />
          </div>
        </div>

        {/* Category list */}
        <div className="order-2 col-span-12 flex flex-col gap-8 lg:order-0 lg:col-span-4 lg:col-start-9 lg:h-[62vh] lg:justify-between">
          <ul className="flex flex-col lg:items-end">
            {items.map((item, i) => {
              const distance = Math.abs(i - active);
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className="block py-1 text-left"
                  >
                    <motion.span
                      className={cn(
                        // Nudge the active name inward: right on phones, left on desktop.
                        "block transition-transform duration-500 ease-out",
                        i === active && "translate-x-3 lg:-translate-x-3",
                        "text-[2rem] font-medium lg:text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.05] tracking-[-0.04em] text-neutral-950",
                      )}
                      animate={{
                        opacity: i === active ? 1 : Math.max(0.18, 0.55 - distance * 0.13),
                      }}
                      transition={{ duration: 0.6, ease }}
                    >
                      {item.name} <span className="font-normal">({item.count})</span>
                    </motion.span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-3 lg:flex lg:justify-end">
            <Eyebrow>[Categories]</Eyebrow>
            <span className="h-px w-24 border-t border-dashed border-neutral-300" />
            <Link
              href="/shop"
              className="text-[11px] uppercase tracking-wide text-neutral-900 underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
