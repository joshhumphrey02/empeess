"use client";

import { motion, MotionConfig } from "motion/react";
import Image from "next/image";

import { images } from "@/components/landing/content";
import { Flower } from "@/components/landing/primitives";

const ease = [0.22, 1, 0.36, 1] as const;

/** "4 · 0 · 4" where the zero is a pill-shaped photo, rising in like the hero. */
export function NotFoundHero() {
  const digit = "text-[clamp(7rem,26vw,20rem)] font-medium leading-[0.8] tracking-[-0.06em] text-neutral-950";
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex items-center justify-center gap-[2vw]" aria-hidden>
        <span className="overflow-hidden pb-[0.04em]">
          <motion.span className={`block ${digit}`} initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 1.1, ease }}>
            4
          </motion.span>
        </span>

        <span className="relative block aspect-[3/4] w-[clamp(5rem,18vw,14rem)]">
          {/* Clip only the photo, so the flower can overhang the pill. */}
          <motion.span
            className="absolute inset-0 overflow-hidden rounded-full bg-neutral-200"
            initial={{ clipPath: "inset(100% 0% 0% 0% round 999px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 999px)" }}
            transition={{ duration: 1.3, ease, delay: 0.15 }}
          >
            <motion.span className="absolute inset-0" initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease, delay: 0.15 }}>
              <Image src={images.hoodieMono} alt="" fill sizes="(min-width: 768px) 18vw, 30vw" className="object-cover grayscale" preload />
            </motion.span>
          </motion.span>
          <motion.span
            className="absolute -right-[12%] -top-[6%] block"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.9 }}
          >
            <Flower className="size-[clamp(2rem,5vw,3.75rem)]" />
          </motion.span>
        </span>

        <span className="overflow-hidden pb-[0.04em]">
          <motion.span className={`block ${digit}`} initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 1.1, ease, delay: 0.1 }}>
            4
          </motion.span>
        </span>
      </div>
    </MotionConfig>
  );
}

export function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  );
}
