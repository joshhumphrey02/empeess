"use client";

import { motion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

/** The sweeping light beam from Aceternity's "Spotlight", tinted with the brand. */
export function Spotlight({ className, fill = "var(--brand)" }: { className?: string; fill?: string }) {
  // Usable inside url(#…) whatever characters React puts in ids.
  const filter = `spot${useId().replace(/[^\w-]/g, "")}`;
  return (
    <motion.svg
      aria-hidden
      className={cn("pointer-events-none absolute h-[169%] w-[138%] lg:w-[84%]", className)}
      viewBox="0 0 3787 2842"
      fill="none"
      initial={{ opacity: 0, x: "-72%", y: "-62%", scale: 0.5 }}
      animate={{ opacity: 1, x: "-50%", y: "-40%", scale: 1 }}
      transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <g filter={`url(#${filter})`}>
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id={filter}
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="blur" />
        </filter>
      </defs>
    </motion.svg>
  );
}
