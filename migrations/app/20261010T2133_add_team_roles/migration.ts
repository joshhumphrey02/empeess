#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2bdbadb32de66cd2b2404d0ead4017d48da254e0414fa4fb1e848242eec23ca4/contract';
import startContract from '../../snapshots/2bdbadb32de66cd2b2404d0ead4017d48da254e0414fa4fb1e848242eec23ca4/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6267fe6a7414542042bd9590ec3f75eaea38f99f85c01b0b96cc409fefca964a/contract';
import endContract from '../../snapshots/6267fe6a7414542042bd9590ec3f75eaea38f99f85c01b0b96cc409fefca964a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'User',
        constraint: 'User_role_check_3cc42c46',
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('bannedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('permissions', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'User',
        constraint: 'User_permissions_elem_not_null_318e2952',
        expression: 'array_position("permissions", NULL) IS NULL',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'User',
        constraint: 'User_role_check_5fad36fa',
        expression: "\"role\" IN ('CUSTOMER', 'STAFF', 'ADMIN')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
