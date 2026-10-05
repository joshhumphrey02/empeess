"use client";

import { IconArrowRight } from "@tabler/icons-react";
import { motion, useInView } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades content in from a blur as it scrolls into view. */
export function BlurReveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "p" | "span" | "li";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </Tag>
  );
}

/** Word-by-word blur reveal for headings, triggered on scroll. */
export function WordsReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  return (
    <span ref={ref} className={cn("inline", className)}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: "0.35em", filter: "blur(10px)" }}
          animate={
            inView ? { opacity: 1, y: "0em", filter: "blur(0px)" } : undefined
          }
          transition={{ duration: 0.7, ease, delay: delay + i * 0.06 }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Image in the signature chamfered frame. `split` adds the horizontal slit
 * from the reference design. The frame wipes open when it enters the view.
 */
export function ChamferImage({
  src,
  alt,
  className,
  imgClassName,
  split = false,
  cut = "18%",
  sizes = "(min-width: 1024px) 40vw, 90vw",
  preload = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  split?: boolean;
  cut?: string;
  sizes?: string;
  preload?: boolean;
}) {
  return (
    <motion.div
      className={cn("chamfer relative overflow-hidden bg-neutral-200", className)}
      style={{ ["--cut" as string]: cut }}
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.25 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={cn("object-cover", imgClassName)}
        />
      </motion.div>
      {split && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-[74%] h-2 bg-white"
        />
      )}
    </motion.div>
  );
}

/** Outlined pill link with a sliding arrow, e.g. "LEARN MORE →". */
export function PillLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-neutral-900 px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-900 transition-colors duration-500 hover:text-white",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-0 translate-y-full rounded-full bg-neutral-900 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
      />
      <span className="relative">{children}</span>
      <IconArrowRight
        className="relative size-4 transition-transform duration-500 group-hover:translate-x-1"
        stroke={1.5}
      />
    </Link>
  );
}

/** Orange four-petal flower accent, slowly spinning. */
export function Flower({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      aria-hidden
      className={cn("text-brand", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
    >
      <g fill="currentColor">
        <circle cx="20" cy="9" r="8" />
        <circle cx="20" cy="31" r="8" />
        <circle cx="9" cy="20" r="8" />
        <circle cx="31" cy="20" r="8" />
        <circle cx="20" cy="20" r="6" />
      </g>
    </motion.svg>
  );
}

/** Small mono label like "[CATEGORIES]" or "//FASHION". */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500",
        className,
      )}
    >
      {children}
    </span>
  );
}
