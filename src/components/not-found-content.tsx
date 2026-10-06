import { IconArrowLeft, IconSearch } from "@tabler/icons-react";
import Link from "next/link";

import { FadeUp, NotFoundHero } from "@/components/not-found-hero";
import { listCategories } from "@/server/catalog";

/**
 * The 404 body. `standalone` adds a minimal header for pages rendered under
 * the root layout only; inside the store layout the store header/footer
 * already frame it.
 */
export async function NotFoundContent({ standalone = false }: { standalone?: boolean }) {
  const categories = await listCategories().catch(() => []);

  return (
    <div className={standalone ? "flex min-h-svh flex-1 flex-col bg-canvas" : "flex flex-col"}>
      {standalone && (
        <header className="mx-auto flex w-full max-w-360 items-center justify-between px-4 py-6 sm:px-8">
          <Link href="/" className="font-logo text-2xl font-semibold uppercase tracking-tight text-neutral-950">
            Empeess
          </Link>
          <Link href="/shop" className="text-sm text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline">
            Shop all
          </Link>
        </header>
      )}

      <div className="mx-auto flex w-full max-w-360 flex-1 flex-col items-center justify-center px-4 pb-16 text-center sm:px-8">
        <h1 className="sr-only">404 — page not found</h1>
        <NotFoundHero />

        <FadeUp delay={0.5} className="mt-10 max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">[Error 404]</p>
          <p className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.035em] text-neutral-950">
            This page went out of stock.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            The link may be broken, or the piece has moved on. Search for it, or pick up where you left off.
          </p>
        </FadeUp>

        <FadeUp delay={0.65} className="mt-8 w-full max-w-md">
          <form action="/search" method="get" role="search" className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white p-1.5 focus-within:border-neutral-950">
            <label htmlFor="nf-search" className="sr-only">
              Search products
            </label>
            <IconSearch className="ml-3 size-5 shrink-0 text-neutral-400" stroke={1.5} aria-hidden />
            <input
              id="nf-search"
              name="q"
              type="search"
              placeholder="Hoodies, joggers, a scent…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
            <button type="submit" className="h-10 rounded-full bg-neutral-950 px-5 text-xs font-medium uppercase tracking-wide text-white hover:bg-neutral-800">
              Search
            </button>
          </form>
        </FadeUp>

        <FadeUp delay={0.8} className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-900 px-5 text-sm transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <IconArrowLeft className="size-4" stroke={1.5} /> Back home
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/${c.slug}`}
              className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm text-neutral-800 ring-1 ring-neutral-200 transition-colors hover:ring-neutral-900"
            >
              {c.name}
            </Link>
          ))}
        </FadeUp>
      </div>
    </div>
  );
}
