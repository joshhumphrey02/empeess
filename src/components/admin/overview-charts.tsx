"use client";

import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

// Every chart here is one series at a time → no legend; the selected tab or
// card title names it. Colour is the validated brand token (--chart-1).

export type DailyPoint = { date: string; revenue: number; orders: number; customers: number };

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });

const plural = (v: number, one: string, many: string) => `${v} ${v === 1 ? one : many}`;
const METRICS = {
  revenue: { label: "Revenue", format: (v: number) => naira.format(v), tip: (v: number) => naira.format(v), axis: (v: number) => `₦${compact.format(v)}` },
  orders: { label: "Orders", format: (v: number) => String(v), tip: (v: number) => plural(v, "order", "orders"), axis: (v: number) => compact.format(v) },
  customers: {
    label: "New customers",
    format: (v: number) => String(v),
    tip: (v: number) => plural(v, "new customer", "new customers"),
    axis: (v: number) => compact.format(v),
  },
} as const;
type Metric = keyof typeof METRICS;
const RANGES = [7, 30, 90] as const;

const sum = (rows: DailyPoint[], m: Metric) => rows.reduce((n, r) => n + r[m], 0);
const change = (cur: number, prev: number) => (prev === 0 ? null : (cur - prev) / prev);

function Delta({ value, className }: { value: number | null; className?: string }) {
  if (value === null) return <span className={cn("text-xs text-muted-foreground", className)}>no prior data</span>;
  const up = value >= 0;
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        up ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}
      {(value * 100).toFixed(0)}%
    </span>
  );
}

// ─── KPI cards with sparklines ───────────────────────────────────────────────

