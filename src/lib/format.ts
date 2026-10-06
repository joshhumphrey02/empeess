// Formatting helpers shared by server and client components.

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Money is stored in kobo; render it as whole naira, e.g. ₦45,000. */
export function formatMoney(kobo: number, currency = "NGN") {
  if (currency !== "NGN") {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(kobo / 100);
  }
  return ngn.format(kobo / 100);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Black / M", "100ml" — human label for a variant. */
export function variantLabel(v: { color: string | null; size: string | null; volumeMl: number | null }) {
  return [v.color, v.size, v.volumeMl ? `${v.volumeMl}ml` : null].filter(Boolean).join(" / ");
}
