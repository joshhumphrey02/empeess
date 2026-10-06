"use client";

import {
  IconMenu2,
  IconSearch,
  IconShoppingBag,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { hero, images, nav } from "./content";
import { ChamferImage } from "./primitives";

const ease = [0.22, 1, 0.36, 1] as const;

function IconCircle({
  label,
  href,
  onClick,
  badge,
  children,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  const className =
    "relative grid size-11 place-items-center rounded-full bg-white text-neutral-900 ring-1 ring-neutral-900/5 transition-transform duration-300 hover:scale-105 active:scale-95";
  if (href)
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-5 text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    );
  return (
    <button type="button" aria-label={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function SiteHeader({
  cartCount = 0,
  signedIn = false,
  solid = false,
}: {
  cartCount?: number;
  signedIn?: boolean;
  /** Store pages: keep the frosted bar visible from the top. */
  solid?: boolean;
}) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    // Tuck the bar away while scrolling down, bring it back on scroll up.
    setHidden(y > 400 && y > prev);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-8 sm:pt-6"
        animate={{ y: hidden && !open ? "-120%" : "0%" }}
        transition={{ duration: 0.5, ease }}
      >
        <div
          className={cn(
            "mx-auto flex max-w-360 items-center justify-between rounded-full px-2 py-2 transition-[background-color,box-shadow,backdrop-filter] duration-500",
            (scrolled || solid) && !open
              ? "bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl"
              : "bg-transparent",
          )}
        >
          <IconCircle
            label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {open ? <IconX className="size-5" stroke={1.5} /> : <IconMenu2 className="size-5" stroke={1.5} />}
              </motion.span>
            </AnimatePresence>
          </IconCircle>

          <Link
            href="/"
            className="font-logo text-2xl font-semibold uppercase tracking-tight text-neutral-950 sm:text-3xl"
          >
            {nav.brand}
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block">
              <IconCircle label="Search" href="/search">
                <IconSearch className="size-5" stroke={1.5} />
              </IconCircle>
            </span>
            <IconCircle
              label={cartCount ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Cart"}
              href="/cart"
              badge={cartCount}
            >
              <IconShoppingBag className="size-5" stroke={1.5} />
            </IconCircle>
            <IconCircle label={signedIn ? "Your account" : "Sign in"} href={signedIn ? "/account" : "/login"}>
              <IconUser className="size-5" stroke={1.5} />
            </IconCircle>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            data-lenis-prevent
            className="fixed inset-0 z-40 overflow-y-auto bg-canvas"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease }}
          >
            <div className="mx-auto grid min-h-full max-w-360 gap-10 px-6 pb-12 pt-32 sm:px-12 lg:grid-cols-[1fr_380px] lg:items-end">
              <nav aria-label="Main">
                <ul className="space-y-1">
                  {nav.links.map((link, i) => (
                    <li key={link.href} className="overflow-hidden">
                      <motion.div
                        initial={{ y: "110%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "110%" }}
                        transition={{ duration: 0.7, ease, delay: 0.15 + i * 0.06 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-baseline gap-4 text-[clamp(2.75rem,8vw,7rem)] font-medium leading-[0.95] tracking-tighter text-neutral-950"
                        >
                          <span className="text-sm font-normal tracking-normal text-neutral-400">
                            [0{i + 1}]
                          </span>
                          <span className="transition-transform duration-500 group-hover:translate-x-4">
                            {link.label}
                          </span>
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </nav>
              <motion.div
                className="hidden lg:block"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease, delay: 0.4 }}
              >
                <ChamferImage
                  src={images.heroModel}
                  alt={hero.imageAlt}
                  className="aspect-3/4 w-full"
                  sizes="380px"
                />
                <p className="mt-4 text-sm text-neutral-600">
                  New collection 2026 — clothes, joggers, hoodies & perfumes.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
