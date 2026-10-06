import { IconMinus, IconPlus, IconX } from "@tabler/icons-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { removeCartLine, updateCartLine } from "@/app/actions/cart";
import { PageHeading } from "@/components/store/page-heading";
import { formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, MAX_QTY_PER_LINE } from "@/lib/store-config";
import { getCart } from "@/server/cart";

export const metadata: Metadata = { title: "Cart — EMPEESS" };

export default async function CartPage() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-360 px-4 sm:px-8">
        <PageHeading eyebrow="[Cart]" title="Your cart is empty" description="Find something you love and it'll wait for you here." />
        <Link
          href="/shop"
          className="mt-10 inline-flex h-12 items-center rounded-full bg-neutral-950 px-6 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  const toFree = FREE_SHIPPING_THRESHOLD - cart.subtotal;

  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <PageHeading eyebrow="[Cart]" title="Your cart" description={`${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`} className="mb-10" />

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-6 sm:gap-6">
              <Link
                href={`/product/${line.product.slug}`}
                className="chamfer-tr relative aspect-3/4 w-24 shrink-0 overflow-hidden bg-neutral-100 sm:w-32"
                style={{ ["--cut" as string]: "18%" }}
              >
                {line.product.image && (
                  <Image src={line.product.image.url} alt={line.product.name} fill sizes="128px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/product/${line.product.slug}`} className="text-lg font-medium tracking-tight hover:underline">
                      {line.product.name}
                    </Link>
                    {line.label && <p className="text-sm text-neutral-500">{line.label}</p>}
                    <p className="mt-1 text-sm text-neutral-500">{formatMoney(line.unitPrice)} each</p>
                  </div>
                  <form action={removeCartLine}>
                    <input type="hidden" name="itemId" value={line.id} />
                    <button
                      type="submit"
                      aria-label={`Remove ${line.product.name}`}
                      className="grid size-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                    >
                      <IconX className="size-4" />
                    </button>
                  </form>
                </div>

                {line.problem && (
                  <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                    {line.problem === "unavailable"
                      ? "This option is no longer available. Remove it to continue."
                      : `Only ${line.available} left — reduce the quantity to continue.`}
                  </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-4 pt-4">
                  <div className="flex h-10 items-center rounded-full border border-neutral-200">
                    <form action={updateCartLine}>
                      <input type="hidden" name="itemId" value={line.id} />
                      <input type="hidden" name="quantity" value={line.quantity - 1} />
                      <button type="submit" aria-label="Decrease quantity" className="grid size-10 place-items-center rounded-full">
                        <IconMinus className="size-4" />
                      </button>
                    </form>
                    <span className="w-8 text-center text-sm tabular-nums" aria-label="Quantity">
                      {line.quantity}
                    </span>
                    <form action={updateCartLine}>
                      <input type="hidden" name="itemId" value={line.id} />
                      <input type="hidden" name="quantity" value={line.quantity + 1} />
                      <button
                        type="submit"
                        aria-label="Increase quantity"
                        disabled={line.quantity >= Math.min(line.available, MAX_QTY_PER_LINE)}
                        className="grid size-10 place-items-center rounded-full disabled:text-neutral-300"
                      >
                        <IconPlus className="size-4" />
                      </button>
                    </form>
                  </div>
                  <p className="text-lg font-medium">{formatMoney(line.lineTotal)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-canvas p-6 lg:sticky lg:top-32">
          <h2 className="text-xl font-medium tracking-tight">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatMoney(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Delivery</dt>
              <dd>{cart.shipping === 0 ? "Free" : formatMoney(cart.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatMoney(cart.total)}</dd>
            </div>
          </dl>
          {toFree > 0 && (
            <p className="mt-4 text-xs text-neutral-600">
              Add {formatMoney(toFree)} more for free delivery.
            </p>
          )}
          {cart.canCheckout ? (
            <Link
              href="/checkout"
              className="mt-6 flex h-12 items-center justify-center rounded-full bg-neutral-950 text-sm font-medium uppercase tracking-wide text-white hover:bg-neutral-800"
            >
              Checkout
            </Link>
          ) : (
            <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-neutral-700">
              Fix the highlighted items to continue to checkout.
            </p>
          )}
          <Link href="/shop" className="mt-4 block text-center text-sm text-neutral-600 underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
