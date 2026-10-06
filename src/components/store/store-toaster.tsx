"use client";

import { Toaster } from "sonner";

/** Toasts for the storefront and account area: always light, bottom-right (top on phones). */
export function StoreToaster() {
  return (
    <Toaster
      theme="light"
      position="bottom-right"
      mobileOffset={{ top: 88 }}
      toastOptions={{ classNames: { toast: "rounded-2xl! font-sans" } }}
    />
  );
}
