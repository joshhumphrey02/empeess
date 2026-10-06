"use client";

import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils";

/** A glow that travels around its parent's border (Aceternity "Moving Border"). */
function MovingBorder({ children, duration = 3500, rx = "22%", ry = "22%" }: { children: React.ReactNode; duration?: number; rx?: string; ry?: string }) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);
  const reduce = useReducedMotion();

  useAnimationFrame((time) => {
    if (reduce) return;
    const length = pathRef.current?.getTotalLength();
    if (length) progress.set(((time * length) / duration) % length);
  });

  const x = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).x ?? 0);
  const y = useTransform(progress, (v) => pathRef.current?.getPointAtLength(v).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute size-full" width="100%" height="100%" aria-hidden>
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}>{children}</motion.div>
    </>
  );
}

/** Primary call-to-action link with a light running around its edge. */
export function MovingBorderLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex h-9 overflow-hidden rounded-lg p-px text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-lg bg-primary/40">
        <MovingBorder>
          <span className="block size-14 bg-[radial-gradient(oklch(0.86_0.13_220)_40%,transparent_60%)] opacity-90" />
        </MovingBorder>
      </span>
      <span className="relative flex h-full items-center gap-1.5 rounded-[calc(var(--radius-lg)-1px)] bg-primary px-3 text-primary-foreground transition-colors [&_svg]:size-4">
        {children}
      </span>
    </Link>
  );
}