export function KpiCard({
  label,
  value,
  kind = "count",
  delta,
  hint,
  series,
  seriesLabel,
  money,
  icon,
  index = 0,
}: {
  label: string;
  value: number;
  kind?: "count" | "money";
  delta?: number | null;
  hint?: string;
  series: { date: string; value: number }[];
  seriesLabel: string;
  /** Series values are naira (format as money in the tooltip). */
  money?: boolean;
  icon?: React.ReactNode;
  index?: number;
}) {
  const gradient = `spark-${useId().replace(/[^\w-]/g, "")}`;
  const config = { value: { label: seriesLabel, color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <Card
      size="sm" className="relative isolate animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both pb-0 duration-700"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <NumberTicker value={value} kind={kind} className="mt-1 block text-2xl font-semibold tracking-tight" />
        </div>
        {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand [&_svg]:size-[1.15rem]">{icon}</span>}
      </div>
      <div className="flex items-center gap-2 px-(--card-spacing) text-xs text-muted-foreground">
        {delta !== undefined && <Delta value={delta} />}
        {hint && <span className="truncate">{hint}</span>}
      </div>
      <ChartContainer config={config} className="aspect-auto h-16 w-full">
        <AreaChart data={series} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <ChartTooltip
            cursor={{ stroke: "var(--border)" }}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(_, p) => (p?.[0] ? day((p[0].payload as { date: string }).date) : "")}
                formatter={(v) => (money ? naira.format(Number(v)) : String(v))}
              />
            }
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            fill={`url(#${gradient})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            animationDuration={1200}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}

// ─── Sales chart: metric tabs × range ────────────────────────────────────────

export function SalesChart({ daily }: { daily: DailyPoint[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const tabsId = useId();
  const gradient = `sales-${tabsId.replace(/[^\w-]/g, "")}`;

  const current = daily.slice(-range);
  const previous = daily.slice(-2 * range, -range);
  const config = { [metric]: { label: METRICS[metric].label, color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 pb-4">
        <div>
          <h2 className="font-heading text-base font-medium">Performance</h2>
          <p className="text-sm text-muted-foreground">Pick a metric and a period. Hover the chart for each day.</p>
        </div>
        <div role="radiogroup" aria-label="Period" className="flex rounded-lg bg-muted p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={range === r}
              onClick={() => setRange(r)}
              className={cn("relative h-7 rounded-md px-3 text-xs font-medium transition-colors", range === r ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {range === r && (
                <motion.span layoutId={`range-${tabsId}`} className="absolute inset-0 rounded-md bg-background shadow-sm ring-1 ring-foreground/5" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">{r}d</span>
            </button>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label="Metric" className="grid grid-cols-3 border-b">
        {(Object.keys(METRICS) as Metric[]).map((m) => {
          const total = sum(current, m);
          const selected = metric === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setMetric(m)}
              className={cn(
                "relative flex flex-col gap-1 border-r px-4 py-3 text-left transition-colors last:border-r-0 hover:bg-muted/50",
                selected && "bg-brand-soft/40",
              )}
            >
              {selected && (
                <motion.span layoutId={`metric-${tabsId}`} className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className="text-xs text-muted-foreground">{METRICS[m].label}</span>
              <span className="text-lg font-semibold tabular-nums sm:text-xl">{METRICS[m].format(total)}</span>
              <Delta value={change(total, sum(previous, m))} className="self-start" />
            </button>
          );
        })}
      </div>

      <div className="px-2 pt-4 sm:px-4">
        <ChartContainer config={config} className="aspect-auto h-72 w-full">
          <AreaChart key={`${metric}-${range}`} data={current} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`var(--color-${metric})`} stopOpacity={0.3} />
                <stop offset="100%" stopColor={`var(--color-${metric})`} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={day} />
            <YAxis tickLine={false} axisLine={false} width={52} allowDecimals={false} tickFormatter={METRICS[metric].axis} />
            <ChartTooltip
              cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(_, p) => (p?.[0] ? day((p[0].payload as DailyPoint).date) : "")}
                  formatter={(v) => METRICS[metric].tip(Number(v))}
                />
              }
            />
            <Area
              dataKey={metric}
              type="monotone"
              stroke={`var(--color-${metric})`}
              strokeWidth={2}
              fill={`url(#${gradient})`}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              animationDuration={900}
            />
          </AreaChart>
        </ChartContainer>
        <details className="mt-2 px-2 pb-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View as table</summary>
          <div className="mt-2 max-h-56 overflow-auto rounded-lg border">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Day</th>
                  <th className="px-3 py-2 font-medium">Orders</th>
                  <th className="px-3 py-2 font-medium">New customers</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...current].reverse().map((d) => (
                  <tr key={d.date} className="border-t">
                    <td className="px-3 py-1.5">{day(d.date)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{d.orders}</td>
                    <td className="px-3 py-1.5 tabular-nums">{d.customers}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{naira.format(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

// ─── Orders by status: hover to focus, click to open the filtered list ───────

export function StatusBars({ data }: { data: { status: string; label: string; value: number }[] }) {
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const config = { value: { label: "Orders", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto w-full [&_.recharts-bar-rectangle]:cursor-pointer" style={{ height: Math.max(140, data.length * 34) }}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 32 }}
        barCategoryGap={8}
        onMouseLeave={() => setActive(null)}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={84} tick={{ fontSize: 12 }} />
        <ChartTooltip cursor={{ fill: "var(--muted)", radius: 6 }} content={<ChartTooltipContent hideIndicator formatter={(v) => `${v} orders · click to view`} />} />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          onMouseEnter={(_, i) => setActive(i)}
          onClick={(d) => router.push(`/admin/orders?status=${(d.payload as { status: string }).status}`)}
          label={{ position: "right", className: "fill-muted-foreground text-xs" }}
          animationDuration={900}
        >
          {data.map((d, i) => (
            <Cell key={d.status} fill="var(--color-value)" fillOpacity={active === null || active === i ? 1 : 0.35} className="transition-[fill-opacity] duration-200" />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ─── Top products: image rows with animated share bars ───────────────────────

export function TopProducts({ items }: { items: { name: string; units: number; revenue: number; image: string | null }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...items.map((i) => i.units));
  return (
    <ul className="-mx-2" onMouseLeave={() => setHovered(null)}>
      {items.map((p, i) => (
        <li key={p.name} className="relative" onMouseEnter={() => setHovered(i)}>
          <AnimatePresence>
            {hovered === i && (
              <motion.span
                layoutId={`top-${id}`}
                className="absolute inset-0 rounded-xl bg-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
          </AnimatePresence>
          <Link href={`/admin/products?q=${encodeURIComponent(p.name)}`} className="relative flex items-center gap-3 rounded-xl p-2">
            <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
              {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-cover" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{p.units} sold</span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="block h-full rounded-full bg-linear-to-r from-chart-2 to-chart-1"
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.units / max) * 100}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                />
              </span>
              <span className="mt-1 block text-xs tabular-nums text-muted-foreground">{formatMoney(p.revenue)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
