"use client";

import { useInView, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const count = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/** How to print the number. Money is in kobo, like everywhere else. */
export type TickerFormat = "count" | "money";

const format = (v: number, kind: TickerFormat) => (kind === "money" ? formatMoney(Math.round(v)) : count.format(Math.round(v)));

/** Counts up to `value` when scrolled into view (Aceternity / Magic UI style). */
export function NumberTicker({ value, kind = "count", className }: { value: number; kind?: TickerFormat; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const spring = useSpring(0, { stiffness: 70, damping: 22, restDelta: 0.5 });

  useEffect(() => {
    if (reduce) spring.jump(value);
    else if (inView) spring.set(value);
  }, [inView, reduce, spring, value]);

  useMotionValueEvent(spring, "change", (v) => {
    if (ref.current) ref.current.textContent = format(v, kind);
  });

  // Starts at 0 on both server and client (no hydration mismatch); the
  // accessible name is always the final value.
  return (
    <span className={cn("tabular-nums", className)}>
      <span ref={ref} aria-hidden>
        {format(0, kind)}
      </span>
      <span className="sr-only">{format(value, kind)}</span>
    </span>
  );
}
