/**
 * Mapping of the three judgements and of the proposals (§19): `perforation`,
 * `dangling`, `hole`, `proposal`.
 *
 * A perforation carries both dates — the change and the verification — because
 * the judgement is meaningless without them (§8.2, §22 explicability). A hole
 * carries the terms of the métré, so the score can always be explained (§11).
 */
import type { Dangling, Hole, Perforation, PriorityTerm, Proposal, ProposalPayload } from '../types';
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

export const PERFORATION_COLUMNS = [
  'id',
  'criterion_id',
  'verification_id',
  'ticket_key',
  'criterion_key',
  'criterion_version_no',
  'changed_at',
  'verified_at',
  'age_days',
  'klass',
  'state',
] as const;

export const DANGLING_COLUMNS = [
  'id',
  'verification_id',
  'verification_name',
  'reason',
  'detected_at',
  'impact_n',
  'state',
] as const;

export const HOLE_COLUMNS = [
  'id',
  'criterion_id',
  'ticket_key',
  'criterion_key',
  'kind',
  'zone',
  'priority_score',
  'priority_terms_json',
  'scope',
  'state',
  'proposal_id',
] as const;

export const PROPOSAL_COLUMNS = [
  'id',
  'type',
  'criterion_id',
  'payload_json',
  'created_at',
  'state',
  'decided_at',
  'decided_by_ref',
] as const;

const PERFORATION_CLASSES = ['fresh', 'dry', 'multiple'] as const;
const PERFORATION_STATES = ['open', 'reopened', 'reverified'] as const;
const DANGLING_REASONS = [
  'test-disabled',
  'test-renamed',
  'criterion-deleted',
  'build-not-running',
] as const;
const DANGLING_STATES = ['open', 'repaired', 'dismissed'] as const;
const HOLE_STATES = ['open', 'proposal', 'covered'] as const;
const PROPOSAL_TYPES = ['test-draft', 'reformulation', 'relink', 'retest'] as const;
const PROPOSAL_STATES = ['open', 'accepted', 'rejected'] as const;

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const raw = text(value, fallback);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function perforationToRow(value: Perforation): Row {
  return {
    id: value.id,
    criterion_id: value.criterionId,
    verification_id: value.verificationId,
    ticket_key: value.ticketKey,
    criterion_key: value.criterionKey,
    criterion_version_no: value.criterionVersionNo,
    changed_at: toSqlTimestamp(value.changedAt),
    verified_at: toSqlTimestamp(value.verifiedAt),
    age_days: value.ageDays,
    klass: value.klass,
    state: value.state,
  };
}

export function rowToPerforation(row: Row): Perforation {
  return {
    id: text(row['id']),
    criterionId: text(row['criterion_id']),
    verificationId: text(row['verification_id']),
    ticketKey: text(row['ticket_key']),
    criterionKey: text(row['criterion_key']),
    criterionVersionNo: toNumber(row['criterion_version_no'], 1),
    changedAt: fromSqlTimestamp(row['changed_at']),
    verifiedAt: fromSqlTimestamp(row['verified_at']),
    ageDays: toNumber(row['age_days'], 0),
    klass: oneOf(row['klass'], PERFORATION_CLASSES, 'fresh'),
    state: oneOf(row['state'], PERFORATION_STATES, 'open'),
  };
}

export function danglingToRow(value: Dangling): Row {
  return {
    id: value.id,
    verification_id: value.verificationId,
    verification_name: value.verificationName,
    reason: value.reason,
    detected_at: toSqlTimestamp(value.detectedAt),
    impact_n: value.impact,
    state: value.state,
  };
}

export function rowToDangling(row: Row): Dangling {
  return {
    id: text(row['id']),
    verificationId: text(row['verification_id']),
    verificationName: text(row['verification_name']),
    reason: oneOf(row['reason'], DANGLING_REASONS, 'test-disabled'),
    detectedAt: fromSqlTimestamp(row['detected_at']),
    impact: toNumber(row['impact_n'], 0),
    state: oneOf(row['state'], DANGLING_STATES, 'open'),
  };
}

export function holeToRow(value: Hole): Row {
  return {
    id: value.id,
    criterion_id: value.criterionId,
    ticket_key: value.ticketKey,
    criterion_key: value.criterionKey,
    kind: value.kind,
    zone: value.zone ?? null,
    priority_score: value.priorityScore,
    priority_terms_json: toJson(value.priorityTerms),
    scope: value.scope,
    state: value.state,
    proposal_id: value.proposalId ?? null,
  };
}

export function rowToHole(row: Row): Hole {
  return {
    id: text(row['id']),
    criterionId: text(row['criterion_id']),
    ticketKey: text(row['ticket_key']),
    criterionKey: text(row['criterion_key']),
    kind: text(row['kind'], 'functional') as Hole['kind'],
    zone: optionalText(row['zone']),
    priorityScore: toNumber(row['priority_score'], 0),
    priorityTerms: parseJson<PriorityTerm[]>(row['priority_terms_json'], []),
    scope: text(row['scope']),
    state: oneOf(row['state'], HOLE_STATES, 'open'),
    proposalId: optionalText(row['proposal_id']),
  };
}

export function proposalToRow(value: Proposal): Row {
  return {
    id: value.id,
    type: value.type,
    criterion_id: value.criterionId,
    payload_json: toJson(value.payload),
    created_at: toSqlTimestamp(value.createdAt),
    state: value.state,
    decided_at: value.decidedAt ? toSqlTimestamp(value.decidedAt) : null,
    decided_by_ref: value.decidedByRef ?? null,
  };
}

export function rowToProposal(row: Row): Proposal {
  return {
    id: text(row['id']),
    type: oneOf(row['type'], PROPOSAL_TYPES, 'test-draft'),
    criterionId: text(row['criterion_id']),
    payload: parseJson<ProposalPayload>(row['payload_json'], {
      kind: 'test-draft',
      title: '',
      body: '',
      expectedForm: 'declaration',
    }),
    createdAt: fromSqlTimestamp(row['created_at']),
    state: oneOf(row['state'], PROPOSAL_STATES, 'open'),
    decidedAt: row['decided_at'] ? fromSqlTimestamp(row['decided_at']) : undefined,
    decidedByRef: optionalText(row['decided_by_ref']),
  };
}
