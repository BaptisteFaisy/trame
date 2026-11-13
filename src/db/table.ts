/**
 * Generic table adapter: the three Forge SQL invariants, implemented once.
 *
 * 1. **Bounded queries** — every `SELECT` carries a `WHERE` and an explicit
 *    `LIMIT` (a 50 000-ticket project is never one call, §18).
 * 2. **Replayable writes** — `INSERT … ON DUPLICATE KEY UPDATE`, so replaying a
 *    consumer slice neither duplicates nor breaks anything.
 * 3. **Reads never throw** — a missing row yields `null`, an empty list `[]`,
 *    an unreadable column its documented fallback (`mapping-common.ts`).
 *
 * No `DELETE` here: nothing is erased, a criterion keeps its versions and a
 * verification keeps its `disabled_at` (§18, §23).
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type { SqlClient, SqlParam } from './sql-client';
import type { Row } from './mapping-common';
import { valuesOf } from './mapping-common';

/** Upper bound of any list read: nothing is ever unbounded. */
export const LIST_LIMIT = 500;

/** A `WHERE` fragment and its bound parameters, always together. */
export interface Where {
  sql: string;
  params: SqlParam[];
}

export const NO_WHERE: Where = { sql: '1 = 1', params: [] };

export function eq(column: string, value: SqlParam): Where {
  return { sql: `${column} = ?`, params: [value] };
}

export function and(...clauses: Where[]): Where {
  const kept = clauses.filter((clause) => clause.sql !== NO_WHERE.sql);
  if (kept.length === 0) return NO_WHERE;
  return {
    sql: kept.map((clause) => clause.sql).join(' AND '),
    params: kept.flatMap((clause) => clause.params),
  };
}

export function gte(column: string, value: SqlParam): Where {
  return { sql: `${column} >= ?`, params: [value] };
}

export function like(column: string, pattern: string): Where {
  return { sql: `${column} LIKE ?`, params: [pattern] };
}

export function isNull(column: string): Where {
  return { sql: `${column} IS NULL`, params: [] };
}

export interface SelectOptions {
  orderBy?: string;
  limit?: number;
}

export interface TableConfig<T> {
  table: string;
  columns: readonly string[];
  toRow: (value: T) => Row;
  fromRow: (row: Row) => T;
  /** Columns replayed by an upsert; the primary key is excluded by default. */
  keyColumns?: readonly string[];
}

export interface TableStore<T> {
  upsert(value: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  select(where?: Where, options?: SelectOptions): Promise<T[]>;
  findOne(where?: Where, options?: SelectOptions): Promise<T | null>;
  count(where?: Where): Promise<number>;
}

function upsertStatement(table: string, columns: readonly string[], keys: readonly string[]): string {
  const placeholders = columns.map(() => '?').join(', ');
  const updated = columns.filter((column) => !keys.includes(column));
  const clause =
    updated.length > 0
      ? updated.map((column) => `${column} = VALUES(${column})`).join(', ')
      : `${keys[0]} = ${keys[0]}`;
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${clause}`;
}

/** Builds the adapter of one table from its column list and its mapping. */
export function createTable<T extends { id: string }>(
  sql: SqlClient,
  config: TableConfig<T>,
): TableStore<T> {
  const { table, columns, toRow, fromRow } = config;
  const keys = config.keyColumns ?? ['id'];
  const statement = upsertStatement(table, columns, keys);

  async function select(where: Where, options: SelectOptions): Promise<T[]> {
    const order = options.orderBy ? ` ORDER BY ${options.orderBy}` : '';
    const limit = Math.min(options.limit ?? LIST_LIMIT, LIST_LIMIT);
    const rows = await sql.query<Row>(
      `SELECT ${columns.join(', ')} FROM ${table} WHERE ${where.sql}${order} LIMIT ${limit}`,
      where.params,
    );
    return rows.map((row) => fromRow(row));
  }

  return {
    async upsert(value: T): Promise<void> {
      await sql.execute(statement, valuesOf(toRow(value), columns));
    },
    async findById(id: string): Promise<T | null> {
      const rows = await select(eq('id', id), { limit: 1 });
      return rows[0] ?? null;
    },
    async select(where: Where = NO_WHERE, options: SelectOptions = {}): Promise<T[]> {
      return select(where, options);
    },
    async findOne(where: Where = NO_WHERE, options: SelectOptions = {}): Promise<T | null> {
      const rows = await select(where, { ...options, limit: 1 });
      return rows[0] ?? null;
    },
    async count(where: Where = NO_WHERE): Promise<number> {
      const rows = await sql.query<Row>(
        `SELECT COUNT(*) AS n FROM ${table} WHERE ${where.sql} LIMIT 1`,
        where.params,
      );
      const value = rows[0]?.['n'];
      return typeof value === 'number' ? value : Number(value ?? 0);
    },
  };
}
