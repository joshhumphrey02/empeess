"use client";

import { IconCheck, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

/** "Added to cart" toast with the product, its option and quick links to the cart. */
export function showAddedToCart(item: { name: string; image: string | null; label: string; quantity: number; note?: string }) {
  toast.custom(
    (id) => (
      <div className="flex w-[min(92vw,380px)] gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-950 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <IconCheck className="size-3.5" aria-hidden /> Added to cart
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-neutral-500">
            {[item.label, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
          </p>
          {item.note && <p className="mt-1 text-xs text-amber-700">{item.note}</p>}
          <div className="mt-2.5 flex gap-2">
            <Link
              href="/cart"
              onClick={() => toast.dismiss(id)}
              className="inline-flex h-8 items-center rounded-full border border-neutral-900 px-3 text-xs font-medium hover:bg-neutral-900 hover:text-white"
            >
              View cart
            </Link>
            <Link
              href="/checkout"
              onClick={() => toast.dismiss(id)}
              className="inline-flex h-8 items-center rounded-full bg-brand px-3 text-xs font-medium text-white hover:opacity-90"
            >
              Checkout
            </Link>
          </div>
        </div>
        <button type="button" onClick={() => toast.dismiss(id)} aria-label="Dismiss" className="grid size-7 shrink-0 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950">
          <IconX className="size-4" />
        </button>
      </div>
    ),
    { duration: 6000 },
  );
}
