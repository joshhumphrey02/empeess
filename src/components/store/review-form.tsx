"use client";

import { IconStarFilled } from "@tabler/icons-react";
import { useActionState, useState } from "react";

import { submitReview } from "@/app/actions/account";
import { initialFormState } from "@/app/actions/form-state";
import { cn } from "@/lib/utils";

import { FormMessage, SubmitButton } from "./form-bits";

export function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing?: { rating: number; comment: string | null };
}) {
  const [state, action] = useActionState(submitReview, initialFormState);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);

  return (
    <form action={action} className="space-y-4 rounded-3xl bg-canvas p-6">
      <p className="font-medium text-neutral-950">{existing ? "Update your review" : "Write a review"}</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="sr-only">Rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <IconStarFilled className={cn("size-6 transition-colors", (hover || rating) >= n ? "text-brand" : "text-neutral-300")} />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="sr-only">Comment</span>
        <textarea
          name="comment"
          rows={3}
          maxLength={1000}
          defaultValue={existing?.comment ?? ""}
          placeholder="How's the fit, feel or scent?"
          className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-neutral-900"
        />
      </label>
      <SubmitButton disabled={rating === 0}>{existing ? "Update review" : "Post review"}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
