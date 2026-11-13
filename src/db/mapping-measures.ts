/**
 * Mapping of the measures (§19): `coverage_snapshot`, `zone_risk`,
 * `metric_rule`, `witness`, `coverage_event`, `cursor`, `budget`.
 *
 * Three of these entities have no natural identifier in the domain — a
 * coverage is a dated measure, a zone risk is a (scope, zone) pair, a cursor a
 * (scope, mode) pair — so the caller supplies the primary key and the mapping
 * keeps it out of the domain object.
 *
 * A coverage row keeps the three axes in separate columns: strength, link kind
 * and freshness are never merged, not even in storage (§8.1, §22).
 */
import type {
  BlindSpot,
  Budget,
  Coverage,
  CoverageEvent,
  Cursor,
  MetricRule,
  Witness,
  ZoneRisk,
} from '../types';
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

export const COVERAGE_COLUMNS = [
  'id',
  'scope',
  'scope_type',
  'computed_at',
  'criteria_n',
  'criteria_falsifiable',
  'unfalsifiable_n',
  'covered_declared',
  'covered_provisional',
  'covered_machine',
  'covered_attested',
  'covered_stale',
  'holes_n',
  'dangling_n',
  'perforations_n',
  'proven_n',
  'blind_json',
] as const;

export const ZONE_RISK_COLUMNS = [
  'id',
  'scope',
  'zone',
  'defect_n',
  'last_defect_at',
  'open_incident_n',
  'score',
  'computed_at',
] as const;

export const METRIC_RULE_COLUMNS = [
  'id',
  'scope',
  'weight_json',
  'updated_at',
  'updated_by_ref',
] as const;

export const WITNESS_COLUMNS = [
  'id',
  'scope',
  'scope_type',
  'period',
  'coverage_json',
  'computed_at',
  'bulletin_ref',
] as const;

export const EVENT_COLUMNS = ['id', 'scope', 'event', 'at', 'payload_json'] as const;

export const CURSOR_COLUMNS = [
  'id',
  'scope',
  'mode',
  'last_issue_id',
  'last_modified_at',
  'run_at',
] as const;

export const BUDGET_COLUMNS = ['id', 'day', 'llm_calls', 'tokens', 'cost_estimate'] as const;

const SCOPE_TYPES = ['ticket', 'sprint', 'project', 'version'] as const;
const CURSOR_MODES = ['criteria', 'verifications', 'links', 'measures'] as const;

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const raw = text(value, fallback);
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

/** Primary keys of the entities that have none in the domain. */
export function coverageId(scope: string, scopeType: string, computedAt: string): string {
  return `${scope}|${scopeType}|${computedAt}`;
}

export function zoneRiskId(scope: string, zone: string): string {
  return `${scope}::${zone}`;
}

export function cursorId(scope: string, mode: string): string {
  return `${scope}::${mode}`;
}

export function coverageToRow(value: Coverage, id: string): Row {
  return {
    id,
    scope: value.scope,
    scope_type: value.scopeType,
    computed_at: toSqlTimestamp(value.computedAt),
    criteria_n: value.criteriaTotal,
    criteria_falsifiable: value.criteriaFalsifiable,
    unfalsifiable_n: value.unfalsifiableCount,
    covered_declared: value.coveredDeclared,
    covered_provisional: value.coveredProvisional,
    covered_machine: value.byStrength.machine,
    covered_attested: value.byStrength.attested,
    covered_stale: value.byFreshness.stale,
    holes_n: value.holes,
    dangling_n: value.dangling,
    perforations_n: value.perforations,
    proven_n: value.proven,
    blind_json: toJson({ byStrength: value.byStrength, byLink: value.byLink, byFreshness: value.byFreshness, blindSpots: value.blindSpots }),
  };
}

export function rowToCoverage(row: Row): Coverage {
  const extra = parseJson<{
    byStrength?: Coverage['byStrength'];
    byLink?: Coverage['byLink'];
    byFreshness?: Coverage['byFreshness'];
    blindSpots?: BlindSpot[];
  }>(row['blind_json'], {});
  return {
    scope: text(row['scope']),
    scopeType: oneOf(row['scope_type'], SCOPE_TYPES, 'project'),
    computedAt: fromSqlTimestamp(row['computed_at']),
    criteriaTotal: toNumber(row['criteria_n']),
    criteriaFalsifiable: toNumber(row['criteria_falsifiable']),
    unfalsifiableCount: toNumber(row['unfalsifiable_n']),
    byStrength: {
      machine: toNumber(row['covered_machine']),
      attested: toNumber(row['covered_attested']),
      declared: extra.byStrength?.declared ?? 0,
    },
    byLink: extra.byLink ?? { declared: toNumber(row['covered_declared']), confirmed: 0, derived: 0 },
    byFreshness: {
      current: extra.byFreshness?.current ?? 0,
      stale: toNumber(row['covered_stale']),
    },
    coveredDeclared: toNumber(row['covered_declared']),
    coveredProvisional: toNumber(row['covered_provisional']),
    holes: toNumber(row['holes_n']),
    dangling: toNumber(row['dangling_n']),
    perforations: toNumber(row['perforations_n']),
    proven: toNumber(row['proven_n']),
    blindSpots: extra.blindSpots ?? [],
  };
}

