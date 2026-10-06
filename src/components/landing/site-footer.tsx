"use client";

import {
  IconArrowRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandX,
  IconBrandYoutube,
} from "@tabler/icons-react";
import Link from "next/link";
import { useActionState, useRef } from "react";

import { initialFormState } from "@/app/actions/form-state";
import { subscribeNewsletter } from "@/app/actions/marketing";
import { BrandMark } from "@/components/brand";
import { Input } from "@/components/ui/input";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

import { footer, nav } from "./content";
import { BlurReveal } from "./primitives";

const socials = [
  { label: "Facebook", href: "#", Icon: IconBrandFacebook },
  { label: "Instagram", href: "#", Icon: IconBrandInstagram },
  { label: "X", href: "#", Icon: IconBrandX },
  { label: "YouTube", href: "#", Icon: IconBrandYoutube },
];

function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initialFormState);
  return (
    <form action={action} className="mt-10 max-w-sm">
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <div className="flex items-center gap-3 border-b border-dashed border-white/25 pb-3">
        <Input
          id="footer-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Join the newsletter"
          className="h-10 border-0 bg-transparent px-0 text-white placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent"
        />
        <button
          type="submit"
          aria-label="Subscribe"
          disabled={pending}
          className="group grid h-9 w-12 shrink-0 place-items-center rounded-full bg-white text-neutral-950 transition-transform hover:scale-105 disabled:opacity-60"
        >
          <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" stroke={1.75} />
        </button>
      </div>
      <p aria-live="polite" className={state.error ? "mt-3 min-h-4 text-xs text-red-300" : "mt-3 min-h-4 text-xs text-white/60"}>
        {state.error ?? state.message ?? "New drops and restocks, a few times a month. Unsubscribe any time."}
      </p>
    </form>
  );
}

export function SiteFooter() {
  const root = useRef<HTMLElement>(null);

  // Giant wordmark letters rise into place as the footer scrolls in.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create("[data-wordmark]", { type: "chars", mask: "chars" });
        gsap.from(split.chars, {
          yPercent: 110,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-wordmark]",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="overflow-hidden bg-ink text-white">
      <div className="mx-auto grid max-w-360 grid-cols-12 gap-x-4 gap-y-14 px-4 pt-20 sm:px-8 sm:pt-28">
        <div className="col-span-12 lg:col-span-6">
          <p className="text-xs tracking-wide text-white/50">{footer.eyebrow}</p>
          <h2 className="mt-3 text-[clamp(2.25rem,4vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.04em]">
            <TextGenerateEffect words={footer.headline[0]} />
            <br />
            <TextGenerateEffect words={footer.headline[1]} />
          </h2>
          <NewsletterForm />
        </div>

        <div className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-5 lg:col-start-8">
          {footer.contact.map((item, i) => (
            <BlurReveal key={item.label} delay={i * 0.06}>
              <p className="text-xs tracking-wide text-white/50">{item.label}</p>
              <p className="mt-2 text-sm text-white">{item.value}</p>
            </BlurReveal>
          ))}
        </div>

        <div className="col-span-12 flex flex-col justify-end gap-4 lg:col-span-6">
          <p className="text-sm">Follow us</p>
          <div className="flex gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-white/20 transition-colors hover:bg-white hover:text-neutral-950"
              >
                <Icon className="size-4" stroke={1.5} />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer" className="col-span-12 grid grid-cols-3 gap-6 lg:col-span-5 lg:col-start-8">
          {footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs tracking-wide text-white/50">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="relative text-sm after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-white after:transition-transform after:duration-500 hover:after:origin-left hover:after:scale-x-100"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-16 max-w-360 px-4 sm:px-8">
        <p
          data-wordmark
          aria-hidden
          className="font-logo whitespace-nowrap pb-4 text-[clamp(3rem,24vw,23rem)] font-semibold uppercase leading-none tracking-tight text-white sm:pb-6"
        >
          {nav.brand}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-white/20 py-6 text-xs text-white/50">
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
          </div>
          <p className="flex items-center gap-2">
            <BrandMark className="size-6" />© {new Date().getFullYear()} {nav.brand}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
