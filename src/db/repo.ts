/**
 * `TrameStore` on Forge SQL: one generic table adapter per entity, plus the
 * four entities whose key is composite or cumulative (coverage, zone risk,
 * cursor, budget).
 *
 * Every read is bounded (`WHERE` + `LIMIT`, `table.ts`), every write is
 * replayable (`INSERT … ON DUPLICATE KEY UPDATE`), and nothing is deleted: a
 * criterion keeps its versions, a verification keeps its `disabled_at` (§18).
 *
 * Scope filtering: a criterion carries its `ScopeRef` list as JSON, so a
 * sprint/project/version scope is a bounded `LIKE` on that column, and a ticket
 * scope is an equality on `ticket_key`. Verifications, perforations and
 * dangling threads are reached through the ticket keys of the scope — the same
 * join the in-memory store performs (`tests/contract/store.test.ts`).
 *
 * The store is cut in five parts, each a function under 50 lines; the
 * assembly is `createStore`.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type { ScopeRef, ScopeType } from '../types';
import type {
  Budget,
  Coverage,
  CoverageEvent,
  Criterion,
  CriterionVersion,
  Cursor,
  Dangling,
  Hole,
  Link,
  MetricRule,
  Perforation,
  Proposal,
  Witness,
  ZoneRisk,
  Verification,
} from '../types';
import type { TrameStore } from '../ports';
import type { SqlClient } from './sql-client';
import type { Row } from './mapping-common';
import { toNumber } from './mapping-common';
import { and, createTable, eq, gte, isNull, like, type Where } from './table';
import {
  CRITERION_COLUMNS,
  CRITERION_VERSION_COLUMNS,
  criterionToRow,
  criterionVersionToRow,
  rowToCriterion,
  rowToCriterionVersion,
} from './mapping-criteria';
import {
  LINK_COLUMNS,
  VERIFICATION_COLUMNS,
  linkToRow,
  rowToLink,
  rowToVerification,
  verificationToRow,
} from './mapping-verifications';
import {
  DANGLING_COLUMNS,
  HOLE_COLUMNS,
  PERFORATION_COLUMNS,
  PROPOSAL_COLUMNS,
  danglingToRow,
  holeToRow,
  perforationToRow,
  proposalToRow,
  rowToDangling,
  rowToHole,
  rowToPerforation,
  rowToProposal,
} from './mapping-findings';
import {
  COVERAGE_COLUMNS,
  CURSOR_COLUMNS,
  EVENT_COLUMNS,
  METRIC_RULE_COLUMNS,
  WITNESS_COLUMNS,
  ZONE_RISK_COLUMNS,
  coverageId,
  coverageToRow,
  cursorToRow,
  eventToRow,
  metricRuleToRow,
  rowToCoverage,
  rowToCursor,
  rowToEvent,
  rowToMetricRule,
  rowToWitness,
  rowToZoneRisk,
  witnessToRow,
  zoneRiskToRow,
} from './mapping-measures';
import { valuesOf } from './mapping-common';

/** A part of the store: the assembly merges them into a `TrameStore`. */
type StorePart = Partial<TrameStore>;

/** A bounded `IN` clause; an empty list matches nothing. */
function inList(column: string, values: readonly string[]): Where {
  if (values.length === 0) return { sql: '1 = 0', params: [] };
  return { sql: `${column} IN (${values.map(() => '?').join(', ')})`, params: [...values] };
}

/** The `WHERE` that reads a scope: ticket by key, wider scope by ScopeRef. */
export function scopeWhere(scope: ScopeRef): Where {
  if (scope.scopeType === 'ticket') return eq('ticket_key', scope.scope);
  return like('scope_json', `%"scopeType":"${scope.scopeType}","scope":"${scope.scope}"%`);
}

