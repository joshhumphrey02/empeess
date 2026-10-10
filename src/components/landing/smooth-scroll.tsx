"use client";

import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useEffect, useRef } from "react";

import { gsap, ScrollTrigger } from "@/lib/gsap";

function ScrollTriggerSync() {
  // Keep ScrollTrigger's positions in step with Lenis on every scroll.
  useLenis(ScrollTrigger.update);
  return null;
}

// Home page only. Lenis smooth scrolling driven by GSAP's ticker, so ScrollTrigger and Lenis
// read the same scroll position on the same frame. Motion animations honour
// the visitor's reduced-motion setting.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    // Lenis creates its instance after this component mounts, so read the ref
    // on every tick rather than capturing it once.
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis
        root
        ref={lenisRef}
        options={{
          autoRaf: false,
          lerp: 0.09,
          smoothWheel: true,
          // Slow the page down so the scroll-driven sections have time to
          // play: each wheel notch or swipe moves less than the browser default.
          wheelMultiplier: 0.6,
          // Touch scrolling is native unless Lenis drives it; syncTouch is what
          // lets the multiplier and a gentler fling apply on phones.
          syncTouch: true,
          touchMultiplier: 0.75,
          touchInertiaExponent: 1.4,
        }}
      >
        <ScrollTriggerSync />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
