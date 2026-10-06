import Link from "next/link";

import { PageHeading } from "./page-heading";

/** Layout for policy and help pages: heading, a side menu of the other pages, readable body. */
export function InfoPage({
  eyebrow,
  title,
  description,
  updated,
  current,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  updated?: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <PageHeading eyebrow={eyebrow} title={title} description={description} className="mb-12" />
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Help" className="h-fit lg:sticky lg:top-32">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={l.href === current ? "page" : undefined}
                  className="block rounded-full px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-canvas hover:text-neutral-950 aria-[current=page]:bg-neutral-950 aria-[current=page]:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-2xl space-y-10 text-[15px] leading-relaxed text-neutral-700 [&_a]:text-neutral-950 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-neutral-950 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5">
          {children}
          {updated && <p className="border-t border-neutral-200 pt-6 text-xs text-neutral-500">Last updated {updated}</p>}
        </article>
      </div>
    </div>
  );
}

const INFO_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/shipping", label: "Shipping & delivery" },
  { href: "/returns", label: "Returns & refunds" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms & conditions" },
  { href: "/privacy", label: "Privacy policy" },
];
