"use client";

import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleWishlist } from "@/app/actions/wishlist";
import { cn } from "@/lib/utils";

type Ctx = { signedIn: boolean; saved: Set<string>; set: (id: string, on: boolean) => void };
const WishlistContext = createContext<Ctx | null>(null);

/** Holds which products the shopper has saved so every heart on the page agrees. */
export function WishlistProvider({ ids, signedIn, children }: { ids: string[]; signedIn: boolean; children: React.ReactNode }) {
  const [saved, setSaved] = useState(() => new Set(ids));
  const set = (id: string, on: boolean) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  return <WishlistContext value={{ signedIn, saved, set }}>{children}</WishlistContext>;
}

/** Heart toggle. Optimistic; reverts with a toast if the server says no. */
export function WishlistButton({ productId, name, variant = "overlay", className }: { productId: string; name: string; variant?: "overlay" | "pill"; className?: string }) {
  const ctx = use(WishlistContext);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const on = ctx?.saved.has(productId) ?? false;

  function toggle() {
    if (!ctx?.signedIn) {
      toast("Sign in to save items to your wishlist.", { action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(pathname)}`) } });
      return;
    }
    const next = !on;
    ctx.set(productId, next);
    start(async () => {
      const result = await toggleWishlist(productId, next);
      if (!result.ok) {
        ctx.set(productId, !next);
        toast.error(result.error);
      } else if (next) {
        toast.success(`Saved ${name}`, { action: { label: "View wishlist", onClick: () => router.push("/account/wishlist") } });
      }
    });
  }

  const Icon = on ? IconHeartFilled : IconHeart;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn(
        variant === "overlay"
          ? "grid size-9 place-items-center rounded-full bg-white/90 text-neutral-950 shadow-sm backdrop-blur transition-transform hover:scale-110"
          : "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 text-sm transition-colors hover:border-neutral-900",
        className,
      )}
    >
      <motion.span key={String(on)} initial={{ scale: on ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="grid place-items-center">
        <Icon className={cn("size-[18px]", on && "text-red-500")} aria-hidden />
      </motion.span>
      {variant === "pill" && <span>{on ? "Saved" : "Save"}</span>}
    </button>
  );
}

export function WishlistEmpty() {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-300 px-6 py-14 text-center">
      <IconHeart className="mx-auto size-8 text-neutral-400" aria-hidden />
      <p className="mt-3 font-medium">Nothing saved yet.</p>
      <p className="mt-1 text-sm text-neutral-600">Tap the heart on any product to keep it here.</p>
      <Link href="/shop" className="mt-4 inline-block text-sm underline underline-offset-4">
        Browse the shop
      </Link>
    </div>
  );
}