function upsertStatement(table: string, columns: readonly string[]): string {
  const placeholders = columns.map(() => '?').join(', ');
  const updated = columns.filter((column) => column !== 'id');
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updated.map((c) => `${c} = VALUES(${c})`).join(', ')}`;
}

/** Criteria and their versions (§19). */
function createCriteriaStore(sql: SqlClient): StorePart {
  const criteria = createTable<Criterion>(sql, {
    table: 'criterion',
    columns: CRITERION_COLUMNS,
    toRow: criterionToRow,
    fromRow: rowToCriterion,
  });
  const versions = createTable<CriterionVersion>(sql, {
    table: 'criterion_version',
    columns: CRITERION_VERSION_COLUMNS,
    toRow: criterionVersionToRow,
    fromRow: rowToCriterionVersion,
  });
  return {
    putCriterion: (criterion) => criteria.upsert(criterion),
    getCriterion: (id) => criteria.findById(id),
    findCriterion: (issueId, criterionKey) =>
      criteria.findOne(
        and(eq('issue_id', issueId), eq('criterion_key', criterionKey), isNull('deleted_at')),
      ),
    listCriteria: (scope) => criteria.select(and(scopeWhere(scope), isNull('deleted_at'))),
    putCriterionVersion: (version) => versions.upsert(version),
    listVersions: (criterionId) =>
      versions.select(eq('criterion_id', criterionId), { orderBy: 'version_no ASC' }),
  };
}

/** Verification acts (§19): a ticket scope is its key, a wider scope its join. */
function createVerificationStore(sql: SqlClient, ticketKeys: (scope: ScopeRef) => Promise<string[]>) {
  const verifications = createTable<Verification>(sql, {
    table: 'verification',
    columns: VERIFICATION_COLUMNS,
    toRow: verificationToRow,
    fromRow: rowToVerification,
  });
  return {
    putVerification: (verification: Verification) => verifications.upsert(verification),
    getVerification: (id: string) => verifications.findById(id),
    listVerifications: async (scope: ScopeRef) =>
      verifications.select(
        scope.scopeType === 'ticket'
          ? eq('ticket_key', scope.scope)
          : inList('ticket_key', await ticketKeys(scope)),
      ),
  };
}

/** The meshes (§9). */
function createLinkStore(sql: SqlClient): StorePart {
  const links = createTable<Link>(sql, {
    table: 'link',
    columns: LINK_COLUMNS,
    toRow: linkToRow,
    fromRow: rowToLink,
  });
  return {
    putLink: (link) => links.upsert(link),
    getLink: (id) => links.findById(id),
    listLinks: (criterionId) =>
      links.select(and(eq('criterion_id', criterionId), isNull('rejected_at'))),
    listLinksOfVerification: (verificationId) =>
      links.select(and(eq('verification_id', verificationId), isNull('rejected_at'))),
    listDerivedLinksSince: (at) => links.select(and(eq('kind', 'derived'), gte('established_at', at))),
  };
}

/** The tables of the three judgements and of the proposals (§19). */
function findingTables(sql: SqlClient) {
  return {
    perforations: createTable<Perforation>(sql, {
      table: 'perforation',
      columns: PERFORATION_COLUMNS,
      toRow: perforationToRow,
      fromRow: rowToPerforation,
    }),
    dangling: createTable<Dangling>(sql, {
      table: 'dangling',
      columns: DANGLING_COLUMNS,
      toRow: danglingToRow,
      fromRow: rowToDangling,
    }),
    holes: createTable<Hole>(sql, {
      table: 'hole',
      columns: HOLE_COLUMNS,
      toRow: holeToRow,
      fromRow: rowToHole,
    }),
    proposals: createTable<Proposal>(sql, {
      table: 'proposal',
      columns: PROPOSAL_COLUMNS,
      toRow: proposalToRow,
      fromRow: rowToProposal,
    }),
    verifications: createTable<Verification>(sql, {
      table: 'verification',
      columns: VERIFICATION_COLUMNS,
      toRow: verificationToRow,
      fromRow: rowToVerification,
    }),
  };
}

/** The three judgements and the proposals (§19). */
function createFindingStore(
  sql: SqlClient,
  ticketKeys: (scope: ScopeRef) => Promise<string[]>,
): StorePart {
  const { perforations, dangling, holes, proposals, verifications } = findingTables(sql);
  return {
    putPerforation: (perforation) => perforations.upsert(perforation),
    listPerforations: async (scope: ScopeRef, ageDays?: number) => {
      const clauses = [inList('ticket_key', await ticketKeys(scope)), eq('state', 'open')];
      if (ageDays !== undefined) clauses.push(gte('age_days', ageDays));
      return perforations.select(and(...clauses), { orderBy: 'age_days DESC' });
    },
    putDangling: (row) => dangling.upsert(row),
    listDangling: async (scope: ScopeRef) => {
      const acts = await verifications.select(inList('ticket_key', await ticketKeys(scope)));
      return dangling.select(
        and(inList('verification_id', acts.map((act) => act.id)), eq('state', 'open')),
      );
    },
    putHole: (hole) => holes.upsert(hole),
    listHoles: async (scope: ScopeRef, limit: number) => {
      const rows = await holes.select(
        scope.scopeType === 'ticket' ? eq('ticket_key', scope.scope) : eq('scope', scope.scope),
        { orderBy: 'priority_score DESC', limit },
      );
      return rows.filter((hole) => hole.state !== 'covered');
    },
    putProposal: (proposal) => proposals.upsert(proposal),
    getProposal: (id) => proposals.findById(id),
    listProposals: (state) => proposals.select(eq('state', state), { orderBy: 'created_at DESC' }),
  };
}

/** The measures: coverage, zones, métré, witnesses, events, cursor, budget. */
function createMeasureStore(sql: SqlClient): StorePart {
  const witnesses = createTable<Witness>(sql, {
    table: 'witness',
    columns: WITNESS_COLUMNS,
    toRow: witnessToRow,
    fromRow: rowToWitness,
  });
  const events = createTable<CoverageEvent>(sql, {
    table: 'coverage_event',
    columns: EVENT_COLUMNS,
    toRow: eventToRow,
    fromRow: rowToEvent,
  });
  return {
    putCoverage: async (coverage: Coverage) => {
      const row = coverageToRow(
        coverage,
        coverageId(coverage.scope, coverage.scopeType, coverage.computedAt),
      );
      await sql.execute(
        upsertStatement('coverage_snapshot', COVERAGE_COLUMNS),
        valuesOf(row, COVERAGE_COLUMNS),
      );
    },
    getCoverage: async (scope: string, scopeType: ScopeType) => {
      const rows = await sql.query<Row>(
        `SELECT ${COVERAGE_COLUMNS.join(', ')} FROM coverage_snapshot
         WHERE scope = ? AND scope_type = ? ORDER BY computed_at DESC LIMIT 1`,
        [scope, scopeType],
      );
      return rows[0] ? rowToCoverage(rows[0]) : null;
    },
    listCoverageTimeline: async (scope: string, scopeType: ScopeType, limit: number) => {
      const rows = await sql.query<Row>(
        `SELECT ${COVERAGE_COLUMNS.join(', ')} FROM coverage_snapshot
         WHERE scope = ? AND scope_type = ? ORDER BY computed_at DESC LIMIT ${Math.max(1, limit)}`,
        [scope, scopeType],
      );
      return rows.map((row) => rowToCoverage(row));
    },
    putZoneRisk: async (risk: ZoneRisk) => {
      await sql.execute(
        upsertStatement('zone_risk', ZONE_RISK_COLUMNS),
        valuesOf(zoneRiskToRow(risk), ZONE_RISK_COLUMNS),
      );
    },
    listZoneRisks: async (scope: string) => {
      const rows = await sql.query<Row>(
        `SELECT ${ZONE_RISK_COLUMNS.join(', ')} FROM zone_risk WHERE scope = ?
         ORDER BY score DESC LIMIT 500`,
        [scope],
      );
      return rows.map((row) => rowToZoneRisk(row));
    },
    getMetricRule: async (scope: string) => {
      const rows = await sql.query<Row>(
        `SELECT ${METRIC_RULE_COLUMNS.join(', ')} FROM metric_rule WHERE scope = ? LIMIT 1`,
        [scope],
      );
      return rows[0] ? rowToMetricRule(rows[0]) : null;
    },
    putMetricRule: async (rule: MetricRule) => {
      await sql.execute(
        upsertStatement('metric_rule', METRIC_RULE_COLUMNS),
        valuesOf(metricRuleToRow(rule), METRIC_RULE_COLUMNS),
      );
    },
    putWitness: (witness) => witnesses.upsert(witness),
    lastWitness: (scope: string, scopeType: ScopeType) =>
      witnesses.findOne(and(eq('scope', scope), eq('scope_type', scopeType)), {
        orderBy: 'computed_at DESC',
      }),
    putEvent: (event) => events.upsert(event),
    listScopes: async (limit: number) => {
      const rows = await sql.query<Row>(
        'SELECT DISTINCT scope FROM coverage_event ORDER BY scope LIMIT ?',
        [Math.max(1, limit)],
      );
      return rows.map((row) => String(row['scope'] ?? '')).filter(Boolean);
    },
    listEvents: (scope: string, limit: number) =>
      events.select(eq('scope', scope), { orderBy: 'at DESC', limit }),
    getCursor: async (scope: string, mode: Cursor['mode']) => {
      const rows = await sql.query<Row>(
        `SELECT ${CURSOR_COLUMNS.join(', ')} FROM cursor WHERE scope = ? AND mode = ? LIMIT 1`,
        [scope, mode],
      );
      return rows[0] ? rowToCursor(rows[0]) : null;
    },
    putCursor: async (cursor: Cursor) => {
      await sql.execute(
        upsertStatement('cursor', CURSOR_COLUMNS),
        valuesOf(cursorToRow(cursor), CURSOR_COLUMNS),
      );
    },
    addBudget: async (day: string, calls: number, tokens: number, cost: number) => {
      await sql.execute(
        `INSERT INTO budget (id, day, llm_calls, tokens, cost_estimate) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE llm_calls = llm_calls + VALUES(llm_calls),
           tokens = tokens + VALUES(tokens), cost_estimate = cost_estimate + VALUES(cost_estimate)`,
        [day, day, calls, tokens, cost],
      );
    },
    getBudget: async (day: string) => {
      const rows = await sql.query<Row>(
        'SELECT id, day, llm_calls, tokens, cost_estimate FROM budget WHERE day = ? LIMIT 1',
        [day],
      );
      if (!rows[0]) return null;
      const row = rows[0];
      const budget: Budget = {
        day: String(row['day'] ?? day),
        llmCalls: toNumber(row['llm_calls']),
        tokens: toNumber(row['tokens']),
        costEstimate: toNumber(row['cost_estimate']),
      };
      return budget;
    },
  };
}

/** The complete store, as `createAppDeps` sees it. */
export function createStore(sql: SqlClient): TrameStore {
  const criteria = createCriteriaStore(sql);
  const ticketKeys = async (scope: ScopeRef): Promise<string[]> => {
    const rows = (await criteria.listCriteria?.(scope)) ?? [];
    return [...new Set(rows.map((criterion) => criterion.ticketKey))];
  };
  return {
    ...criteria,
    ...createVerificationStore(sql, ticketKeys),
    ...createLinkStore(sql),
    ...createFindingStore(sql, ticketKeys),
    ...createMeasureStore(sql),
  } as TrameStore;
}
