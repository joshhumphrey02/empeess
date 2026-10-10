// Small building blocks shared by admin pages (server-renderable).
import { IconArrowsSort, IconChevronLeft, IconChevronRight, IconSearch, IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { FilterPills } from "./kit-client";

export { ClearFilters, SelectFilter, StatCards, type StatItem } from "./kit-client";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
      <div>
        <h1 className="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** GET search form that keeps other filters as hidden inputs. */
export function SearchBox({
  action,
  placeholder,
  q,
  keep = {},
}: {
  action: string;
  placeholder: string;
  q?: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} method="get" role="search" className="relative w-full sm:w-72">
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </form>
  );
}

/** Pill-style filter links (e.g. order status); the active pill slides between options. */
export function FilterTabs({
  options,
  active,
  hrefFor,
}: {
  options: { value: string; label: string; count?: number }[];
  active: string;
  hrefFor: (value: string) => string;
}) {
  return <FilterPills active={active} options={options.map((o) => ({ ...o, href: hrefFor(o.value) }))} />;
}

/**
 * Sortable column header. `sort` is the current key ("name" ascending,
 * "-name" descending); clicking cycles to the other direction.
 */
export function SortHeader({
  label,
  field,
  sort,
  defaultSort,
  hrefFor,
  className,
}: {
  label: string;
  field: string;
  sort: string | undefined;
  /** The list's implicit order when `sort` is empty. */
  defaultSort: string;
  hrefFor: (sort: string) => string;
  className?: string;
}) {
  const current = sort || defaultSort;
  const active = current.replace(/^-/, "") === field;
  const desc = current.startsWith("-");
  const next = active && !desc ? `-${field}` : field;
  const Icon = !active ? IconArrowsSort : desc ? IconSortDescending : IconSortAscending;
  return (
    <TableHead aria-sort={active ? (desc ? "descending" : "ascending") : undefined} className={className}>
      <Link
        href={hrefFor(next === defaultSort ? "" : next)}
        className={cn(
          "group/sort inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground",
          active && "text-foreground",
          className?.includes("text-right") && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3.5 transition-opacity", active ? "text-brand" : "opacity-0 group-hover/sort:opacity-60")} aria-hidden />
      </Link>
    </TableHead>
  );
}

/** Staggered fade-in for table rows and list items (first 16 animate, the rest appear at once). */
export function rowEnter(i: number) {
  return {
    className: "animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-500",
    style: { animationDelay: `${Math.min(i, 16) * 30}ms` },
  };
}

/** Page numbers to show: first, last, and a window around the current page, with gaps as null. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1]! > 1 ? [null, n] : [n]));
}

export function AdminPagination({
  page,
  pageCount,
  total,
  hrefFor,
  pageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  hrefFor: (page: number) => string;
  /** When given, the summary reads "26–50 of 78" instead of "78 results". */
  pageSize?: number;
}) {
  const from = pageSize ? (page - 1) * pageSize + 1 : 0;
  const to = pageSize ? Math.min(total, page * pageSize) : 0;
  const arrow = "grid size-8 place-items-center rounded-lg border transition-colors hover:bg-muted";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        {pageSize && total > 0 ? (
          <>
            <span className="font-medium text-foreground tabular-nums">
              {from}–{to}
            </span>{" "}
            of <span className="tabular-nums">{total}</span>
          </>
        ) : (
          <>
            {total} result{total === 1 ? "" : "s"}
          </>
        )}
      </span>
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Link
            href={hrefFor(page - 1)}
            aria-disabled={page <= 1}
            aria-label="Previous page"
            className={cn(arrow, page <= 1 && "pointer-events-none opacity-40")}
          >
            <IconChevronLeft className="size-4" />
          </Link>
          {pageWindow(page, pageCount).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} className="px-1" aria-hidden>
                …
              </span>
            ) : (
              <Link
                key={n}
                href={hrefFor(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-lg px-2 tabular-nums transition-colors",
                  n === page ? "bg-primary font-medium text-primary-foreground" : "hover:bg-muted hover:text-foreground",
                )}
              >
                {n}
              </Link>
            ),
          )}
          <Link
            href={hrefFor(page + 1)}
            aria-disabled={page >= pageCount}
            aria-label="Next page"
            className={cn(arrow, page >= pageCount && "pointer-events-none opacity-40")}
          >
            <IconChevronRight className="size-4" />
          </Link>
        </nav>
      )}
    </div>
  );
}

/** Build `path?a=1&b=2` dropping empty values. */
export function withQuery(path: string, params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

const ORDER_TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  PAID: "bg-brand-soft text-brand",
  PROCESSING: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300",
  SHIPPED: "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-300",
  DELIVERED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  DRAFT: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  ARCHIVED: "bg-muted text-muted-foreground",
  ADMIN: "bg-brand-soft text-brand",
  STAFF: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300",
  BANNED: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-300",
  INVITED: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  CUSTOMER: "bg-muted text-muted-foreground",
};

/** Status pill: always shows the word, never colour alone. */
export function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 border-0 capitalize", ORDER_TONE[status])}>
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current", status === "PENDING" && "animate-pulse")} />
      {status.toLowerCase()}
    </Badge>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 overflow-hidden px-6 py-16 text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)] bg-size-[16px_16px]"
      />
      <span aria-hidden className="relative mb-1 grid size-12 place-items-center rounded-2xl bg-brand-soft ring-8 ring-brand-soft/40">
        <span className="size-2.5 animate-pulse rounded-full bg-brand" />
      </span>
      <p className="relative font-medium">{title}</p>
      {children && <div className="relative text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
