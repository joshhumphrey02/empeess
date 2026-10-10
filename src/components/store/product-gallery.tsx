"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
  overlay,
}: {
  images: { id: string; url: string; alt: string | null }[];
  name: string;
  /** Pinned to the top-right of the main image (the wishlist heart). */
  overlay?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-3 md:flex-col" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-3/4 w-20 overflow-hidden bg-neutral-100 ring-offset-2 transition",
                  i === active ? "ring-2 ring-neutral-950" : "opacity-60 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        className="chamfer relative aspect-3/4 flex-1 overflow-hidden bg-neutral-100"
        style={{ ["--cut" as string]: "10%" }}
      >
        <AnimatePresence initial={false}>
          {current && (
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={current.url}
                alt={current.alt ?? name}
                fill
                preload={active === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
        {overlay && <div className="absolute right-4 top-4 z-10">{overlay}</div>}
      </div>
    </div>
  );
}
