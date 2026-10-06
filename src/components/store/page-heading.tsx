import { cn } from "@/lib/utils";

export function PageHeading({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">{eyebrow}</p>}
        <h1 className="mt-2 text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-neutral-950">
          {title}
        </h1>
        {description && <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-600">{description}</p>}
      </div>
      {children}
    </header>
  );
}
