"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, use, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { ADMIN_THEME_KEY } from "@/lib/admin-theme-key";

export type ThemePref = "light" | "dark" | "system";
type Resolved = "light" | "dark";

// ─── Store: the preference lives in localStorage, the system value in a media query ──

const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(ADMIN_THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function subscribePref(cb: () => void) {
  listeners.add(cb);
  // Keep other tabs in step.
  const onStorage = (e: StorageEvent) => e.key === ADMIN_THEME_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function writePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(ADMIN_THEME_KEY);
    else localStorage.setItem(ADMIN_THEME_KEY, pref);
  } catch {
    // Private mode: the choice still applies for this page view.
  }
  listeners.forEach((l) => l());
}

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
function subscribeSystem(cb: () => void) {
  const mq = darkQuery();
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function applyTheme(theme: Resolved | null) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme ?? "";
}

// ─── Provider ────────────────────────────────────────────────────────────────

const ThemeContext = createContext<{ pref: ThemePref; resolved: Resolved; setPref: (p: ThemePref, from?: HTMLElement) => void } | null>(null);

export function useAdminTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  return ctx;
}

/**
 * Light/dark/system theme scoped to the dashboard: it sets `dark` on <html>
 * while the admin is mounted and removes it on the way out, so the store
 * always renders light. The root layout's inline script handles first paint.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = useSyncExternalStore(subscribePref, readPref, () => "system" as const);
  const systemDark = useSyncExternalStore(subscribeSystem, () => darkQuery().matches, () => false);
  const resolved: Resolved = pref === "system" ? (systemDark ? "dark" : "light") : pref;

  useLayoutEffect(() => applyTheme(resolved), [resolved]);
  useLayoutEffect(() => () => applyTheme(null), []);

  function setPref(next: ThemePref, from?: HTMLElement) {
    const nextResolved: Resolved = next === "system" ? (darkQuery().matches ? "dark" : "light") : next;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce || nextResolved === resolved) {
      writePref(next);
      return;
    }
    // Grow the new theme out of the toggle as a circle.
    const rect = from?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 28;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = doc.startViewTransition(() => {
      flushSync(() => writePref(next));
      applyTheme(nextResolved);
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }

  return <ThemeContext value={{ pref, resolved, setPref }}>{children}</ThemeContext>;
}

// ─── Controls ────────────────────────────────────────────────────────────────

const OPTIONS = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceDesktop },
] as const;

export function ThemeToggle() {
  const { pref, resolved, setPref } = useAdminTheme();
  const Icon = resolved === "dark" ? IconMoon : IconSun;
  // The reveal grows from the toggle itself (the menu item is gone by then).
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button ref={trigger} variant="ghost" size="icon" aria-label={`Theme: ${pref}`} className="relative overflow-hidden rounded-full" />}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={resolved}
            initial={{ y: 16, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -16, rotate: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="grid place-items-center"
          >
            <Icon className="size-[1.15rem]" />
          </motion.span>
        </AnimatePresence>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={pref}
            onValueChange={(v) => setPref(v as ThemePref, trigger.current ?? undefined)}
          >
            {OPTIONS.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                <o.icon /> {o.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Toasts follow the dashboard theme, not the OS. */
export function AdminToaster() {
  const { resolved } = useAdminTheme();
  return <Toaster position="bottom-right" richColors theme={resolved} />;
}
