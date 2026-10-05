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

// Lenis smooth scrolling driven by GSAP's ticker, so ScrollTrigger and Lenis
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
        options={{ autoRaf: false, lerp: 0.09, smoothWheel: true }}
      >
        <ScrollTriggerSync />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
