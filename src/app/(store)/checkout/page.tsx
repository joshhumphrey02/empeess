import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/store/checkout-form";
import { PageHeading } from "@/components/store/page-heading";
import { formatMoney } from "@/lib/format";
import { db } from "@/prisma/db";
import { requireUser } from "@/server/auth/session";
import { getCart } from "@/server/cart";
import { paystackConfigured } from "@/server/paystack";

export const metadata: Metadata = { title: "Checkout — EMPEESS" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [cart, addresses] = await Promise.all([
    getCart(),
    db.orm.public.Address.where({ userId: user.id }).orderBy((a) => a.createdAt.asc()).all(),
  ]);
  if (cart.lines.length === 0) redirect("/cart");

  return (
    <div className="mx-auto max-w-360 px-4 sm:px-8">
      <PageHeading eyebrow="[Checkout]" title="Checkout" className="mb-10" />

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div>
          {!cart.canCheckout ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Some items in your cart need attention.{" "}
              <Link href="/cart" className="underline">
                Review your cart
              </Link>
              .
            </p>
          ) : (
            <CheckoutForm
              addresses={addresses}
              total={formatMoney(cart.total)}
              defaultName={user.name ?? undefined}
              paymentsReady={paystackConfigured()}
            />
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-canvas p-6 lg:sticky lg:top-32">
          <h2 className="text-xl font-medium tracking-tight">Your order</h2>
          <ul className="mt-6 space-y-4">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-3 text-sm">
                <div className="relative aspect-3/4 w-14 shrink-0 overflow-hidden bg-neutral-200">
                  {line.product.image && <Image src={line.product.image.url} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-neutral-950 text-[10px] text-white">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.product.name}</p>
                  <p className="text-neutral-500">{line.label}</p>
                </div>
                <p>{formatMoney(line.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-neutral-300 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatMoney(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Delivery</dt>
              <dd>{cart.shipping === 0 ? "Free" : formatMoney(cart.shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-medium">
              <dt>Total</dt>
              <dd>{formatMoney(cart.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
