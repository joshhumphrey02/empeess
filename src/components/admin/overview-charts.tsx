"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// One series per chart → no legend; the card title names the series.
// Colour is the validated brand token (--chart-1) for light and dark.

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });

const revenueConfig = { revenue: { label: "Revenue", color: "var(--chart-1)" } } satisfies ChartConfig;

export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  return (
    <>
      <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={day} />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => `₦${compact.format(v)}`} />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                // "dot" renders the label as its own header row; with "line" the
                // custom formatter replaces the row that would carry it.
                indicator="dot"
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as { date: string; orders: number } | undefined;
                  return p ? `${day(p.date)} · ${p.orders} order${p.orders === 1 ? "" : "s"}` : "";
                }}
                formatter={(value) => naira.format(Number(value))}
              />
            }
          />
          <Area
            dataKey="revenue"
            type="monotone"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            fill="url(#fill-revenue)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--background)" }}
          />
        </AreaChart>
      </ChartContainer>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">View as table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Day</th>
                <th className="px-3 py-2 font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-t">
                  <td className="px-3 py-1.5">{day(d.date)}</td>
                  <td className="px-3 py-1.5">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{naira.format(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

const countConfig = { count: { label: "Orders", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Horizontal bars with a label column; used for status counts and top products. */
export function HorizontalBars({
  data,
  valueLabel,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  valueLabel: string;
  format?: (v: number) => string;
}) {
  const config = { value: { label: valueLabel, color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(120, data.length * 34) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={110}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent hideIndicator formatter={(v) => `${format(Number(v))} ${valueLabel.toLowerCase()}`} />} />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          label={{ position: "right", className: "fill-muted-foreground text-xs", formatter: (v: unknown) => format(Number(v)) }}
        />
      </BarChart>
    </ChartContainer>
  );
}

export { countConfig };
