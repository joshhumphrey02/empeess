// Small building blocks shared by admin pages (server-renderable).
import { IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
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

/** Pill-style filter links (e.g. order status). */
export function FilterTabs({
  options,
  active,
  hrefFor,
}: {
  options: { value: string; label: string; count?: number }[];
  active: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <nav aria-label="Filter" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <Link
          key={o.value}
          href={hrefFor(o.value)}
          aria-current={o.value === active ? "page" : undefined}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
            o.value === active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="text-xs opacity-70">{o.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function AdminPagination({
  page,
  pageCount,
  total,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        {total} result{total === 1 ? "" : "s"}
      </span>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <span>
            Page {page} of {pageCount}
          </span>
          <Link
            href={hrefFor(page - 1)}
            aria-disabled={page <= 1}
            aria-label="Previous page"
            className={cn("grid size-8 place-items-center rounded-lg border", page <= 1 && "pointer-events-none opacity-40")}
          >
            <IconChevronLeft className="size-4" />
          </Link>
          <Link
            href={hrefFor(page + 1)}
            aria-disabled={page >= pageCount}
            aria-label="Next page"
            className={cn("grid size-8 place-items-center rounded-lg border", page >= pageCount && "pointer-events-none opacity-40")}
          >
            <IconChevronRight className="size-4" />
          </Link>
        </div>
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
  PAID: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300",
  PROCESSING: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300",
  SHIPPED: "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-300",
  DELIVERED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  DRAFT: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  ARCHIVED: "bg-muted text-muted-foreground",
  ADMIN: "bg-primary text-primary-foreground",
  CUSTOMER: "bg-muted text-muted-foreground",
};

/** Status pill — always shows the word, never colour alone. */
export function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("border-0 capitalize", ORDER_TONE[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
