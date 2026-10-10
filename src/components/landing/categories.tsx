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

  // Desktop: pin the section and step through categories as you scroll.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: `+=${items.length * 55}%`,
          pin: true,
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
      className="relative flex min-h-svh items-center overflow-hidden bg-white py-20"
    >
      <h2 id="categories-heading" className="sr-only">
        Shop by category
      </h2>
      <div className="mx-auto grid w-full max-w-360 grid-cols-12 items-center gap-x-4 gap-y-10 px-4 sm:px-8">
        {/* Copy + CTA */}
        <div className="col-span-12 flex flex-col gap-8 lg:col-span-3 lg:h-[62vh] lg:justify-between">
          <BlurReveal as="p" className="max-w-64 text-sm leading-relaxed text-neutral-600">
            {categories.copy}
          </BlurReveal>
          <PillLink href={`/shop/${current.slug}`} className="w-fit">
            See {current.name}
          </PillLink>
        </div>

        {/* Photo: wipes to the active category */}
        <div className="relative col-span-12 aspect-4/5 sm:col-span-7 lg:col-span-4 lg:col-start-4 lg:h-[62vh] lg:aspect-auto">
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
        <div className="col-span-12 flex flex-col gap-8 sm:col-span-5 lg:col-span-4 lg:col-start-9 lg:h-[62vh] lg:justify-between">
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
                    className="group flex items-start gap-3 py-1 text-left lg:justify-end"
                  >
                    <span
                      className={cn(
                        "mt-2 text-[11px] transition-colors duration-500",
                        i === active ? "text-neutral-900" : "text-neutral-400",
                      )}
                    >
                      [0{i + 1}]
                    </span>
                    <motion.span
                      className="text-[clamp(2.25rem,4vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.04em] text-neutral-950"
                      animate={{
                        opacity: i === active ? 1 : Math.max(0.18, 0.55 - distance * 0.13),
                        x: i === active ? -12 : 0,
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

          <div className="flex items-center gap-3 lg:justify-end">
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
