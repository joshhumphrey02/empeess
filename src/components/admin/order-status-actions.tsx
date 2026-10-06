"use client";

import { updateOrderStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/server/admin/sales";

import { ConfirmAction } from "./confirm-button";
import { useAdminAction } from "./use-admin-action";

const LABEL: Record<OrderStatus, string> = {
  PENDING: "Mark pending",
  PAID: "Mark as paid",
  PROCESSING: "Start processing",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
  REFUNDED: "Mark refunded",
};

export function OrderStatusActions({ orderNumber, next }: { orderNumber: string; next: OrderStatus[] }) {
  const { pending, run } = useAdminAction();
  if (next.length === 0) return <p className="text-sm text-muted-foreground">No further status changes.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((status) =>
        status === "CANCELLED" || status === "REFUNDED" ? (
          <ConfirmAction
            key={status}
            title={status === "CANCELLED" ? `Cancel ${orderNumber}?` : `Mark ${orderNumber} refunded?`}
            description={
              status === "CANCELLED"
                ? "Items go back into stock and the customer sees the order as cancelled."
                : "Record that the customer's money has been returned. Stock is not changed."
            }
            confirmLabel={LABEL[status]}
            action={() => updateOrderStatusAction(orderNumber, status)}
            trigger={(open) => (
              <Button variant="destructive" disabled={pending} onClick={open}>
                {LABEL[status]}
              </Button>
            )}
          />
        ) : (
          <Button key={status} disabled={pending} onClick={() => run(() => updateOrderStatusAction(orderNumber, status))}>
            {LABEL[status]}
          </Button>
        ),
      )}
    </div>
  );
}
