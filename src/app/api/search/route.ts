import { NextResponse, type NextRequest } from "next/server";

import { listProducts, parseProductQuery } from "@/server/catalog";

const LIMIT = 6;

// Live results for the header search overlay: the top few matches plus the
// total, so the overlay can link through to /shop?q=… for the rest.
export async function GET(request: NextRequest) {
  const { q } = parseProductQuery({ q: request.nextUrl.searchParams.get("q") ?? undefined });
  if (!q || q.length < 2) return NextResponse.json({ products: [], total: 0 });

  const { products, total } = await listProducts({ q });
  return NextResponse.json({
    total,
    products: products.slice(0, LIMIT).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      currency: p.currency,
      image: p.image,
      category: p.category?.name ?? null,
    })),
  });
}
