// Storefront business rules. Amounts are in kobo.
// TODO(owner): confirm shipping pricing; these are placeholders.

export const SHIPPING_FLAT_FEE = 3_500_00; // ₦3,500
export const FREE_SHIPPING_THRESHOLD = 150_000_00; // free on orders of ₦150,000+
export const MAX_QTY_PER_LINE = 10;
export const PRODUCTS_PER_PAGE = 12;

export function shippingFor(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
}

/**
 * How long an unpaid order holds its stock. After this, the order is
 * cancelled and the items go back on sale (Paystack checkout sessions are
 * short-lived too, so a late payment is rare and is handled on arrival).
 */
export const PAYMENT_WINDOW_MINUTES = 30;

/** Order statuses that count as a sale (paid, not cancelled or refunded). */
export const SALE_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
export const isSale = (status: string) => (SALE_STATUSES as readonly string[]).includes(status);
