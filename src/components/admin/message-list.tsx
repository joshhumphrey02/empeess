"use client";

import { IconChevronDown, IconMail, IconMailOpened, IconTrash } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { deleteMessageAction, setMessageReadAction } from "@/app/admin/messages/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ConfirmAction } from "./confirm-button";
import { useAdminAction } from "./use-admin-action";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  orderNumber: string | null;
  readAt: string | null;
  createdAt: string;
};

const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Inbox rows that expand in place; opening an unread message marks it read. */
export function MessageList({ messages }: { messages: Message[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const { pending, run } = useAdminAction();

  return (
    <ul className="divide-y">
      {messages.map((m, i) => {
        const isOpen = open === m.id;
        const unread = !m.readAt;
        return (
          <li
            key={m.id}
            className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-500"
            style={{ animationDelay: `${Math.min(i, 16) * 30}ms` }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => {
                setOpen(isOpen ? null : m.id);
                if (!isOpen && unread) run(() => setMessageReadAction(m.id, true));
              }}
              className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-soft/40", isOpen && "bg-muted/40")}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-brand" : "bg-transparent")} aria-hidden />
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                {m.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{m.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{when(m.createdAt)}</span>
                </span>
                <span className={cn("block truncate text-sm", unread ? "text-foreground" : "text-muted-foreground")}>
                  {m.subject ?? m.message}
                </span>
                {unread && <span className="sr-only">Unread</span>}
              </span>
              <IconChevronDown className={cn("mt-2 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 px-4 pb-5 pl-[4.25rem]">
                    <p className="text-xs text-muted-foreground">
                      {m.email}
                      {m.orderNumber && (
                        <>
                          {" · order "}
                          <Link href={`/admin/orders/${m.orderNumber}`} className="font-medium text-brand hover:underline">
                            {m.orderNumber}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "Your message to EMPEESS"}`)}`}
                        className={buttonVariants({ size: "sm" })}
                      >
                        <IconMail /> Reply
                      </a>
                      <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setMessageReadAction(m.id, false), { onSuccess: () => setOpen(null) })}>
                        <IconMailOpened /> Mark unread
                      </Button>
                      <ConfirmAction
                        title="Delete this message?"
                        description="It's removed from the inbox for everyone. This can't be undone."
                        action={() => deleteMessageAction(m.id)}
                        trigger={(openConfirm) => (
                          <Button variant="ghost" size="sm" disabled={pending} onClick={openConfirm} className="hover:text-destructive">
                            <IconTrash /> Delete
                          </Button>
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
