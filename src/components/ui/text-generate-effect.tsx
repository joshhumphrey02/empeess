"use client";

// Adapted from Aceternity UI's Text Generate Effect
// (https://ui.aceternity.com/components/text-generate-effect): words fade in
// from a blur. Changed to start when scrolled into view and to inherit colour
// and type size from the caller instead of hard-coding them.

import { useEffect } from "react";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.08,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
}) => {
  const [scope, animate] = useAnimate();
  const inView = useInView(scope, { once: true, margin: "0px 0px -10% 0px" });
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (!inView) return;
    animate(
      "span",
      { opacity: 1, filter: filter ? "blur(0px)" : "none" },
      { duration, delay: stagger(staggerDelay) },
    );
  }, [inView, animate, filter, duration, staggerDelay]);

  return (
    <motion.span ref={scope} className={cn("inline", className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className="opacity-0"
          style={{ filter: filter ? "blur(10px)" : "none" }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </motion.span>
  );
};
