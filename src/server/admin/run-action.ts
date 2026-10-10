import "server-only";

import { AdminInputError } from "./catalog-admin";
import { assertAccess, type AdminAccess } from "./guard";
import { ProductInputError } from "./products";
import { PaymentError } from "../payments";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/**
 * Access check + known-error → message mapping, shared by every admin Server
 * Action. `access` is the privilege the action needs. Lives outside the
 * "use server" files so it isn't itself callable.
 */
export async function runAdminAction<T>(
  access: AdminAccess,
  fn: (adminId: string) => Promise<T>,
  message?: string,
): Promise<ActionResult<T>> {
  let adminId: string;
  try {
    adminId = (await assertAccess(access)).id;
  } catch {
    return { ok: false, error: "Your session has expired or you don't have access to do that." };
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
