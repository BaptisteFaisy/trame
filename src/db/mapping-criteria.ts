/**
 * Mapping of the warp threads: `criterion` and `criterion_version` (§19).
 *
 * A read never throws: an unreadable column takes its documented fallback, so
 * one corrupted row cannot empty a screen (§22). `scope_json` holds the
 * `ScopeRef` list that makes a criterion visible to a sprint, a project or a
 * version — the app never stores a person's statistics here (§5).
 */
import type { Criterion, CriterionVersion, ScopeRef } from '../types';
import type { Row } from './mapping-common';
import {
  fromSqlTimestamp,
  optionalText,
  parseJson,
  text,
  toBoolean,
  toJson,
  toNumber,
  toSqlTimestamp,
} from './mapping-common';

export const CRITERION_COLUMNS = [
  'id',
  'issue_id',
  'ticket_key',
  'criterion_key',
  'criterion_text',
  'text_hash',
  'kind',
  'origin',
  'falsifiable',
  'unfalsifiable_reason',
  'secret_flag',
  'version_no',
  'created_at',
  'changed_at',
  'author_ref',
  'deleted_at',
  'scope_json',
] as const;

export const CRITERION_VERSION_COLUMNS = [
  'id',
  'criterion_id',
  'version_no',
  'text_hash',
  'changed_at',
  'changed_by_ref',
  'change_kind',
] as const;

const KINDS = [
  'functional',
  'edge-case',
  'non-regression',
  'security',
  'performance',
  'experience',
  'documentation',
] as const;

const ORIGINS = [
  'acceptance-field',
  'description',
  'table',
  'confluence-page',
  'test-ticket',
  'attachment',
] as const;

const CHANGE_KINDS = ['created', 'edited', 'restored', 'deleted'] as const;

function kindOf(value: unknown): Criterion['kind'] {
  const raw = text(value, 'functional');
  return (KINDS as readonly string[]).includes(raw) ? (raw as Criterion['kind']) : 'functional';
}

function originOf(value: unknown): Criterion['origin'] {
  const raw = text(value, 'description');
  return (ORIGINS as readonly string[]).includes(raw) ? (raw as Criterion['origin']) : 'description';
}

function scopesOf(value: unknown): ScopeRef[] {
  const parsed = parseJson<ScopeRef[]>(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function criterionToRow(value: Criterion): Row {
  return {
    id: value.id,
    issue_id: value.issueId,
    ticket_key: value.ticketKey,
    criterion_key: value.criterionKey,
    criterion_text: value.text,
    text_hash: value.textHash,
    kind: value.kind,
    origin: value.origin,
    falsifiable: value.falsifiable ? 1 : 0,
    unfalsifiable_reason: value.unfalsifiableReason ?? null,
    secret_flag: value.secretFlag ?? null,
    version_no: value.version,
    created_at: toSqlTimestamp(value.createdAt),
    changed_at: toSqlTimestamp(value.changedAt),
    author_ref: value.authorRef ?? null,
    deleted_at: value.deletedAt ? toSqlTimestamp(value.deletedAt) : null,
    scope_json: toJson(value.scopeRefs),
  };
}

export function rowToCriterion(row: Row): Criterion {
  return {
    id: text(row['id']),
    issueId: text(row['issue_id']),
    ticketKey: text(row['ticket_key']),
    criterionKey: text(row['criterion_key']),
    text: text(row['criterion_text']),
    textHash: text(row['text_hash']),
    kind: kindOf(row['kind']),
    origin: originOf(row['origin']),
    falsifiable: toBoolean(row['falsifiable'], true),
    unfalsifiableReason: optionalText(row['unfalsifiable_reason']),
    secretFlag: optionalText(row['secret_flag']),
    version: toNumber(row['version_no'], 1),
    createdAt: fromSqlTimestamp(row['created_at']),
    changedAt: fromSqlTimestamp(row['changed_at']),
    authorRef: optionalText(row['author_ref']),
    deletedAt: row['deleted_at'] ? fromSqlTimestamp(row['deleted_at']) : undefined,
    scopeRefs: scopesOf(row['scope_json']),
  };
}

export function criterionVersionToRow(value: CriterionVersion): Row {
  return {
    id: value.id,
    criterion_id: value.criterionId,
    version_no: value.versionNo,
    text_hash: value.textHash,
    changed_at: toSqlTimestamp(value.changedAt),
    changed_by_ref: value.changedByRef ?? null,
    change_kind: value.changeKind,
  };
}

export function rowToCriterionVersion(row: Row): CriterionVersion {
  const changeKind = text(row['change_kind'], 'edited');
  return {
    id: text(row['id']),
    criterionId: text(row['criterion_id']),
    versionNo: toNumber(row['version_no'], 1),
    textHash: text(row['text_hash']),
    changedAt: fromSqlTimestamp(row['changed_at']),
    changedByRef: optionalText(row['changed_by_ref']),
    changeKind: (CHANGE_KINDS as readonly string[]).includes(changeKind)
      ? (changeKind as CriterionVersion['changeKind'])
      : 'edited',
  };
}
