import "server-only";

import { or } from "@prisma/orm-postgres/orm-client";

import { db } from "@/prisma/db";

const PAGE = 25;
const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export async function adminListMessages(opts: { filter?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const filtered = () => {
    const all = db.orm.public.ContactMessage.where((m) => m.id.isNotNull());
    return opts.filter === "unread" ? all.where((m) => m.readAt.isNull()) : all;
  };
  const [messages, { count }] = await Promise.all([
    filtered()
      .orderBy([(m) => m.createdAt.desc(), (m) => m.id.desc()])
      .limit(PAGE)
      .offset((page - 1) * PAGE)
      .all(),
    filtered().aggregate((a) => ({ count: a.count() })),
  ]);
  return { messages, total: count, page, pageSize: PAGE, pageCount: Math.max(1, Math.ceil(count / PAGE)) };
}

export async function unreadMessageCount() {
  const { count } = await db.orm.public.ContactMessage.where((m) => m.readAt.isNull()).aggregate((a) => ({ count: a.count() }));
  return count;
}

export async function setMessageRead(id: string, read: boolean) {
  await db.orm.public.ContactMessage.where({ id }).update({ readAt: read ? new Date().toISOString() : null });
}

export async function deleteMessage(id: string) {
  await db.orm.public.ContactMessage.where({ id }).delete();
}

export async function adminListSubscribers(opts: { q?: string; status?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const filtered = () => {
    let subs = db.orm.public.NewsletterSubscriber.where((s) => s.id.isNotNull());
    if (opts.q) {
      const term = likeTerm(opts.q);
      subs = subs.where((s) => or(s.email.ilike(term)));
    }
    if (opts.status === "active") subs = subs.where((s) => s.unsubscribedAt.isNull());
    if (opts.status === "unsubscribed") subs = subs.where((s) => s.unsubscribedAt.isNotNull());
    return subs;
  };
  const [subscribers, { count }] = await Promise.all([
    filtered()
      .orderBy([(s) => s.createdAt.desc(), (s) => s.id.desc()])
      .limit(PAGE)
      .offset((page - 1) * PAGE)
      .all(),
    filtered().aggregate((a) => ({ count: a.count() })),
  ]);
  return { subscribers, total: count, page, pageSize: PAGE, pageCount: Math.max(1, Math.ceil(count / PAGE)) };
}

export async function subscriberSummary() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [active, left, fresh] = await Promise.all([
    db.orm.public.NewsletterSubscriber.where((s) => s.unsubscribedAt.isNull()).aggregate((a) => ({ count: a.count() })),
    db.orm.public.NewsletterSubscriber.where((s) => s.unsubscribedAt.isNotNull()).aggregate((a) => ({ count: a.count() })),
    db.orm.public.NewsletterSubscriber.where((s) => s.unsubscribedAt.isNull())
      .where((s) => s.createdAt.gte(monthAgo))
      .aggregate((a) => ({ count: a.count() })),
  ]);
  return { active: active.count, unsubscribed: left.count, newThisMonth: fresh.count };
}

/** Active subscribers for export. */
export async function activeSubscriberEmails() {
  return db.orm.public.NewsletterSubscriber.where((s) => s.unsubscribedAt.isNull())
    .orderBy((s) => s.createdAt.asc())
    .select("email", "createdAt")
    .all();
}
