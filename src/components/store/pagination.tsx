import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Page links that keep the other query params (filters, sort, search). */
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
}) {
  if (pageCount <= 1) return null;

  const href = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || v === undefined) continue;
      for (const item of Array.isArray(v) ? v : [v]) if (item) sp.append(k, item);
    }
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const btn =
    "grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} aria-label="Previous page" className={cn(btn, "border-neutral-900 hover:bg-neutral-900 hover:text-white")}>
          <IconArrowLeft className="size-4" stroke={1.5} />
        </Link>
      ) : (
        <span aria-hidden className={cn(btn, "border-neutral-200 text-neutral-300")}>
          <IconArrowLeft className="size-4" stroke={1.5} />
        </span>
      )}
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            btn,
            n === page ? "border-neutral-950 bg-neutral-950 text-white" : "border-transparent hover:border-neutral-300",
          )}
        >
          {n}
        </Link>
      ))}
      {page < pageCount ? (
        <Link href={href(page + 1)} aria-label="Next page" className={cn(btn, "border-neutral-900 hover:bg-neutral-900 hover:text-white")}>
          <IconArrowRight className="size-4" stroke={1.5} />
        </Link>
      ) : (
        <span aria-hidden className={cn(btn, "border-neutral-200 text-neutral-300")}>
          <IconArrowRight className="size-4" stroke={1.5} />
        </span>
      )}
    </nav>
  );
}
