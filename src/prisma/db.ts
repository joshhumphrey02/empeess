import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { Pool, type PoolClient } from 'pg';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// Opening a connection is the slow, flaky step when the database is far away
// (seconds per handshake, and now and then one that never completes). Retry a
// failed connect once instead of failing the request on the first stall.
class RetryingPool extends Pool {
  override connect(): Promise<PoolClient>;
  override connect(
    callback: (err: Error | undefined, client: PoolClient | undefined, done: (release?: unknown) => void) => void,
  ): void;
  override connect(callback?: Parameters<Pool['connect']>[0]): Promise<PoolClient> | void {
    if (callback) return super.connect(callback);
    return super.connect().catch(() => super.connect());
  }
}

const createPool = () => {
  const pool = new RetryingPool({
    connectionString: process.env['DATABASE_URL']!,
    connectionTimeoutMillis: 8_000,
    // Keep connections around between requests so most queries skip the
    // handshake, and keep-alive them so a dead one is noticed while idle
    // rather than handed to a request.
    idleTimeoutMillis: 10 * 60_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    // Idle connections must not hold scripts (seed, grant-admin) open.
    allowExitOnIdle: true,
  });
  // An idle client dropped by the server emits here; without a listener it
  // would crash the process. The pool already discards the client.
  pool.on('error', () => undefined);
  return pool;
};

const createDb = () => {
  const pool = createPool();
  const client = postgres<Contract>({
    contractJson,
    pg: pool,
    // The first-use marker check caches its outcome, failures included: one
    // dropped connection on the first query made every later query in the
    // process throw CONTRACT.MARKER_READ_FAILED until a restart. It only ever
    // logs a drift warning, so turn it off and rely on `prisma db verify`.
    verifyMarker: false,
  });
  return { client, pool };
};

// `next dev` re-evaluates this module on every hot reload. Reuse one client
// (and so one pool) across reloads instead of opening a new pool each time,
// but rebuild it when the emitted contract changes.
const cached = globalThis as typeof globalThis & {
  __empeessDb?: { hash: string } & ReturnType<typeof createDb>;
};
const hash = contractJson.storage.storageHash;

if (cached.__empeessDb && cached.__empeessDb.hash !== hash) {
  void cached.__empeessDb.pool.end().catch(() => undefined);
  cached.__empeessDb = undefined;
}

const current = cached.__empeessDb ?? { hash, ...createDb() };

if (process.env.NODE_ENV !== 'production') cached.__empeessDb = current;

export const db = current.client;
