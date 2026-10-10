"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type Category = { name: string; slug: string; productCount: number };

/**
 * Category, sort, price and stock filters on one row. It's a plain GET form,
 * so it works before hydration; with JS, any change submits immediately.
 */
export function ShopToolbar({
  action,
  categories,
  values,
  sorts,
  showCategories = true,
  hidden,
}: {
  action: string;
  categories: Category[];
  values: { category?: string; sort?: string; min?: string; max?: string; stock?: string; q?: string };
  sorts: Record<string, string>;
  showCategories?: boolean;
  /** Extra params to carry through (e.g. the search query). */
  hidden?: Record<string, string>;
}) {
  const submit = (e: React.ChangeEvent<HTMLElement>) =>
    (e.currentTarget as HTMLInputElement).form?.requestSubmit();

  const pill =
    "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 px-4 transition-colors hover:border-neutral-900 has-checked:border-neutral-950 has-checked:bg-neutral-950 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-neutral-950 has-focus-visible:ring-offset-2";
  const field =
    "h-10 shrink-0 rounded-full border border-neutral-200 px-4 outline-none focus:border-neutral-900";

  return (
    <form
      action={action}
      method="get"
      className="-mx-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-y border-neutral-200 px-4 py-5 text-sm [scrollbar-width:none] sm:mx-0 sm:px-0"
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {showCategories && (
        <>
          <div role="radiogroup" aria-label="Category" className="flex shrink-0 gap-2">
            <label className={pill}>
              <input
                type="radio"
                name="category"
                value=""
                defaultChecked={!values.category}
                onChange={submit}
                className="sr-only"
              />
              All
            </label>
            {categories.map((c) => (
              <label key={c.slug} className={pill}>
                <input
                  type="radio"
                  name="category"
                  value={c.slug}
                  defaultChecked={values.category === c.slug}
                  onChange={submit}
                  className="sr-only"
                />
                {c.name}
                <span className="text-xs opacity-60">{c.productCount}</span>
              </label>
            ))}
          </div>
          <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-neutral-200" />
        </>
      )}
      <select
        name="sort"
        aria-label="Sort"
        defaultValue={values.sort ?? "featured"}
        onChange={submit}
        className={cn(field, "bg-white pr-8")}
      >
        {Object.entries(sorts).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="min"
        aria-label="Minimum price in naira"
        min={0}
        step={1000}
        inputMode="numeric"
        defaultValue={values.min}
        placeholder="Min ₦"
        className={cn(field, "w-24")}
      />
      <input
        type="number"
        name="max"
        aria-label="Maximum price in naira"
        min={0}
        step={1000}
        inputMode="numeric"
        defaultValue={values.max}
        placeholder="Max ₦"
        className={cn(field, "w-24")}
      />
      <label className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-4 has-checked:border-neutral-900">
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
        className="h-10 shrink-0 rounded-full bg-neutral-950 px-5 text-xs font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
      >
        Apply
      </button>
      {(values.category || values.min || values.max || values.stock || (values.sort && values.sort !== "featured")) && (
        <Link
          href={hidden?.q ? `${action}?q=${encodeURIComponent(hidden.q)}` : action}
          className="flex h-10 shrink-0 items-center px-2 text-neutral-500 underline-offset-4 hover:text-neutral-950 hover:underline"
        >
          Clear filters
        </Link>
      )}
    </form>
  );
}
