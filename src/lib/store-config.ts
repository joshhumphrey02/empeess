// Storefront business rules. Amounts are in kobo.
// TODO(owner): confirm shipping pricing; these are placeholders.

export const SHIPPING_FLAT_FEE = 3_500_00; // ₦3,500
export const FREE_SHIPPING_THRESHOLD = 150_000_00; // free on orders of ₦150,000+
export const MAX_QTY_PER_LINE = 10;
export const PRODUCTS_PER_PAGE = 12;

export function shippingFor(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
}
