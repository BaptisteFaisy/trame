/**
 * Mapping of the weft passes (`verification`, §19) and of the meshes
 * (`link`, §19).
 *
 * A verification keeps `disabled_at`: a thread that stopped crossing anything
 * is counted, listed and removed from the coverage — never erased (§8.3).
 * A link keeps its rejection and its learned weights, because a refused link
 * must weaken the next suggestion of the same kind (§9.4).
 */
import type { Link, Verification } from '../types';
import type { Row } from './mapping-common';
import {
  fromSqlTimestamp,
  optionalText,
  parseJson,
  text,
  toNumber,
  toJson,
  toSqlTimestamp,
} from './mapping-common';

export const VERIFICATION_COLUMNS = [
  'id',
  'form',
  'source_system',
  'source_ref',
  'issue_id',
  'ticket_key',
  'name',
  'executed_at',
  'status',
  'strength',
  'artifact_ref',
  'author_ref',
  'disabled_at',
  'zone',
] as const;

export const LINK_COLUMNS = [
  'id',
  'criterion_id',
  'verification_id',
  'kind',
  'path',
  'confidence',
  'criterion_hash_at_link',
  'established_at',
  'confirmed_at',
  'rejected_at',
  'reject_reason',
  'weights_json',
] as const;

const FORMS = [
  'automated-test',
  'manual-case',
  'third-party',
  'code-review',
  'traced-manual',
  'deployment',
  'declaration',
] as const;

const SOURCES = ['teamwork-graph', 'bitbucket', 'jira', 'confluence', 'pipeline'] as const;

const STATUSES = ['passed', 'failed', 'skipped', 'ignored', 'unknown'] as const;

const STRENGTHS = ['machine', 'attested', 'declared'] as const;

const LINK_KINDS = ['declared', 'derived', 'confirmed'] as const;

const LINK_PATHS = ['mention', 'naming-convention', 'similarity', 'declaration'] as const;

/** Reads an enumeration column, falling back instead of throwing. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const raw = text(value, fallback);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function verificationToRow(value: Verification): Row {
  return {
    id: value.id,
    form: value.form,
    source_system: value.sourceSystem,
    source_ref: value.sourceRef,
    issue_id: value.issueId ?? null,
    ticket_key: value.ticketKey ?? null,
    name: value.name,
    executed_at: toSqlTimestamp(value.executedAt),
    status: value.status,
    strength: value.strength,
    artifact_ref: value.artifactRef ?? null,
    author_ref: value.authorRef ?? null,
    disabled_at: value.disabledAt ? toSqlTimestamp(value.disabledAt) : null,
    zone: value.zone ?? null,
  };
}

export function rowToVerification(row: Row): Verification {
  return {
    id: text(row['id']),
    form: oneOf(row['form'], FORMS, 'declaration'),
    sourceSystem: oneOf(row['source_system'], SOURCES, 'jira'),
    sourceRef: text(row['source_ref']),
    issueId: optionalText(row['issue_id']),
    ticketKey: optionalText(row['ticket_key']),
    name: text(row['name']),
    executedAt: fromSqlTimestamp(row['executed_at']),
    status: oneOf(row['status'], STATUSES, 'unknown'),
    strength: oneOf(row['strength'], STRENGTHS, 'declared'),
    artifactRef: optionalText(row['artifact_ref']),
    authorRef: optionalText(row['author_ref']),
    disabledAt: row['disabled_at'] ? fromSqlTimestamp(row['disabled_at']) : undefined,
    zone: optionalText(row['zone']),
  };
}

export function linkToRow(value: Link): Row {
  return {
    id: value.id,
    criterion_id: value.criterionId,
    verification_id: value.verificationId,
    kind: value.kind,
    path: value.path,
    confidence: value.confidence,
    criterion_hash_at_link: value.criterionHashAtLink,
    established_at: toSqlTimestamp(value.establishedAt),
    confirmed_at: value.confirmedAt ? toSqlTimestamp(value.confirmedAt) : null,
    rejected_at: value.rejectedAt ? toSqlTimestamp(value.rejectedAt) : null,
    reject_reason: value.rejectReason ?? null,
    weights_json: value.weights ? toJson(value.weights) : null,
  };
}

export function rowToLink(row: Row): Link {
  return {
    id: text(row['id']),
    criterionId: text(row['criterion_id']),
    verificationId: text(row['verification_id']),
    kind: oneOf(row['kind'], LINK_KINDS, 'derived'),
    path: oneOf(row['path'], LINK_PATHS, 'similarity'),
    confidence: toNumber(row['confidence'], 0),
    criterionHashAtLink: text(row['criterion_hash_at_link']),
    establishedAt: fromSqlTimestamp(row['established_at']),
    confirmedAt: row['confirmed_at'] ? fromSqlTimestamp(row['confirmed_at']) : undefined,
    rejectedAt: row['rejected_at'] ? fromSqlTimestamp(row['rejected_at']) : undefined,
    rejectReason: optionalText(row['reject_reason']),
    weights: row['weights_json'] ? parseJson<Record<string, number>>(row['weights_json'], {}) : undefined,
  };
}
