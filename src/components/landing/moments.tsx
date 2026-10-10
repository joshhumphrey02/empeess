"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

import { moments as defaults } from "./content";
import { BlurReveal, ChamferImage, Flower, PillLink, WordsReveal } from "./primitives";

export function Moments({ content: moments = defaults }: { content?: typeof defaults }) {
  const root = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start end", "end start"],
  });
  // Two photos drift at different speeds for depth.
  const slow = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const fast = useTransform(scrollYProgress, [0, 1], ["22%", "-22%"]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, 240]);

  return (
    <section ref={root} className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto grid max-w-360 grid-cols-12 gap-x-4 gap-y-10 px-4 sm:px-8">
        <h2 className="col-span-12 text-[clamp(2.75rem,5.6vw,5.75rem)] font-medium leading-[0.95] tracking-[-0.04em] text-neutral-950 lg:col-span-6">
          <WordsReveal text={moments.title[0]} />
          <br />
          <WordsReveal text={moments.title[1]} delay={0.15} />
        </h2>

        <div className="col-span-12 flex items-start justify-between gap-6 lg:col-span-4 lg:col-start-9 lg:flex-col lg:items-end">
          <BlurReveal className="relative aspect-4/5 w-24 overflow-hidden sm:w-28">
            <Image
              src={moments.thumb.src}
              alt={moments.thumb.alt}
              fill
              sizes="112px"
              className="object-cover"
            />
          </BlurReveal>
          <div className="flex w-full items-end justify-between gap-4 lg:mt-6">
            <BlurReveal as="p" className="max-w-44 text-xs leading-snug text-neutral-600">
              {moments.copy}
            </BlurReveal>
            <BlurReveal as="p" className="text-2xl font-medium tracking-tight text-neutral-950 sm:text-3xl" delay={0.1}>
              {moments.price}
            </BlurReveal>
          </div>
        </div>

        {/* CTA column */}
        <div className="col-span-12 flex items-center gap-6 lg:col-span-2 lg:flex-col lg:items-start lg:self-center">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-brand" />
            <span className="size-2 rounded-full bg-neutral-300" />
          </div>
          <PillLink href="/shop">Learn more</PillLink>
        </div>

        {/* Primary photo */}
        <motion.figure style={{ y: slow }} className="relative col-span-12 sm:col-span-7 lg:col-span-4 lg:-mt-10">
          <motion.span style={{ rotate: spin }} className="absolute -left-4 -top-6 z-10 block sm:-left-6">
            <Flower className="size-14 sm:size-16" />
          </motion.span>
          <ChamferImage
            src={moments.primary.src}
            alt={moments.primary.alt}
            split
            className="aspect-[4/3.6] w-full"
            sizes="(min-width: 1024px) 34vw, 90vw"
          />
          <figcaption className="mt-4 text-base tracking-tight text-neutral-900">
            {moments.primary.caption}
          </figcaption>
        </motion.figure>

        {/* Secondary photo with dashed connector */}
        <motion.figure
          style={{ y: fast }}
          className="relative col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-8 lg:mt-48"
        >
          <svg
            aria-hidden
            className="absolute -top-24 left-1/3 hidden h-24 w-[90%] text-neutral-300 lg:block"
            fill="none"
          >
            <motion.path
              d="M0 96 V20 H400 V0"
              stroke="currentColor"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </svg>
          <ChamferImage
            src={moments.secondary.src}
            alt={moments.secondary.alt}
            cut="14%"
            className="aspect-[4/3.4] w-full"
            sizes="(min-width: 1024px) 26vw, 90vw"
          />
          <figcaption className="mt-4 text-base tracking-tight text-neutral-900">
            {moments.secondary.caption}
          </figcaption>
        </motion.figure>

        <BlurReveal
          as="p"
          className="col-span-12 self-center text-right text-3xl font-medium tracking-tight text-neutral-950 lg:col-span-2 lg:mt-48"
        >
          {moments.secondary.badge}
        </BlurReveal>
      </div>
    </section>
  );
}
