/**
 * Tests du bulletin de trame (§12.4) et du témoin qui le rend comparable.
 *
 * Le bulletin est ce que lit une revue de sprint : une trame datée, ses
 * perforations, ses fils détendus, la part de critères infalsifiables, la part de
 * critères ajoutés pendant le sprint, et les trous prioritaires. Il est daté et
 * comparable au témoin précédent (§24.13).
 */
import { describe, expect, it } from 'vitest';
import { buildBulletin } from '../../src/domain/bulletin.js';
import { computeCoverage } from '../../src/domain/coverage.js';
import { conclusion, hasNoCriterion } from '../../src/domain/percent.js';
import { comparableTo, previousWitness, saveWitness } from '../../src/domain/witness.js';
import { coverageTimeline } from '../../src/domain/timeline.js';
import type { Coverage, Hole } from '../../src/types.js';
import { buildScenario } from '../helpers/index.js';
import { AT, PREVIOUS_AT, crit, previousScope, referenceScope } from './fixtures.js';

/** La trame du sprint courant, datée. */
function currentCoverage(): Coverage {
  const scope = referenceScope();
  return computeCoverage({
    ...scope,
    scope: 'TRAME-1',
    scopeType: 'ticket',
    computedAt: AT,
  });
}

/** La trame du sprint précédent, datée : AC-3 n'était pas encore couvert. */
function earlierCoverage(): Coverage {
  const scope = previousScope();
  return computeCoverage({
    ...scope,
    scope: 'TRAME-1',
    scopeType: 'ticket',
    computedAt: PREVIOUS_AT,
  });
}

/** Un trou, tel que le métré le produit (§11). */
function hole(key: string, score: number): Hole {
  const criterion = crit(key);
  return {
    id: `hole_${key}`,
    criterionId: criterion.id,
    ticketKey: 'TRAME-1',
    criterionKey: key,
    kind: 'security',
    priorityScore: score,
    priorityTerms: [{ name: 'kind', weight: 1, value: 1, because: 'critère de sécurité' }],
    scope: 'TRAME-1',
    state: 'open',
  };
}

describe('bulletin — §24.13 daté et comparable au témoin précédent', () => {
  it('§24.13 — le bulletin porte sa date et celle du témoin précédent', async () => {
    const { deps } = await buildScenario();
    const previous = await saveWitness(deps, 'TRAME-1', 'ticket', 'Sprint 6', earlierCoverage());
    const bulletin = buildBulletin({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      coverage: currentCoverage(),
      previous,
    });
    expect(bulletin.computedAt).toBe(AT);
    expect(bulletin.previous?.computedAt).toBe(PREVIOUS_AT);
    expect(bulletin.previous?.period).toBe('Sprint 6');
    expect(comparableTo(bulletin.previous ?? null, currentCoverage())).toBe(true);
  });

  it('§24.13 — deuxWitness comparables : le trou s’est résorbé d’un sprint à l’autre', async () => {
    const { deps } = await buildScenario();
    const previous = await saveWitness(deps, 'TRAME-1', 'ticket', 'Sprint 6', earlierCoverage());
    const bulletin = buildBulletin({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      coverage: currentCoverage(),
      previous,
    });
    expect(bulletin.previous?.coverage.holes).toBe(2);
    expect(bulletin.coverage.holes).toBe(1);
    expect(bulletin.coverage.coveredDeclared).toBe(4);
    expect(bulletin.previous?.coverage.coveredDeclared).toBe(3);
  });

  it('§4 — sans témoin précédent, le bulletin n’en invente pas', async () => {
    const { deps } = await buildScenario();
    expect(await previousWitness(deps, 'TRAME-1', 'ticket')).toBeNull();
    const bulletin = buildBulletin({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      coverage: currentCoverage(),
    });
    expect(bulletin.previous).toBeUndefined();
  });

  it('§4 — le témoin précédent se relit après coup', async () => {
    const { deps } = await buildScenario();
    await saveWitness(deps, 'TRAME-1', 'ticket', 'Sprint 6', earlierCoverage());
    const found = await previousWitness(deps, 'TRAME-1', 'ticket');
    expect(found?.period).toBe('Sprint 6');
    expect(found?.coverage.holes).toBe(2);
  });
});