export function zoneRiskToRow(value: ZoneRisk): Row {
  return {
    id: zoneRiskId(value.scope, value.zone),
    scope: value.scope,
    zone: value.zone,
    defect_n: value.defectCount,
    last_defect_at: value.lastDefectAt ? toSqlTimestamp(value.lastDefectAt) : null,
    open_incident_n: value.openIncidentCount,
    score: value.score,
    computed_at: toSqlTimestamp(value.computedAt),
  };
}

export function rowToZoneRisk(row: Row): ZoneRisk {
  return {
    scope: text(row['scope']),
    zone: text(row['zone']),
    defectCount: toNumber(row['defect_n']),
    lastDefectAt: row['last_defect_at'] ? fromSqlTimestamp(row['last_defect_at']) : undefined,
    openIncidentCount: toNumber(row['open_incident_n']),
    score: toNumber(row['score']),
    computedAt: fromSqlTimestamp(row['computed_at']),
  };
}

export function metricRuleToRow(value: MetricRule): Row {
  return {
    id: value.id,
    scope: value.scope,
    weight_json: toJson(value.weights),
    updated_at: toSqlTimestamp(value.updatedAt),
    updated_by_ref: value.updatedByRef ?? null,
  };
}

export function rowToMetricRule(row: Row): MetricRule {
  const weights = parseJson<MetricRule['weights']>(row['weight_json'], {
    kind: {
      functional: 0.5,
      'edge-case': 0.7,
      'non-regression': 0.9,
      security: 1,
      performance: 0.4,
      experience: 0.2,
      documentation: 0.2,
    },
    zoneRisk: 0.6,
    recurrence: 0.5,
  });
  return {
    id: text(row['id']),
    scope: text(row['scope']),
    weights,
    updatedAt: fromSqlTimestamp(row['updated_at']),
    updatedByRef: optionalText(row['updated_by_ref']),
  };
}

export function witnessToRow(value: Witness): Row {
  return {
    id: value.id,
    scope: value.scope,
    scope_type: value.scopeType,
    period: value.period,
    coverage_json: toJson(value.coverage),
    computed_at: toSqlTimestamp(value.computedAt),
    bulletin_ref: value.bulletinRef ?? null,
  };
}

export function rowToWitness(row: Row): Witness {
  return {
    id: text(row['id']),
    scope: text(row['scope']),
    scopeType: oneOf(row['scope_type'], SCOPE_TYPES, 'project'),
    period: text(row['period']),
    coverage: parseJson<Witness['coverage']>(row['coverage_json'], {
      scope: text(row['scope']),
    } as Witness['coverage']),
    computedAt: fromSqlTimestamp(row['computed_at']),
    bulletinRef: optionalText(row['bulletin_ref']),
  };
}

export function eventToRow(value: CoverageEvent): Row {
  return {
    id: value.id,
    scope: value.scope,
    event: value.event,
    at: toSqlTimestamp(value.at),
    payload_json: value.payload ? toJson(value.payload) : null,
  };
}

export function rowToEvent(row: Row): CoverageEvent {
  return {
    id: text(row['id']),
    scope: text(row['scope']),
    event: text(row['event'], 'criterion-added') as CoverageEvent['event'],
    at: fromSqlTimestamp(row['at']),
    payload: row['payload_json'] ? parseJson<Record<string, unknown>>(row['payload_json'], {}) : undefined,
  };
}

export function cursorToRow(value: Cursor): Row {
  return {
    id: cursorId(value.scope, value.mode),
    scope: value.scope,
    mode: value.mode,
    last_issue_id: value.lastIssueId ?? null,
    last_modified_at: value.lastModifiedAt ? toSqlTimestamp(value.lastModifiedAt) : null,
    run_at: toSqlTimestamp(value.runAt),
  };
}

export function rowToCursor(row: Row): Cursor {
  return {
    scope: text(row['scope']),
    mode: oneOf(row['mode'], CURSOR_MODES, 'criteria'),
    lastIssueId: optionalText(row['last_issue_id']),
    lastModifiedAt: row['last_modified_at'] ? fromSqlTimestamp(row['last_modified_at']) : undefined,
    runAt: fromSqlTimestamp(row['run_at']),
  };
}

export function budgetToRow(value: Budget): Row {
  return {
    id: value.day,
    day: value.day,
    llm_calls: value.llmCalls,
    tokens: value.tokens,
    cost_estimate: value.costEstimate,
  };
}

export function rowToBudget(row: Row): Budget {
  return {
    day: text(row['day']),
    llmCalls: toNumber(row['llm_calls']),
    tokens: toNumber(row['tokens']),
    costEstimate: toNumber(row['cost_estimate']),
  };
}
