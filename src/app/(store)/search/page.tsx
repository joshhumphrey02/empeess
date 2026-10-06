import { IconSearch } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/store/page-heading";
import { ProductListing } from "@/components/store/product-listing";
import { listCategories } from "@/server/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q;
  const term = Array.isArray(q) ? q[0] : q;
  return { title: term ? `“${term}” — Search — EMPEESS` : "Search — EMPEESS" };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = raw?.trim() ?? "";

  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <PageHeading eyebrow="[Search]" title={q ? <>Results</> : "Search"} className="mb-8" />

      <form action="/search" method="get" role="search" className="mb-10">
        <label htmlFor="search-q" className="sr-only">
          Search products
        </label>
        <div className="flex items-center gap-3 border-b-2 border-neutral-950 pb-3">
          <IconSearch className="size-7 shrink-0 text-neutral-400" stroke={1.5} aria-hidden />
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            placeholder="Hoodies, joggers, a scent…"
            maxLength={100}
            className="min-w-0 flex-1 bg-transparent text-[clamp(1.5rem,3.5vw,2.75rem)] font-medium tracking-tight outline-none placeholder:text-neutral-300"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-neutral-950 px-6 text-xs font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
          >
            Search
          </button>
        </div>
      </form>

      {q ? (
        <ProductListing basePath="/search" params={params} showCategories={false} />
      ) : (
        <SearchSuggestions />
      )}
    </div>
  );
}

async function SearchSuggestions() {
  const categories = await listCategories();
  const popular = ["hoodie", "joggers", "jacket", "musk", "black"];
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <h2 className="text-xs uppercase tracking-wide text-neutral-500">Popular searches</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {popular.map((term) => (
            <li key={term}>
              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                className="inline-flex h-10 items-center rounded-full border border-neutral-200 px-4 text-sm hover:border-neutral-900"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xs uppercase tracking-wide text-neutral-500">Browse categories</h2>
        <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop/${c.slug}`} className="flex items-center justify-between py-4 text-2xl font-medium tracking-tight hover:pl-2 transition-[padding]">
                {c.name}
                <span className="text-sm font-normal text-neutral-400">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
