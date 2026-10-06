"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type TooltipPerson = { id: string; name: string; detail: string; image?: string | null; href?: string };

/** Overlapping avatars with a springy, tilting name card (Aceternity "Animated Tooltip"). */
export function AnimatedTooltip({ items }: { items: TooltipPerson[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const x = useMotionValue(0);
  const spring = { stiffness: 120, damping: 8 };
  const rotate = useSpring(useTransform(x, [-100, 100], [-35, 35]), spring);
  const translateX = useSpring(useTransform(x, [-100, 100], [-40, 40]), spring);

  return (
    <div className="flex items-center">
      {items.map((item) => {
        const initials = item.name
          .split(/[\s@]/)
          .map((s) => s[0]?.toUpperCase())
          .slice(0, 2)
          .join("");
        const avatar = (
          <Avatar className="size-11 border-2 border-card transition-transform duration-300 group-hover/tip:z-30 group-hover/tip:scale-110">
            {item.image && <AvatarImage src={item.image} alt="" />}
            <AvatarFallback className="bg-brand-soft text-xs font-medium text-brand">{initials}</AvatarFallback>
          </Avatar>
        );
        return (
          <div
            key={item.id}
            className="group/tip relative -mr-3"
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(item.id)}
            onBlur={() => setHovered(null)}
          >
            <AnimatePresence>
              {hovered === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 12 } }}
                  exit={{ opacity: 0, y: 20, scale: 0.6 }}
                  style={{ translateX, rotate, whiteSpace: "nowrap" }}
                  className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-foreground px-3 py-1.5 text-xs shadow-xl"
                >
                  <span className="absolute inset-x-6 -bottom-px z-30 h-px w-[40%] bg-linear-to-r from-transparent via-brand to-transparent" />
                  <span className="relative z-30 text-sm font-semibold text-background">{item.name}</span>
                  <span className="text-[11px] text-background/70">{item.detail}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              onMouseMove={(e) => {
                const half = e.currentTarget.offsetWidth / 2;
                x.set(e.nativeEvent.offsetX - half);
              }}
            >
              {item.href ? (
                <Link href={item.href} aria-label={`${item.name}, ${item.detail}`} className="block rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  {avatar}
                </Link>
              ) : (
                avatar
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
