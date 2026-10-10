"use client";

import { IconArrowRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { collections as defaults } from "./content";
import { BlurReveal, PillLink } from "./primitives";

const ease = [0.22, 1, 0.36, 1] as const;

export function Collections({ content: collections = defaults }: { content?: typeof defaults }) {
  const [open, setOpen] = useState(0);
  const current = collections.items[open];

  return (
    <section aria-labelledby="collections-heading" className="bg-white py-24 sm:py-32">
      <h2 id="collections-heading" className="sr-only">
        Collections
      </h2>
      <div className="mx-auto grid max-w-360 grid-cols-12 gap-x-4 gap-y-12 px-4 sm:px-8">
        {/* Feature photo */}
        <div className="col-span-12 lg:col-span-5">
          <BlurReveal as="p" className="max-w-sm text-sm leading-relaxed text-neutral-700 indent-[22%]">
            {collections.intro}
          </BlurReveal>
          <div
            className="chamfer relative mt-5 aspect-[5/4.4] overflow-hidden bg-neutral-100"
            style={{ ["--cut" as string]: "16%" }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={current.src}
                className="absolute inset-0"
                initial={{ clipPath: "inset(0% 0% 0% 100%)", scale: 1.12 }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                exit={{ opacity: 0.5 }}
                transition={{ duration: 1, ease }}
              >
                <Image
                  src={current.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            <span aria-hidden className="absolute inset-x-0 top-[72%] h-2 bg-white" />
          </div>
          <p className="mt-6 text-sm text-neutral-900">{collections.outro}</p>
        </div>

        {/* Accordion */}
        <ul className="col-span-12 self-center lg:col-span-6 lg:col-start-7">
          {collections.items.map((item, i) => {
            const isOpen = i === open;
            return (
              <li key={item.title} className="border-t border-neutral-200 last:border-b">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(i)}
                  className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                >
                  <span className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-medium tracking-[-0.035em] text-neutral-950 transition-transform duration-500 group-hover:translate-x-2">
                    {item.title}
                  </span>
                  <motion.span
                    className={cn(
                      "grid h-10 w-12 shrink-0 place-items-center rounded-full border border-neutral-900 transition-colors",
                      !isOpen && "group-hover:bg-neutral-900 group-hover:text-white",
                    )}
                    animate={{ opacity: isOpen ? 0 : 1, rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.4, ease }}
                  >
                    <IconArrowRight className="size-4" stroke={1.5} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease }}
                      className="overflow-hidden"
                    >
                      <div className="-mt-3 flex items-end justify-between gap-6 pb-8">
                        <div className="max-w-64">
                          <p className="text-sm leading-relaxed text-neutral-600">{item.copy}</p>
                          <PillLink href={item.href} className="mt-6">
                            Shop now
                          </PillLink>
                        </div>
                        <motion.div
                          className="chamfer-tr relative aspect-square w-32 shrink-0 overflow-hidden sm:w-40"
                          style={{ ["--cut" as string]: "20%" }}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.7, ease, delay: 0.1 }}
                        >
                          <Image src={item.thumb} alt="" fill sizes="160px" className="object-cover" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
