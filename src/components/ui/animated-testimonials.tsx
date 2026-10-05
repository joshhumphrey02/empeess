"use client";

// Adapted from Aceternity UI's Animated Testimonials
// (https://ui.aceternity.com/components/animated-testimonials): stacked photo
// cards + word-by-word blurred quote, restyled for the storefront. Rotations
// are deterministic per index so server and client render the same markup.

import { IconArrowLeft, IconArrowRight, IconStarFilled } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  src: string;
};

const tilt = (index: number) => ((index * 7) % 21) - 10;
const pad = (n: number) => n.toString().padStart(2, "0");

export const AnimatedTestimonials = ({
  testimonials,
  rating,
  autoplay = true,
  className,
}: {
  testimonials: Testimonial[];
  rating?: { score: string; reviews: number };
  autoplay?: boolean;
  className?: string;
}) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

  const next = () => setActive((prev) => (prev + 1) % count);
  const prev = () => setActive((prev) => (prev - 1 + count) % count);

  useEffect(() => {
    if (!autoplay || paused) return;
    const id = setInterval(() => setActive((p) => (p + 1) % count), 6000);
    return () => clearInterval(id);
  }, [autoplay, paused, count]);

  const current = testimonials[active];

  return (
    <div
      className={cn("grid grid-cols-12 gap-x-4 gap-y-10", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Counter + label row */}
      <p className="col-span-6 text-5xl font-medium tracking-tight text-neutral-950 lg:col-span-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={active}
            className="inline-block"
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-60%", opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {pad(active + 1)}
          </motion.span>
        </AnimatePresence>
        <span className="text-2xl text-neutral-400">/{pad(count)}</span>
      </p>
      <p className="col-span-4 self-center text-xs text-neutral-700 lg:col-span-6">
        [Testimonial]
      </p>
      <span className="col-span-2 grid size-12 place-items-center justify-self-end rounded-full bg-white text-xl font-semibold text-neutral-900 lg:col-span-3">
        “
      </span>

      {/* Name + stacked photos */}
      <div className="col-span-12 sm:col-span-5 lg:col-span-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-base font-medium text-neutral-950">[{current.name}]</p>
            <p className="text-sm text-neutral-600">{current.role}</p>
          </motion.div>
        </AnimatePresence>

        <div className="relative mt-10 aspect-[4/4.4] w-full max-w-64 perspective-[1000px]">
          <AnimatePresence>
            {testimonials.map((t, index) => {
              const isActive = index === active;
              return (
                <motion.div
                  key={t.src}
                  initial={{ opacity: 0, scale: 0.9, z: -100, rotate: tilt(index) }}
                  animate={{
                    opacity: isActive ? 1 : 0.55,
                    scale: isActive ? 1 : 0.94,
                    z: isActive ? 0 : -100,
                    rotate: isActive ? 0 : tilt(index),
                    zIndex: isActive ? 40 : count + 2 - index,
                    y: isActive ? [0, -60, 0] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.9, z: 100, rotate: tilt(index) }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="chamfer-tr absolute inset-0 origin-bottom overflow-hidden bg-white"
                  style={{ ["--cut" as string]: "22%" }}
                >
                  <Image
                    src={t.src}
                    alt={t.name}
                    fill
                    sizes="256px"
                    draggable={false}
                    className="object-cover object-top"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Quote */}
      <div className="col-span-12 flex flex-col justify-between gap-10 sm:col-span-7 lg:col-span-9">
        <motion.blockquote
          key={active}
          className="text-[clamp(1.75rem,3.2vw,3rem)] font-normal leading-[1.12] tracking-[-0.03em] text-neutral-950 lg:indent-[22%]"
        >
          {current.quote.split(" ").map((word, index) => (
            <motion.span
              key={index}
              initial={{ filter: "blur(10px)", opacity: 0, y: 6 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut", delay: 0.025 * index }}
              // indent-0: the blockquote's text-indent would otherwise be
              // inherited by every inline-block word and shove it sideways.
              className="inline-block indent-0"
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </motion.blockquote>

        {rating && (
          <div className="flex items-center gap-3 lg:ml-[30%]">
            <span className="flex gap-0.5 text-brand" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStarFilled key={i} className="size-4" />
              ))}
            </span>
            <span className="text-sm text-neutral-800">
              {rating.score} ({rating.reviews} Reviews)
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="col-span-12 flex items-center justify-between gap-6 border-t border-neutral-200 pt-6 lg:border-0 lg:pt-0">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonial"
          className="group grid h-10 w-12 place-items-center rounded-full border border-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white lg:ml-[8%]"
        >
          <IconArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" stroke={1.5} />
        </button>
        <p className="hidden text-sm text-neutral-800 sm:block">See what our customers are saying</p>
        <span className="hidden text-2xl font-semibold text-neutral-900 sm:block" aria-hidden>
          ”
        </span>
        <button
          type="button"
          onClick={next}
          aria-label="Next testimonial"
          className="group grid h-10 w-12 place-items-center rounded-full border border-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" stroke={1.5} />
        </button>
      </div>
    </div>
  );
};
