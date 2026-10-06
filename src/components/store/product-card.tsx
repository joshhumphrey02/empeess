import Image from "next/image";
import Link from "next/link";

import { formatMoney } from "@/lib/format";
import type { ProductCardData } from "@/server/catalog";

export function ProductCard({ product, preload = false }: { product: ProductCardData; preload?: boolean }) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div
        className="chamfer relative aspect-3/4 overflow-hidden bg-neutral-100"
        style={{ ["--cut" as string]: "12%" }}
      >
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            fill
            preload={preload}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        )}
        {product.hoverImage && (
          <Image
            src={product.hoverImage.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!product.inStock && (
            <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
              Sold out
            </span>
          )}
          {product.inStock && onSale && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
              Sale
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.category && (
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">{product.category.name}</p>
          )}
          <h3 className="truncate text-base font-medium tracking-tight text-neutral-950 underline-offset-4 group-hover:underline">
            {product.name}
          </h3>
        </div>
        <p className="shrink-0 text-right text-sm font-medium text-neutral-950">
          {formatMoney(product.price, product.currency)}
          {onSale && (
            <span className="block text-xs font-normal text-neutral-400 line-through">
              {formatMoney(product.compareAtPrice!, product.currency)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  empty,
}: {
  products: ProductCardData[];
  empty?: React.ReactNode;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 px-6 py-20 text-center">
        {empty ?? <p className="text-neutral-600">No products match these filters.</p>}
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} preload={i < 4} />
        </li>
      ))}
    </ul>
  );
}
