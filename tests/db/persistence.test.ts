/**
 * The persistence layer: schema, mappings, and the shape of the SQL the store
 * emits. The semantics of the store itself are specified in
 * `tests/contract/store.test.ts` and run against the in-memory store.
 */
import { describe, expect, it } from 'vitest';
import { TABLES, ddlOf, migrations } from '../../src/db/schema.js';
import { createStore } from '../../src/db/repo.js';
import { scopeWhere } from '../../src/db/repo.js';
import {
  criterionToRow,
  rowToCriterion,
  criterionVersionToRow,
  rowToCriterionVersion,
  verificationToRow,
  rowToVerification,
  linkToRow,
  rowToLink,
  perforationToRow,
  rowToPerforation,
  danglingToRow,
  rowToDangling,
  holeToRow,
  rowToHole,
  proposalToRow,
  rowToProposal,
  coverageToRow,
  rowToCoverage,
  zoneRiskToRow,
  rowToZoneRisk,
  metricRuleToRow,
  rowToMetricRule,
  witnessToRow,
  rowToWitness,
  eventToRow,
  rowToEvent,
  cursorToRow,
  rowToCursor,
  budgetToRow,
  rowToBudget,
} from '../../src/db/mapping.js';
import { createRecordingSqlClient } from '../helpers/fake-sql.js';
import { makeCriterion, makeLink, makeVerification, PROJECT, TICKET } from '../helpers/index.js';
import type { Coverage } from '../../src/types.js';

const COVERAGE: Coverage = {
  scope: PROJECT,
  scopeType: 'project',
  computedAt: '2026-11-12T09:00:00.000Z',
  criteriaTotal: 4,
  criteriaFalsifiable: 3,
  unfalsifiableCount: 1,
  byStrength: { machine: 1, attested: 0, declared: 1 },
  byLink: { declared: 2, confirmed: 0, derived: 1 },
  byFreshness: { current: 1, stale: 1 },
  coveredDeclared: 2,
  coveredProvisional: 1,
  holes: 1,
  dangling: 1,
  perforations: 1,
  proven: 0,
  blindSpots: [{ absence: 'no-right', objectType: 'test-execution', detail: 'droit manquant' }],
};

describe('schéma (§19)', () => {
  it('déclare les quinze tables', () => {
    expect(TABLES).toHaveLength(15);
    expect([...TABLES]).toEqual([
      'criterion',
      'criterion_version',
      'verification',
      'link',
      'coverage_snapshot',
      'perforation',
      'dangling',
      'hole',
      'proposal',
      'zone_risk',
      'metric_rule',
      'witness',
      'coverage_event',
      'cursor',
      'budget',
    ]);
  });

  it('écrit un DDL idempotent par table', () => {
    for (const table of TABLES) {
      const ddl = ddlOf(table);
      expect(ddl, table).toContain('CREATE TABLE IF NOT EXISTS');
      expect(ddl, table).toContain(table);
    }
    expect(migrations()).toHaveLength(15);
  });

  it('ne stocke aucune statistique par personne (§5)', () => {
    for (const table of TABLES) {
      const ddl = ddlOf(table);
      expect(ddl, table).not.toMatch(/GROUP BY/i);
      expect(ddl, table).not.toMatch(/score_by_?(person|user|team|author)/i);
    }
  });
});

