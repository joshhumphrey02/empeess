"use client";

import { IconReceiptRefund } from "@tabler/icons-react";

import { refundOrderAction, updateOrderStatusAction } from "@/app/admin/actions";
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
  CANCELLED: "Cancel unpaid order",
  REFUNDED: "Refund",
};

export function OrderStatusActions({
  orderNumber,
  next,
  refundable,
}: {
  orderNumber: string;
  next: OrderStatus[];
  /** Formatted amount when there's a successful Paystack payment to refund. */
  refundable?: string | null;
}) {
  const { pending, run } = useAdminAction();
  if (next.length === 0 && !refundable) return <p className="text-sm text-muted-foreground">No further status changes.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((status) =>
        status === "CANCELLED" ? (
          <ConfirmAction
            key={status}
            title={`Cancel ${orderNumber}?`}
            description="The customer hasn't paid. The items go back into stock and the customer sees the order as cancelled."
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
      {refundable && (
        <ConfirmAction
          title={`Refund ${refundable} for ${orderNumber}?`}
          description="Paystack returns the full amount to the customer's card or account, usually within a few working days. Items that haven't shipped go back into stock. This can't be undone."
          confirmLabel="Refund"
          action={() => refundOrderAction(orderNumber)}
          trigger={(open) => (
            <Button variant="outline" disabled={pending} onClick={open} className="text-destructive hover:text-destructive">
              <IconReceiptRefund /> Refund {refundable}
            </Button>
          )}
        />
      )}
    </div>
  );
}
