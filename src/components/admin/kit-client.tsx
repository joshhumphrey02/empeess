"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useId, useState } from "react";

import { NumberTicker, type TickerFormat } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

/** Filter links with a pill that slides to the active option. */
export function FilterPills({
  options,
  active,
}: {
  options: { value: string; label: string; count?: number; href: string }[];
  active: string;
}) {
  const id = useId();
  return (
    <nav aria-label="Filter" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((o) => {
        const isActive = o.value === active;
        return (
          <Link
            key={o.value}
            href={o.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`pill-${id}`}
                className="absolute inset-0 -z-0 rounded-lg bg-primary shadow-[0_4px_14px_-4px_color-mix(in_oklch,var(--primary)_60%,transparent)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && <span className="relative text-xs tabular-nums opacity-70">{o.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export type StatItem = {
  key: string;
  label: string;
  value: number;
  kind?: TickerFormat;
  hint?: string;
  href?: string;
  active?: boolean;
  icon?: React.ReactNode;
  tone?: "default" | "warning" | "danger" | "success";
};

const TONE: Record<NonNullable<StatItem["tone"]>, string> = {
  default: "bg-brand-soft text-brand",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

/**
 * Summary tiles that double as filters. A highlight glides between them on
 * hover (Aceternity "Card Hover Effect"); the active filter keeps a brand ring.
 */
export function StatCards({ items, className }: { items: StatItem[]; className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const id = useId();
  return (
    <div className={cn("mb-6 grid grid-cols-2 gap-1 lg:grid-cols-4", className)}>
      {items.map((item, i) => {
        const body = (
          <>
            <AnimatePresence>
              {hovered === item.key && (
                <motion.span
                  layoutId={`stat-hover-${id}`}
                  className="absolute inset-0 rounded-2xl bg-brand-soft/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.1 } }}
                />
              )}
            </AnimatePresence>
            <span
              className={cn(
                "relative z-10 flex h-full flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow",
                item.active && "ring-2 ring-brand",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                {item.icon && (
                  <span className={cn("grid size-8 place-items-center rounded-lg [&_svg]:size-4", TONE[item.tone ?? "default"])}>{item.icon}</span>
                )}
              </span>
              <NumberTicker value={item.value} kind={item.kind} className="text-2xl font-semibold tracking-tight" />
              {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
            </span>
          </>
        );
        const shared = {
          className: "group relative block h-full p-1 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500",
          style: { animationDelay: `${i * 60}ms` },
          onMouseEnter: () => setHovered(item.key),
          onMouseLeave: () => setHovered(null),
        };
        return item.href ? (
          <Link key={item.key} href={item.href} aria-current={item.active ? "page" : undefined} {...shared}>
            {body}
          </Link>
        ) : (
          <div key={item.key} {...shared}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
