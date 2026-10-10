"use client";

import { IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { gsap, SplitText, useGSAP } from "@/lib/gsap";

import { hero, images } from "./content";
import { Flower } from "./primitives";

function HeadlineLine({ text, className }: { text: string; className?: string }) {
  // The leading "- " is a desktop flourish; phones show the bare word.
  const dashed = text.startsWith("- ");
  return (
    <span data-hero-line className={className}>
      {dashed && <span className="hidden lg:inline">- </span>}
      {dashed ? text.slice(2) : text}
    </span>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motionOK: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px)",
        },
        (ctx) => {
          const { motionOK, desktop } = ctx.conditions as {
            motionOK: boolean;
            desktop: boolean;
          };
          if (!motionOK) {
            gsap.set("[data-hero-fade]", { autoAlpha: 1 });
            gsap.set("[data-hero-photo]", { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
            return;
          }

          const split = SplitText.create("[data-hero-line]", {
            type: "chars",
            mask: "chars",
          });

          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.fromTo(
            "[data-hero-photo]",
            { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" },
          )
            .from("[data-hero-photo] img", { scale: 1.35, duration: 2.2 }, 0)
            .from(
              split.chars,
              { yPercent: 115, duration: 1.2, stagger: 0.025 },
              0.55,
            )
            .fromTo(
              "[data-hero-fade]",
              { autoAlpha: 0, y: 20, filter: "blur(8px)" },
              { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.08 },
              1.1,
            )
            .from(
              "[data-hero-pop]",
              { scale: 0, duration: 0.8, stagger: 0.1, ease: "back.out(2)" },
              1.4,
            );

          // Count the stat up from zero.
          const counter = { value: 0 };
          tl.to(
            counter,
            {
              value: hero.stat.value,
              duration: 2,
              ease: "power2.out",
              onUpdate: () => {
                const el = root.current?.querySelector("[data-hero-count]");
                if (el) el.textContent = Math.round(counter.value).toString();
              },
            },
            1.2,
          );

          // Scroll-out: the headline halves drift apart and the photo sinks.
          const scrub = {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          };
          gsap.to("[data-hero-left]", { xPercent: desktop ? -18 : 0, yPercent: -20, ease: "none", scrollTrigger: scrub });
          gsap.to("[data-hero-right]", { xPercent: desktop ? 18 : 0, yPercent: -20, ease: "none", scrollTrigger: scrub });
          gsap.to("[data-hero-photo]", { yPercent: 12, scale: 0.94, ease: "none", scrollTrigger: scrub });
          gsap.to("[data-hero-grid]", { opacity: 0, ease: "none", scrollTrigger: scrub });

          return () => split.revert();
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate overflow-hidden bg-canvas pt-24 sm:pt-28"
    >
      {/* Faint editorial column guides */}
      <div
        data-hero-grid
        aria-hidden
        className="pointer-events-none absolute inset-0 mx-auto grid max-w-360 grid-cols-4 px-4 sm:px-8"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="border-l border-dashed border-neutral-300/70 last:border-r" />
        ))}
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-360 grid-cols-1 px-4 sm:px-8 lg:grid-cols-[1fr_minmax(320px,34vw)_1fr]">
        {/* Left column */}
        <div data-hero-left className="relative z-10 flex flex-col pt-6 lg:pt-16">
          <h1 className="sr-only">
            {[...hero.lineA, ...hero.lineB].join(" ")}
          </h1>
          <p
            aria-hidden
            className="flex justify-between whitespace-nowrap text-[15vw] font-medium leading-[0.86] tracking-[-0.055em] text-neutral-950 lg:block lg:text-[clamp(4.25rem,9.6vw,10.5rem)]"
          >
            <HeadlineLine text={hero.lineA[0]} className="lg:block" />
            <HeadlineLine text={hero.lineA[1]} className="lg:block" />
          </p>
          <span data-hero-fade className="invisible mt-16 hidden text-xs tracking-wide text-neutral-800 lg:block">
            {hero.tagLeft}
          </span>
          <p
            data-hero-fade
            className="invisible ml-[30%] mt-20 hidden max-w-60 text-sm leading-relaxed text-neutral-700 lg:block"
          >
            {hero.blurb}
          </p>
          <span
            data-hero-fade
            className="invisible mt-auto hidden whitespace-pre-line pb-10 text-sm leading-tight text-neutral-900 lg:block"
          >
            {hero.collection}
          </span>
        </div>

        {/* Centre photo */}
        <div className="relative order-last mt-8 h-[60svh] lg:order-none lg:mt-0 lg:h-auto">
          <div
            data-hero-photo
            className="invisible absolute inset-x-0 bottom-0 top-0 overflow-hidden lg:top-6"
            style={{ clipPath: "inset(100% 0% 0% 0%)" }}
          >
            <Image
              src={images.heroModel}
              alt={hero.imageAlt}
              fill
              preload
              sizes="(min-width: 1024px) 34vw, 100vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-canvas/60 to-transparent" />
          </div>
        </div>

        {/* Right column */}
        <div data-hero-right className="relative z-10 flex flex-col lg:items-end lg:pt-10">
          <span
            data-hero-fade
            className="invisible order-first mb-6 hidden whitespace-pre-line text-right text-xs tracking-wide text-neutral-800 lg:block"
          >
            {hero.tagRight}
          </span>
          <p
            aria-hidden
            className="flex justify-between whitespace-nowrap text-[15vw] font-medium leading-[0.86] tracking-[-0.055em] text-neutral-950 lg:block lg:text-[clamp(4.25rem,9.6vw,10.5rem)] lg:text-right"
          >
            <HeadlineLine text={hero.lineB[0]} className="lg:block lg:pr-[22%]" />
            <HeadlineLine text={hero.lineB[1]} className="lg:block" />
          </p>

          {/* Phones get one short line under the full headline; the longer
              blurb sits in the left column from lg up. */}
          <p data-hero-fade className="invisible mt-5 max-w-64 text-sm leading-relaxed text-neutral-700 lg:hidden">
            {hero.blurbShort}
          </p>

          {/* Avatars and the stat are desktop-only; from lg the children sit
              directly in the column. */}
          <div className="hidden lg:contents">
            <div className="flex items-center lg:mr-[22%] lg:mt-14">
              {[images.hoodieMono, images.hoodieBlack].map((src, i) => (
                <span
                  key={src}
                  data-hero-pop
                  className="relative -ml-3 size-12 overflow-hidden rounded-full border-2 border-canvas first:ml-0"
                  style={{ zIndex: i }}
                >
                  <Image src={src} alt="" fill sizes="48px" className="object-cover" />
                </span>
              ))}
              {/* GSAP pops the wrapper; the link keeps its own CSS hover
                  transition. Putting both on one element makes the CSS
                  transition fight GSAP and the button can stick at scale 0. */}
              <span data-hero-pop className="relative z-10 -ml-3">
                <Link
                  href="/shop"
                  aria-label="Shop the collection"
                  className="grid size-12 place-items-center rounded-full bg-brand text-white transition-transform duration-300 hover:rotate-90"
                >
                  <IconPlus className="size-5" stroke={1.75} />
                </Link>
              </span>
            </div>

            <span data-hero-pop className="mt-12 hidden lg:mr-[22%] lg:block">
              <Flower className="size-7" />
            </span>

            <div data-hero-fade className="invisible lg:mt-auto lg:mr-[3%] lg:pb-10">
              <p className="text-4xl font-medium tracking-tight text-neutral-950">
                <span data-hero-count>{hero.stat.value}</span>
                {hero.stat.suffix}
              </p>
              <p className="mt-1 text-[11px] tracking-wide text-neutral-700">
                {hero.stat.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
