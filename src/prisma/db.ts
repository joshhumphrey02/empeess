import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const createDb = () =>
  postgres<Contract>({
    contractJson,
    url: process.env['DATABASE_URL']!,
    // The first-use marker check caches its outcome, failures included: one
    // dropped connection on the first query made every later query in the
    // process throw CONTRACT.MARKER_READ_FAILED until a restart. It only ever
    // logs a drift warning, so turn it off and rely on `prisma db verify`.
    verifyMarker: false,
  });

// `next dev` re-evaluates this module on every hot reload. Reuse one client
// (and so one pool) across reloads instead of opening a new pool each time,
// but rebuild it when the emitted contract changes.
const cached = globalThis as typeof globalThis & {
  __empeessDb?: { hash: string; db: ReturnType<typeof createDb> };
};
const hash = contractJson.storage.storageHash;

if (cached.__empeessDb && cached.__empeessDb.hash !== hash) {
  void cached.__empeessDb.db.close().catch(() => undefined);
  cached.__empeessDb = undefined;
}

export const db = cached.__empeessDb?.db ?? createDb();

if (process.env.NODE_ENV !== 'production') cached.__empeessDb = { hash, db };
