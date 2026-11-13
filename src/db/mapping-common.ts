/**
 * Shared scalar conversions for the mapping layer.
 *
 * One place for dates, enumerations, booleans, numbers and JSON, because a
 * single corrupted column must never empty a screen (§22): **a read never
 * throws**, every conversion has a documented fallback.
 *
 * Forge SQL reality: `DECIMAL` comes back as a string, `TIMESTAMP` as
 * `YYYY-MM-DD HH:MM:SS.fff`, and the `JSON` type is on probation — payloads are
 * stored as `TEXT` and serialised here.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type { SqlParam } from './sql-client';

export type Row = Record<string, unknown>;

export function isObject(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A string, or `fallback` when the column is not one. */
export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** An optional string: `undefined` when the column is null or absent. */
export function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** A finite number; `DECIMAL` columns arrive as numeric strings. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/** SQL booleans arrive as 1/0, and sometimes as '1'/'0'. */
export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return fallback;
}

/** Parses a TEXT payload; an unreadable value falls back, never throws. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (isObject(value) || Array.isArray(value)) return value as T;
  if (typeof value !== 'string' || value.trim().length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Serialises a payload for a TEXT column. */
export function toJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return 'null';
  }
}

/** ISO 8601 → `YYYY-MM-DD HH:MM:SS.fff` (what a TIMESTAMP column accepts). */
export function toSqlTimestamp(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso.replace('T', ' ').replace('Z', '');
  return at.toISOString().slice(0, 23).replace('T', ' ');
}

/** `YYYY-MM-DD HH:MM:SS.fff` (or ISO) → ISO 8601, or `fallback`. */
export function fromSqlTimestamp(value: unknown, fallback = ''): string {
  const raw = text(value);
  if (raw.length === 0) return fallback;
  if (raw.endsWith('Z') || raw.includes('T')) return raw;
  const at = new Date(`${raw.replace(' ', 'T')}Z`);
  return Number.isNaN(at.getTime()) ? raw : at.toISOString();
}

/** `undefined` becomes SQL NULL, everything else a bound parameter. */
export function param(value: string | number | boolean | undefined | null): SqlParam {
  return value === undefined ? null : value;
}

/** Values of a row, in column order — the binding order of every statement. */
export function valuesOf(row: Row, columns: readonly string[]): SqlParam[] {
  return columns.map((column) => {
    const value = row[column];
    return value === undefined || value === null
      ? null
      : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? value
        : toJson(value);
  });
}
