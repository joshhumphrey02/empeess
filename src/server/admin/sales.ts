import "server-only";

import { and, or } from "@prisma/orm-postgres/orm-client";

import { db } from "@/prisma/db";

import { AdminInputError } from "./catalog-admin";

const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
export const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Which status an order may move to next. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function adminListOrders(opts: { q?: string; status?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const size = 25;
  const filtered = () => {
    let orders = db.orm.public.Order.where((o) => o.id.isNotNull());
    if (opts.q) {
      const term = likeTerm(opts.q);
      orders = orders.where((o) =>
        or(o.orderNumber.ilike(term), o.shippingFullName.ilike(term), o.user.some((u) => u.email.ilike(term))),
      );
    }
    if (opts.status && (ORDER_STATUSES as readonly string[]).includes(opts.status)) {
      const status = opts.status as OrderStatus;
      orders = orders.where((o) => o.status.eq(status));
    }
    return orders;
  };
  const [orders, { count }] = await Promise.all([
    filtered()
      .orderBy([(o) => o.createdAt.desc(), (o) => o.id.desc()])
      .include("user", (u) => u.select("email", "name"))
      .include("items", (i) => i.sum("quantity"))
      .limit(size)
      .offset((page - 1) * size)
      .all(),
    filtered().aggregate((a) => ({ count: a.count() })),
  ]);
  return { orders, total: count, page, pageCount: Math.max(1, Math.ceil(count / size)) };
}

export async function adminGetOrder(orderNumber: string) {
  return db.orm.public.Order.where({ orderNumber })
    .include("items", (i) => i.orderBy((x) => x.id.asc()))
    .include("user", (u) => u.select("id", "email", "name"))
    .first();
}

export async function updateOrderStatus(orderNumber: string, next: OrderStatus) {
  await db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.where({ orderNumber })
      .include("items", (i) => i.select("variantId", "quantity"))
      .first();
    if (!order) throw new AdminInputError("Order not found.");
    if (!NEXT_STATUSES[order.status].includes(next)) {
      throw new AdminInputError(`Can't move an order from ${order.status.toLowerCase()} to ${next.toLowerCase()}.`);
    }
    const now = new Date().toISOString();
    const stamps =
      next === "PAID" ? { paidAt: now }
      : next === "SHIPPED" ? { shippedAt: now }
      : next === "DELIVERED" ? { deliveredAt: now }
      : next === "CANCELLED" ? { cancelledAt: now }
      : {};
    // Compare-and-set on the old status so two admins can't race each other.
    const updated = await tx.orm.public.Order.where({ id: order.id, status: order.status }).update({ status: next, ...stamps });
    if (!updated) throw new AdminInputError("Someone else just updated this order. Refresh and try again.");

    if (next === "CANCELLED") {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const v = await tx.orm.public.ProductVariant.where({ id: item.variantId }).select("stock").first();
        if (v) await tx.orm.public.ProductVariant.where({ id: item.variantId }).update({ stock: v.stock + item.quantity });
      }
    }
  });
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function adminListCustomers(opts: { q?: string; role?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const size = 25;
  const filtered = () => {
    let users = db.orm.public.User.where((u) => u.id.isNotNull());
    if (opts.q) {
      const term = likeTerm(opts.q);
      users = users.where((u) => or(u.email.ilike(term), u.name.ilike(term)));
    }
    if (opts.role === "ADMIN" || opts.role === "CUSTOMER") {
      const role = opts.role;
      users = users.where((u) => u.role.eq(role));
    }
    return users;
  };
  const [users, { count }] = await Promise.all([
    filtered()
      .orderBy([(u) => u.createdAt.desc(), (u) => u.id.desc()])
      .include("orders", (o) =>
        o.combine({
          count: o.count(),
          spent: o.where((x) => and(x.status.neq("CANCELLED"), x.status.neq("REFUNDED"))).sum("total"),
        }),
      )
      .include("accounts", (a) => a.select("provider"))
      .limit(size)
      .offset((page - 1) * size)
      .all(),
    filtered().aggregate((a) => ({ count: a.count() })),
  ]);
  return { users, total: count, page, pageCount: Math.max(1, Math.ceil(count / size)) };
}

export async function adminGetCustomer(id: string) {
  return db.orm.public.User.where({ id })
    .include("orders", (o) => o.orderBy((x) => x.createdAt.desc()).include("items", (i) => i.sum("quantity")))
    .include("addresses", (a) => a.orderBy((x) => x.createdAt.asc()))
    .include("accounts", (a) => a.select("provider"))
    .include("reviews", (r) => r.count())
    .first();
}

export async function setCustomerRole(id: string, role: "ADMIN" | "CUSTOMER", actingUserId: string) {
  if (id === actingUserId && role !== "ADMIN") throw new AdminInputError("You can't remove your own admin access.");
  await db.orm.public.User.where({ id }).update({ role });
}

// ─── Overview ────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const countsAsSale = (status: string) => status !== "CANCELLED" && status !== "REFUNDED";

export async function overviewStats(days = 30) {
  const now = Date.now();
  const since = new Date(now - 2 * days * DAY).toISOString();
  const [orders, byStatus, customers, newCustomers, items, lowStock, recent] = await Promise.all([
    db.orm.public.Order.where((o) => o.createdAt.gte(since)).select("createdAt", "total", "status").all(),
    db.orm.public.Order.groupBy("status").aggregate((a) => ({ count: a.count() })),
    db.orm.public.User.where({ role: "CUSTOMER" }).aggregate((a) => ({ count: a.count() })),
    db.orm.public.User.where({ role: "CUSTOMER" })
      .where((u) => u.createdAt.gte(new Date(now - days * DAY).toISOString()))
      .aggregate((a) => ({ count: a.count() })),
    db.orm.public.OrderItem.where((i) => i.order.some((o) => and(o.status.neq("CANCELLED"), o.status.neq("REFUNDED"), o.createdAt.gte(new Date(now - days * DAY).toISOString()))))
      .select("productName", "quantity", "lineTotal")
      .all(),
    db.orm.public.ProductVariant.where((v) => and(v.isActive.eq(true), v.stock.lte(5)))
      .orderBy([(v) => v.stock.asc(), (v) => v.sku.asc()])
      .include("product", (p) => p.select("id", "name"))
      .limit(8)
      .all(),
    db.orm.public.Order.orderBy((o) => o.createdAt.desc())
      .include("user", (u) => u.select("email", "name"))
      .limit(6)
      .all(),
  ]);

  const start = now - days * DAY;
  const current = orders.filter((o) => new Date(o.createdAt).getTime() >= start);
  const previous = orders.filter((o) => new Date(o.createdAt).getTime() < start);
  const revenue = (list: typeof orders) => list.filter((o) => countsAsSale(o.status)).reduce((n, o) => n + o.total, 0);
  const paidCount = (list: typeof orders) => list.filter((o) => countsAsSale(o.status)).length;

  // Daily revenue for the chart, oldest first, every day present (zero-filled).
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + (i + 1) * DAY);
    return { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 };
  });
  const index = new Map(daily.map((d, i) => [d.date, i]));
  for (const o of current) {
    // Postgres returns "2026-10-06 00:57:14+01"; normalise to a UTC day key.
    const i = index.get(new Date(o.createdAt).toISOString().slice(0, 10));
    if (i === undefined || !countsAsSale(o.status)) continue;
    daily[i]!.revenue += o.total / 100;
    daily[i]!.orders += 1;
  }

  const top = new Map<string, { name: string; units: number; revenue: number }>();
  for (const it of items) {
    const row = top.get(it.productName) ?? { name: it.productName, units: 0, revenue: 0 };
    row.units += it.quantity;
    row.revenue += it.lineTotal;
    top.set(it.productName, row);
  }

  const cur = { revenue: revenue(current), orders: paidCount(current) };
  const prev = { revenue: revenue(previous), orders: paidCount(previous) };
  const change = (a: number, b: number) => (b === 0 ? null : (a - b) / b);

  return {
    days,
    revenue: cur.revenue,
    revenueChange: change(cur.revenue, prev.revenue),
    orders: cur.orders,
    ordersChange: change(cur.orders, prev.orders),
    aov: cur.orders ? Math.round(cur.revenue / cur.orders) : 0,
    customers: customers.count,
    newCustomers: newCustomers.count,
    daily,
    byStatus: ORDER_STATUSES.map((status) => ({
      status,
      count: byStatus.find((s) => s.status === status)?.count ?? 0,
    })),
    topProducts: [...top.values()].sort((a, b) => b.units - a.units).slice(0, 5),
    lowStock,
    recent,
    pending: byStatus.find((s) => s.status === "PENDING")?.count ?? 0,
  };
}
export type OverviewStats = Awaited<ReturnType<typeof overviewStats>>;
