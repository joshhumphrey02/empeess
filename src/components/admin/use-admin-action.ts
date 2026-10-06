"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/app/admin/actions";

/**
 * Runs an admin Server Action with a pending flag, a toast for the outcome,
 * and a router refresh so server-rendered tables pick up the change.
 */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<T>(action: () => Promise<ActionResult<T>>, opts: { onSuccess?: (data: T | undefined) => void } = {}) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (result.message) toast.success(result.message);
        opts.onSuccess?.(result.data);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return { pending, run };
}
