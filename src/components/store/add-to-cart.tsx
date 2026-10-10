"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { addToCart } from "@/app/actions/cart";
import { initialFormState } from "@/app/actions/form-state";
import { formatMoney } from "@/lib/format";
import { MAX_QTY_PER_LINE } from "@/lib/store-config";
import { cn } from "@/lib/utils";

import { showAddedToCart } from "./cart-toast";
import { SubmitButton } from "./form-bits";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  volumeMl: number | null;
  price: number | null;
  stock: number;
};

const DIMENSIONS = [
  { key: "color", label: "Colour" },
  { key: "size", label: "Size" },
  { key: "volumeMl", label: "Size" },
] as const;
type DimKey = (typeof DIMENSIONS)[number]["key"];

const display = (key: DimKey, value: string | number) => (key === "volumeMl" ? `${value}ml` : String(value));

export function AddToCart({
  wishlist,
  product,
  variants,
  basePrice,
  compareAtPrice,
  currency,
}: {
  /** Rendered beside the add button (the wishlist heart). */
  wishlist?: React.ReactNode;
  product: { name: string; image: string | null };
  variants: Variant[];
  basePrice: number;
  compareAtPrice: number | null;
  currency: string;
}) {
  const [state, action] = useActionState(addToCart, initialFormState);
  const [quantity, setQuantity] = useState(1);

  // Only dimensions this product actually varies on (or has at all).
  const dims = useMemo(
    () =>
      DIMENSIONS.map((d) => ({
        ...d,
        values: [...new Set(variants.map((v) => v[d.key]).filter((v): v is string | number => v !== null))],
      })).filter((d) => d.values.length > 0),
    [variants],
  );

  // Default to the first in-stock variant.
  const initial = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selected, setSelected] = useState<Partial<Record<DimKey, string | number>>>(() =>
    Object.fromEntries(dims.map((d) => [d.key, initial?.[d.key] ?? d.values[0]])),
  );

  const variant = variants.find((v) => dims.every((d) => v[d.key] === selected[d.key])) ?? null;
  const label = dims.map((d) => (selected[d.key] !== undefined ? display(d.key, selected[d.key]!) : "")).filter(Boolean).join(" / ");

  // Each submit returns a fresh state object: announce it as a toast, not inline text.
  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok) {
      showAddedToCart({
        name: product.name,
        image: product.image,
        label,
        quantity: Number(state.fields?.quantity ?? 1),
        note: state.message?.startsWith("Added: ") ? state.message.replace("Added: ", "") : undefined,
      });
    }
    // Only react to a new action result, not to option changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const price = variant?.price ?? basePrice;
  const soldOut = !variant || variant.stock <= 0;
  const maxQty = Math.max(1, Math.min(variant?.stock ?? 1, MAX_QTY_PER_LINE));

  // Is this option buyable given the other current selections?
  const available = (key: DimKey, value: string | number) =>
    variants.some(
      (v) => v[key] === value && v.stock > 0 && dims.every((d) => d.key === key || v[d.key] === selected[d.key]),
    );

  return (
    <form action={action} className="space-y-7">
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-medium tracking-tight text-neutral-950">{formatMoney(price, currency)}</p>
        {compareAtPrice !== null && compareAtPrice > price && (
          <p className="text-lg text-neutral-400 line-through">{formatMoney(compareAtPrice, currency)}</p>
        )}
      </div>

      {dims.map((d) => (
        <fieldset key={d.key}>
          <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-600">
            {d.label}: <span className="text-neutral-950">{selected[d.key] !== undefined ? display(d.key, selected[d.key]!) : "-"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {d.values.map((value) => {
              const isSelected = selected[d.key] === value;
              const ok = available(d.key, value);
              return (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelected((s) => ({ ...s, [d.key]: value }));
                    setQuantity(1);
                  }}
                  className={cn(
                    "h-11 min-w-12 rounded-full border px-4 text-sm transition-colors",
                    isSelected ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-900",
                    !ok && !isSelected && "text-neutral-400 line-through decoration-neutral-300",
                  )}
                >
                  {display(d.key, value)}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <input type="hidden" name="quantity" value={quantity} />

      <p className={cn("text-sm", soldOut ? "text-red-600" : variant && variant.stock <= 5 ? "text-brand" : "text-neutral-500")}>
        {soldOut ? "Sold out in this option." : variant && variant.stock <= 5 ? `Only ${variant.stock} left.` : "In stock, ready to ship."}
      </p>

      <div className="flex gap-3">
        <div className="flex h-12 items-center rounded-full border border-neutral-200">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="grid size-12 place-items-center rounded-full disabled:text-neutral-300"
          >
            <IconMinus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite" aria-label="Quantity">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={soldOut || quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="grid size-12 place-items-center rounded-full disabled:text-neutral-300"
          >
            <IconPlus className="size-4" />
          </button>
        </div>
        <SubmitButton disabled={soldOut} className="flex-1">
          {soldOut ? "Sold out" : "Add to cart"}
        </SubmitButton>
        {wishlist}
      </div>

    </form>
  );
}
