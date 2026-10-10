#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6267fe6a7414542042bd9590ec3f75eaea38f99f85c01b0b96cc409fefca964a/contract';
import startContract from '../../snapshots/6267fe6a7414542042bd9590ec3f75eaea38f99f85c01b0b96cc409fefca964a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8cbbe1056c0ec84ac90a65c9d72bfeae2631c7d7d87f3e8971c21402fd230657/contract';
import endContract from '../../snapshots/8cbbe1056c0ec84ac90a65c9d72bfeae2631c7d7d87f3e8971c21402fd230657/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'SiteContent',
        columns: [
          col('arkId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['key'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
