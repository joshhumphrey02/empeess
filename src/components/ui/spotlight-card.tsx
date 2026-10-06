"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Card with a pointer-following spotlight and a glowing border, after
 * Aceternity's "Card Spotlight" and "Glowing Effect". Drop-in for <Card>:
 * same surface, ring and spacing variables.
 */
export function SpotlightCard({
  className,
  children,
  size = "default",
  radius = 260,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm"; radius?: number }) {
  const x = useMotionValue(-radius * 2);
  const y = useMotionValue(-radius * 2);
  const glow = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, color-mix(in oklch, var(--brand) 13%, transparent), transparent 75%)`;
  const edge = useMotionTemplate`radial-gradient(${radius * 0.75}px circle at ${x}px ${y}px, var(--brand), transparent 70%)`;

  return (
    <div
      data-slot="card"
      data-size={size}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      className={cn(
        "group/card group/spot relative isolate flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 transition-shadow duration-300 [--card-spacing:--spacing(4)] hover:shadow-[0_8px_30px_-12px_color-mix(in_oklch,var(--brand)_35%,transparent)] data-[size=sm]:[--card-spacing:--spacing(3)]",
        className,
      )}
      {...props}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: glow }}
      />
      {/* 1px border lit where the pointer is: the gradient shows only in the padding box. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-300 [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] group-hover/spot:opacity-100"
        style={{ background: edge }}
      />
      {children}
    </div>
  );
}
