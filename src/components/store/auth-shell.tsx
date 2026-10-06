import Image from "next/image";

import { images } from "@/components/landing/content";

/** Two-column frame shared by the sign-in and register pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-360 items-center gap-12 px-4 sm:px-8 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">[Account]</p>
        <h1 className="mt-2 text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.045em]">{title}</h1>
        <p className="mt-3 text-sm text-neutral-600">{subtitle}</p>
        <div className="mt-10">{children}</div>
      </div>
      <div
        className="chamfer relative hidden aspect-4/5 overflow-hidden bg-neutral-100 lg:block"
        style={{ ["--cut" as string]: "14%" }}
      >
        <Image src={images.hoodieBlack} alt="" fill sizes="50vw" className="object-cover" preload />
      </div>
    </div>
  );
}

export const AUTH_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn't set up yet. Use your email and password for now.",
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "We couldn't sign you in with Google. Please try again.",
};
