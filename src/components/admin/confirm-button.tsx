"use client";

import { useState } from "react";

import type { ActionResult } from "@/app/admin/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAdminAction } from "./use-admin-action";

/**
 * A trigger element that asks for confirmation, then runs a destructive
 * admin action. `trigger` receives an onClick that opens the dialog.
 */
export function ConfirmAction({
  title,
  description,
  confirmLabel = "Delete",
  action,
  onDone,
  trigger,
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  action: () => Promise<ActionResult<unknown>>;
  onDone?: () => void;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAdminAction();
  return (
    <>
      {trigger(() => setOpen(true))}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(action, {
                  onSuccess: () => {
                    setOpen(false);
                    onDone?.();
                  },
                })
              }
            >
              {pending ? "Working…" : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
