"use client";

import { IconLock } from "@tabler/icons-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { payForOrder } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";

import { SubmitButton } from "./form-bits";

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** "Pay now" for an unpaid order, with the time left before its stock is released. */
export function PayNow({ orderNumber, amount, deadline }: { orderNumber: string; amount: string; deadline: string }) {
  const [state, action] = useActionState(payForOrder, initialFormState);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    const end = new Date(deadline).getTime();
    const tick = () => setLeft(end - Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [deadline]);

  const expired = left !== null && left <= 0;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <SubmitButton disabled={expired} className="w-full bg-brand hover:bg-brand/90">
        <IconLock className="size-4" aria-hidden /> Pay {amount} now
      </SubmitButton>
      <p className="text-center text-xs text-neutral-500" aria-live="polite">
        {left === null
          ? "Your items are reserved for a short while."
          : expired
            ? "The time to pay has run out. Refresh to see the latest status."
            : `Items reserved for ${mmss(left)} more.`}
      </p>
    </form>
  );
}
