"use client";

import { IconCheck, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { deleteReviewAction, setCustomerRoleAction, setStockAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { ConfirmAction } from "./confirm-button";
import { useAdminAction } from "./use-admin-action";

/** Inline stock editor: type a number, press Enter or the check. */
export function StockEditor({ variantId, stock, label }: { variantId: string; stock: number; label: string }) {
  const [value, setValue] = useState(String(stock));
  const { pending, run } = useAdminAction();
  const changed = value !== String(stock);
  const valid = /^\d+$/.test(value);
  return (
    <form
      className="flex items-center justify-end gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed && valid) run(() => setStockAction(variantId, Number(value)));
      }}
    >
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Stock for ${label}`}
        aria-invalid={!valid}
        className={cn(
          "h-8 w-20 rounded-lg border bg-background px-2 text-right text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          stock === 0 && !changed && "text-red-700 dark:text-red-400",
        )}
      />
      <Button type="submit" size="icon-sm" variant={changed ? "default" : "ghost"} disabled={!changed || !valid || pending} aria-label="Save stock">
        <IconCheck />
      </Button>
    </form>
  );
}

export function RoleSwitch({ userId, isAdmin, isSelf }: { userId: string; isAdmin: boolean; isSelf: boolean }) {
  const { pending, run } = useAdminAction();
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>
        <span className="block font-medium">Dashboard access</span>
        <span className="block text-xs text-muted-foreground">
          {isSelf ? "You can't remove your own access." : "Admins can manage products, orders and customers."}
        </span>
      </span>
      <Switch
        checked={isAdmin}
        disabled={pending || isSelf}
        onCheckedChange={(checked) => run(() => setCustomerRoleAction(userId, checked ? "ADMIN" : "CUSTOMER"))}
      />
    </label>
  );
}

export function DeleteReviewButton({ id, product }: { id: string; product: string }) {
  return (
    <ConfirmAction
      title="Delete this review?"
      description={`It will be removed from ${product} and its rating recalculated.`}
      action={() => deleteReviewAction(id)}
      trigger={(open) => (
        <Button size="icon-sm" variant="ghost" onClick={open} aria-label="Delete review">
          <IconTrash />
        </Button>
      )}
    />
  );
}
