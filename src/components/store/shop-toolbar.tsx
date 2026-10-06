"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type Category = { name: string; slug: string; productCount: number };

/**
 * Category pills + sort/price/stock filters. It's a plain GET form, so it
 * works before hydration; with JS, any change submits immediately.
 */
export function ShopToolbar({
  action,
  categories,
  activeCategory,
  values,
  sorts,
  showCategories = true,
  hidden,
}: {
  action: string;
  categories: Category[];
  activeCategory?: string;
  values: { sort?: string; min?: string; max?: string; stock?: string; q?: string };
  sorts: Record<string, string>;
  showCategories?: boolean;
  /** Extra params to carry through (e.g. the search query). */
  hidden?: Record<string, string>;
}) {
  const submit = (e: React.ChangeEvent<HTMLElement>) =>
    (e.currentTarget as HTMLInputElement).form?.requestSubmit();

  return (
    <div className="flex flex-col gap-5 border-y border-neutral-200 py-5">
      {showCategories && (
        <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <ul className="flex w-max gap-2">
            <li>
              <Link
                href="/shop"
                aria-current={!activeCategory ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors",
                  !activeCategory
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 hover:border-neutral-900",
                )}
              >
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop/${c.slug}`}
                  aria-current={activeCategory === c.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors",
                    activeCategory === c.slug
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 hover:border-neutral-900",
                  )}
                >
                  {c.name}
                  <span className="text-xs opacity-60">{c.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <form action={action} method="get" className="flex flex-wrap items-end gap-3 text-sm">
        {hidden &&
          Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">Sort</span>
          <select
            name="sort"
            defaultValue={values.sort ?? "featured"}
            onChange={submit}
            className="h-10 rounded-full border border-neutral-200 bg-white px-4 pr-8 outline-none focus:border-neutral-900"
          >
            {Object.entries(sorts).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">Min ₦</span>
          <input
            type="number"
            name="min"
            min={0}
            step={1000}
            inputMode="numeric"
            defaultValue={values.min}
            placeholder="0"
            className="h-10 w-28 rounded-full border border-neutral-200 px-4 outline-none focus:border-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">Max ₦</span>
          <input
            type="number"
            name="max"
            min={0}
            step={1000}
            inputMode="numeric"
            defaultValue={values.max}
            placeholder="Any"
            className="h-10 w-28 rounded-full border border-neutral-200 px-4 outline-none focus:border-neutral-900"
          />
        </label>
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-4 has-checked:border-neutral-900">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={values.stock === "1"}
            onChange={submit}
            className="size-4 accent-neutral-950"
          />
          In stock only
        </label>
        <button
          type="submit"
          className="h-10 rounded-full bg-neutral-950 px-5 text-xs font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
        >
          Apply
        </button>
        {(values.min || values.max || values.stock || (values.sort && values.sort !== "featured")) && (
          <Link
            href={hidden?.q ? `${action}?q=${encodeURIComponent(hidden.q)}` : action}
            className="flex h-10 items-center px-2 text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline"
          >
            Clear filters
          </Link>
        )}
      </form>
    </div>
  );
}
