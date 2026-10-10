import type { Metadata } from "next";

import { OrderList } from "@/components/store/order-bits";
import { requireUser } from "@/server/auth/session";
import { listOrders } from "@/server/orders";
import { expireStaleOrders } from "@/server/payments";

export const metadata: Metadata = { title: "Orders | EMPEESS" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  await expireStaleOrders({ userId: user.id, limit: 10 }).catch(() => {});
  const orders = await listOrders(user.id);
  return (
    <section>
      <h1 className="mb-6 text-2xl font-medium tracking-tight">Orders</h1>
      <OrderList orders={orders} />
    </section>
  );
}
