"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/server/admin/guard";
import {
  AdminInputError,
  deleteCategory,
  deleteReview,
  moveCategory,
  saveCategory,
  setStock,
  type CategoryInput,
} from "@/server/admin/catalog-admin";
import {
  deleteProduct,
  ProductInputError,
  saveProduct,
  setProductStatus,
  type ProductInput,
  type ProductStatus,
} from "@/server/admin/products";
import { setCustomerRole, updateOrderStatus, type OrderStatus } from "@/server/admin/sales";
import { PaymentError, refundOrder } from "@/server/payments";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/** Admin check + known-error → message mapping, shared by every action. */
async function run<T>(fn: (adminId: string) => Promise<T>, message?: string): Promise<ActionResult<T>> {
  let adminId: string;
  try {
    adminId = (await assertAdmin()).id;
  } catch {
    return { ok: false, error: "Your session has expired or you're not an admin. Sign in again." };
  }
  try {
    const data = await fn(adminId);
    return { ok: true, data, message };
  } catch (error) {
    if (error instanceof ProductInputError || error instanceof AdminInputError || error instanceof PaymentError) {
      return { ok: false, error: error.message };
    }
    console.error(error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

// Storefront pages read the catalog too, so refresh everything that shows it.
const refreshCatalog = () => revalidatePath("/", "layout");

// ─── Products ────────────────────────────────────────────────────────────────

export async function saveProductAction(input: ProductInput) {
  return run(async () => {
    const id = await saveProduct(input);
    refreshCatalog();
    return id;
  }, input.id ? "Product updated." : "Product created.");
}

export async function deleteProductAction(id: string) {
  return run(async () => {
    await deleteProduct(id);
    refreshCatalog();
  }, "Product deleted.");
}

export async function setProductStatusAction(id: string, status: ProductStatus) {
  return run(async () => {
    await setProductStatus(id, status);
    refreshCatalog();
  }, `Product ${status === "ACTIVE" ? "published" : status === "ARCHIVED" ? "archived" : "moved to drafts"}.`);
}

/** Bulk versions for the products table selection. Each product goes through the same single-row path. */
const MAX_BULK = 100;

export async function bulkSetProductStatusAction(ids: string[], status: ProductStatus) {
  return run(async () => {
    if (ids.length > MAX_BULK) throw new ProductInputError(`Select ${MAX_BULK} products or fewer.`);
    for (const id of ids) await setProductStatus(id, status);
    refreshCatalog();
  }, `${ids.length} product${ids.length === 1 ? "" : "s"} ${status === "ACTIVE" ? "published" : status === "ARCHIVED" ? "archived" : "moved to drafts"}.`);
}

export async function bulkDeleteProductsAction(ids: string[]) {
  return run(async () => {
    if (ids.length > MAX_BULK) throw new ProductInputError(`Select ${MAX_BULK} products or fewer.`);
    for (const id of ids) await deleteProduct(id);
    refreshCatalog();
  }, `${ids.length} product${ids.length === 1 ? "" : "s"} deleted.`);
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function saveCategoryAction(input: CategoryInput) {
  return run(async () => {
    await saveCategory(input);
    refreshCatalog();
  }, input.id ? "Category updated." : "Category created.");
}

export async function deleteCategoryAction(id: string) {
  return run(async () => {
    await deleteCategory(id);
    refreshCatalog();
  }, "Category deleted.");
}

export async function moveCategoryAction(id: string, direction: "up" | "down") {
  return run(async () => {
    await moveCategory(id, direction);
    refreshCatalog();
  });
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export async function setStockAction(variantId: string, stock: number) {
  return run(async () => {
    await setStock(variantId, stock);
    refreshCatalog();
  }, "Stock updated.");
}

// ─── Orders / customers / reviews ────────────────────────────────────────────

export async function updateOrderStatusAction(orderNumber: string, status: OrderStatus) {
  return run(async () => {
    await updateOrderStatus(orderNumber, status);
    revalidatePath("/", "layout");
  }, `Order marked ${status.toLowerCase()}.`);
}

/** Refunds the order's Paystack payment in full and marks the order refunded. */
export async function refundOrderAction(orderNumber: string, note?: string) {
  return run(async () => {
    await refundOrder(orderNumber, note);
    revalidatePath("/", "layout");
  }, "Refund started with Paystack. The customer usually sees it in a few working days.");
}

export async function setCustomerRoleAction(userId: string, role: "ADMIN" | "CUSTOMER") {
  return run(async (adminId) => {
    await setCustomerRole(userId, role, adminId);
    revalidatePath("/admin", "layout");
  }, role === "ADMIN" ? "Admin access granted." : "Admin access removed.");
}

export async function deleteReviewAction(id: string) {
  return run(async () => {
    await deleteReview(id);
    refreshCatalog();
  }, "Review deleted.");
}
