"use client";

import { IconArrowRight, IconSearch, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/format";

type Hit = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: { url: string; alt: string | null } | null;
  category: string | null;
};
type Results = { term: string; products: Hit[]; total: number };

const ease = [0.22, 1, 0.36, 1] as const;
const popular = ["hoodie", "joggers", "jacket", "musk", "black"];

/**
 * Search drops down over the page instead of living on its own route. Results
 * load as you type; Enter (or "See all") hands off to /shop?q=… as a plain GET
 * form, so it still works if the live results don't.
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && <Panel onClose={onClose} />}
    </AnimatePresence>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const term = value.trim();
  const searching = term.length >= 2;
  const current = searching && results?.term === term ? results : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data: Omit<Results, "term"> = await res.json();
        setResults({ term, ...data });
      } catch {
        // Aborted by the next keystroke, or offline: Enter still searches.
        if (!controller.signal.aborted) setResults({ term, products: [], total: -1 });
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const allHref = `/shop?q=${encodeURIComponent(term)}`;

  return (
    <motion.div
      key="search"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      data-lenis-prevent
      className="fixed inset-0 z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 cursor-default bg-neutral-950/30 backdrop-blur-sm" />
      <motion.div
        className="relative max-h-full overflow-y-auto bg-canvas shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
        initial={{ y: "-100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="mx-auto max-w-360 px-4 pb-10 pt-6 sm:px-8 sm:pt-8">
          <form action="/shop" method="get" role="search" className="flex items-center gap-3 border-b-2 border-neutral-950 pb-3">
            <IconSearch className="size-6 shrink-0 text-neutral-400" stroke={1.5} aria-hidden />
            <input
              name="q"
              type="search"
              aria-label="Search products"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder="Hoodies, joggers, a scent…"
              maxLength={100}
              className="min-w-0 flex-1 bg-transparent text-[clamp(1.25rem,3vw,2.25rem)] font-medium tracking-tight outline-none placeholder:text-neutral-300 [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-neutral-900 ring-1 ring-neutral-900/5 transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <IconX className="size-5" stroke={1.5} />
            </button>
          </form>

          <div className="mt-6" aria-live="polite">
            {!searching ? (
              <>
                <h2 className="text-xs uppercase tracking-wide text-neutral-500">Popular searches</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {popular.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => setValue(p)}
                        className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 text-sm hover:border-neutral-900"
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : !current ? (
              <p className="text-sm text-neutral-500">Searching…</p>
            ) : current.total < 0 ? (
              <p className="text-sm text-neutral-600">
                Couldn&apos;t load results.{" "}
                <Link href={allHref} onClick={onClose} className="underline underline-offset-4">
                  Search the shop instead
                </Link>
              </p>
            ) : current.products.length === 0 ? (
              <p className="text-sm text-neutral-600">
                Nothing matches “<span className="text-neutral-950">{term}</span>”. Try another word.
              </p>
            ) : (
              <>
                <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                  {current.products.map((p) => (
                    <li key={p.id} className="border-b border-neutral-200">
                      <Link href={`/product/${p.slug}`} onClick={onClose} className="group flex items-center gap-4 py-3">
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {p.image && (
                            <Image src={p.image.url} alt={p.image.alt ?? ""} fill sizes="64px" className="object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-neutral-950 group-hover:underline group-hover:underline-offset-4">
                            {p.name}
                          </span>
                          {p.category && <span className="block text-xs text-neutral-500">{p.category}</span>}
                        </span>
                        <span className="shrink-0 text-sm text-neutral-950">{formatMoney(p.price, p.currency)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={allHref}
                  onClick={onClose}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-6 text-xs font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
                >
                  See all {current.total} {current.total === 1 ? "result" : "results"}
                  <IconArrowRight className="size-4" stroke={1.5} />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