describe('mapping aller-retour', () => {
  it('critère et version', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-7', kind: 'security' });
    expect(rowToCriterion(criterionToRow(criterion))).toEqual(criterion);
    const version = {
      id: 'v1',
      criterionId: criterion.id,
      versionNo: 2,
      textHash: 'h2',
      changedAt: '2026-11-01T10:00:00.000Z',
      changeKind: 'edited' as const,
    };
    expect(rowToCriterionVersion(criterionVersionToRow(version))).toEqual(version);
  });

  it('acte de vérification', () => {
    const verification = makeVerification({ id: 'v1', form: 'manual-case', status: 'failed' });
    expect(rowToVerification(verificationToRow(verification))).toEqual(verification);
  });

  it('liaison, perforation, fil détendu, trou et proposition', () => {
    const link = makeLink({ id: 'l1', kind: 'derived', confidence: 0.91 });
    expect(rowToLink(linkToRow(link))).toEqual(link);
    const perforation = {
      id: 'p1',
      criterionId: 'c1',
      verificationId: 'v1',
      ticketKey: TICKET,
      criterionKey: 'AC-1',
      criterionVersionNo: 2,
      changedAt: '2026-11-01T00:00:00.000Z',
      verifiedAt: '2026-10-01T00:00:00.000Z',
      ageDays: 31,
      klass: 'dry' as const,
      state: 'open' as const,
    };
    expect(rowToPerforation(perforationToRow(perforation))).toEqual(perforation);
    const dangling = {
      id: 'd1',
      verificationId: 'v1',
      verificationName: 'TRAME-1.testShouldCountHoles',
      reason: 'test-disabled' as const,
      detectedAt: '2026-11-02T00:00:00.000Z',
      impact: 1,
      state: 'open' as const,
    };
    expect(rowToDangling(danglingToRow(dangling))).toEqual(dangling);
    const hole = {
      id: 'h1',
      criterionId: 'c1',
      ticketKey: TICKET,
      criterionKey: 'AC-1',
      kind: 'security' as const,
      zone: 'src/weave',
      priorityScore: 0.86,
      priorityTerms: [{ name: 'kind' as const, weight: 1, value: 1, because: 'sécurité' }],
      scope: PROJECT,
      state: 'open' as const,
    };
    expect(rowToHole(holeToRow(hole))).toEqual(hole);
    const proposal = {
      id: 'pr1',
      type: 'test-draft' as const,
      criterionId: 'c1',
      payload: {
        kind: 'test-draft' as const,
        title: 'Test AC-1',
        body: 'should weave',
        expectedForm: 'automated-test' as const,
      },
      createdAt: '2026-11-03T00:00:00.000Z',
      state: 'open' as const,
    };
    expect(rowToProposal(proposalToRow(proposal))).toEqual(proposal);
  });

  it('mesures : couverture, zone, métré, témoin, événement, curseur, budget', () => {
    const row = coverageToRow(COVERAGE, 'cov-1');
    expect(rowToCoverage(row)).toEqual(COVERAGE);
    const zone = {
      scope: PROJECT,
      zone: 'src/weave',
      defectCount: 3,
      lastDefectAt: '2026-10-01T00:00:00.000Z',
      openIncidentCount: 1,
      score: 0.7,
      computedAt: '2026-11-12T00:00:00.000Z',
    };
    expect(rowToZoneRisk(zoneRiskToRow(zone))).toEqual(zone);
    const rule = {
      id: 'm1',
      scope: PROJECT,
      weights: {
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
      },
      updatedAt: '2026-11-12T00:00:00.000Z',
    };
    expect(rowToMetricRule(metricRuleToRow(rule))).toEqual(rule);
    const witness = {
      id: 'w1',
      scope: PROJECT,
      scopeType: 'project' as const,
      period: 'Sprint 7',
      coverage: COVERAGE,
      computedAt: '2026-11-12T00:00:00.000Z',
    };
    expect(rowToWitness(witnessToRow(witness))).toEqual(witness);
    const event = {
      id: 'e1',
      scope: PROJECT,
      event: 'criterion-changed' as const,
      at: '2026-11-12T00:00:00.000Z',
      payload: { criterionId: 'c1' },
    };
    expect(rowToEvent(eventToRow(event))).toEqual(event);
    const cursor = {
      scope: PROJECT,
      mode: 'criteria' as const,
      lastIssueId: 'TRAME-1',
      runAt: '2026-11-12T00:00:00.000Z',
    };
    expect(rowToCursor(cursorToRow(cursor))).toEqual(cursor);
    const budget = { day: '2026-11-12', llmCalls: 3, tokens: 120, costEstimate: 0.01 };
    expect(rowToBudget(budgetToRow(budget))).toEqual(budget);
  });

  it('ne lève jamais sur une ligne illisible (§22)', () => {
    expect(() => rowToCriterion({})).not.toThrow();
    expect(() => rowToVerification({ id: 'v' })).not.toThrow();
    expect(() => rowToCoverage({ scope: 'x', coverage_json: '{cassé' })).not.toThrow();
    expect(rowToCriterion({}).falsifiable).toBe(true);
  });
});

describe('store SQL', () => {
  it('écrit avec un INSERT rejouable et les bons paramètres', async () => {
    const sql = createRecordingSqlClient();
    const store = createStore(sql);
    await store.putCriterion(makeCriterion({ criterionKey: 'AC-1' }));
    const statement = sql.last()?.statement ?? '';
    expect(statement).toContain('INSERT INTO criterion');
    expect(statement).toContain('ON DUPLICATE KEY UPDATE');
    expect(sql.last()?.params.length).toBe(17);
  });

  it('borne chaque lecture : un WHERE et un LIMIT', async () => {
    const sql = createRecordingSqlClient();
    const store = createStore(sql);
    await store.listCriteria({ scopeType: 'ticket', scope: TICKET });
    const statement = sql.last()?.statement ?? '';
    expect(statement).toContain('WHERE');
    expect(statement).toContain('LIMIT');
    expect(statement).not.toContain('LIMIT 0');
  });

  it('filtre un périmètre large sur les ScopeRef', () => {
    const where = scopeWhere({ scopeType: 'project', scope: 'TRAME' });
    expect(where.sql).toContain('scope_json');
    // Le motif est un paramètre lié, jamais concaténé dans la requête.
    expect(where.params).toEqual(['%"scopeType":"project","scope":"TRAME"%']);
  });

  it('cumule le budget du jour', async () => {
    const sql = createRecordingSqlClient();
    const store = createStore(sql);
    await store.addBudget('2026-11-12', 2, 100, 0.01);
    const statement = sql.last()?.statement ?? '';
    expect(statement).toContain('ON DUPLICATE KEY UPDATE');
    expect(statement).toContain('llm_calls = llm_calls + VALUES(llm_calls)');
  });

  it('écrit une couverture datée, rejouable par sa clé composite', async () => {
    const sql = createRecordingSqlClient();
    const store = createStore(sql);
    await store.putCoverage(COVERAGE);
    const statement = sql.last()?.statement ?? '';
    expect(statement).toContain('INSERT INTO coverage_snapshot');
    expect(sql.last()?.params[0]).toContain(`${PROJECT}|project|`);
  });
});