describe('bulletin — §12.4 le contenu du bulletin', () => {
  it('§12.4 — perforations, fils détendus et parts sont rapportés avec leur effectif', () => {
    const scope = referenceScope();
    const coverage = computeCoverage({
      ...scope,
      perforations: [
        {
          id: 'perfo_1',
          criterionId: 'crit_AC-5',
          ticketKey: 'TRAME-1',
          criterionKey: 'AC-5',
          verificationId: 'ver_stale',
          criterionVersionNo: 2,
          changedAt: AT,
          verifiedAt: '2026-10-01T09:00:00.000Z',
          ageDays: 42,
          klass: 'dry',
          state: 'open',
        },
      ],
      dangling: [
        {
          id: 'dang_1',
          verificationId: 'ver_stale',
          verificationName: 'TRAME-1.testStale',
          reason: 'test-renamed',
          detectedAt: AT,
          impact: 1,
          state: 'open',
        },
      ],
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    });
    const bulletin = buildBulletin({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      coverage,
      criteriaAddedDuringSprint: [crit('AC-6'), crit('AC-7')],
    });
    expect(bulletin.perforations).toBe(1);
    expect(bulletin.dangling).toBe(1);
    expect(bulletin.unfalsifiableShare).toEqual({ percent: 14.3, count: 1, total: 7 });
    expect(bulletin.addedDuringSprint).toEqual({ percent: 28.6, count: 2, total: 7 });
  });

  it('§12.4 — les trous prioritaires sont classés par priorité décroissante', () => {
    const bulletin = buildBulletin({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      coverage: currentCoverage(),
      holes: [hole('AC-8', 0.4), hole('AC-9', 0.9), hole('AC-10', 0.6)],
    });
    expect(bulletin.topHoles.map((row) => row.criterionKey)).toEqual(['AC-9', 'AC-10', 'AC-8']);
  });

  it('§24.7 — le bulletin ne fusionne jamais provisoire et déclaré', () => {
    const bulletin = buildBulletin({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      coverage: currentCoverage(),
    });
    expect(bulletin.coverage.coveredDeclared).toBe(4);
    expect(bulletin.coverage.coveredProvisional).toBe(1);
  });

  it('§24.16 — un périmètre sans critère n’affiche pas une part en pourcentage', () => {
    const coverage = computeCoverage({
      criteria: [],
      verifications: [],
      links: [],
      scope: 'PROJ-VIDE',
      scopeType: 'project',
      computedAt: AT,
    });
    const bulletin = buildBulletin({
      scope: 'PROJ-VIDE',
      scopeType: 'project',
      computedAt: AT,
      coverage,
    });
    expect(hasNoCriterion(bulletin.coverage)).toBe(true);
    expect(bulletin.unfalsifiableShare.total).toBe(0);
    expect(bulletin.addedDuringSprint.total).toBe(0);
  });
});

describe('bulletin — §22 on refuse de conclure sous l’effectif minimal', () => {
  it('§22 — un périmètre trop petit ne se conclut pas', () => {
    const criterion = crit('AC-1');
    const coverage = computeCoverage({
      criteria: [criterion],
      verifications: [],
      links: [],
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    });
    expect(conclusion(coverage.criteriaTotal)).toBe('not-enough-history');
  });

  it('§22 — au-delà de l’effectif minimal, la conclusion est possible', () => {
    expect(conclusion(currentCoverage().criteriaTotal)).toBe('conclusive');
  });
});

describe('historique — §12.4 les témoins successifs', () => {
  it('§12.4 — l’historique se lit du plus récent au plus ancien', async () => {
    const { deps } = await buildScenario();
    await deps.store.putCoverage(currentCoverage());
    await deps.store.putCoverage(earlierCoverage());
    const timeline = await coverageTimeline(deps, 'TRAME-1', 'ticket', 5);
    expect(timeline.map((row) => row.computedAt)).toEqual([AT, PREVIOUS_AT]);
  });

  it('§12.4 — l’historique est borné', async () => {
    const { deps } = await buildScenario();
    await deps.store.putCoverage(currentCoverage());
    await deps.store.putCoverage(earlierCoverage());
    const timeline = await coverageTimeline(deps, 'TRAME-1', 'ticket', 1);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].computedAt).toBe(AT);
  });
});
