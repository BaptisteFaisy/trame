/**
 * `list-holes` — l'outil MCP qui liste les trous classés par le métré (§16).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/list-holes.js';
import { buildScenario } from '../helpers/index.js';
import {
  ACTOR,
  criterionIn,
  linkIn,
  seedDemoProject,
  verificationIn,
} from './fixtures.js';

interface HoleLine {
  ticketKey: string;
  criterionKey: string;
  kind: string;
  priorityScore: number;
  priorityTerms: { name: string; weight: number; value: number; because: string }[];
  priorityExplanation: string;
  zone?: string;
}

interface HolesResponse {
  holes: HoleLine[];
  count: number;
  total: number;
  error?: string;
}

describe('list-holes — §24.11 le trou est priorisé et le calcul est affiché', () => {
  it('§24.11 — le trou porte son calcul, pas un chiffre nu', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'TRAME-101', scopeType: 'ticket' },
      ACTOR,
    )) as HolesResponse;
    expect(out.error).toBeUndefined();
    expect(out.holes.length).toBeGreaterThan(0);
    const hole = out.holes[0];
    expect(hole.criterionKey).toBe('AC-4');
    expect(hole.priorityScore).toBeGreaterThan(0);
    expect(hole.priorityExplanation).toContain('score = Σ(poids × valeur) ÷ Σ(poids)');
    expect(hole.priorityExplanation).toContain('critère de non-régression');
  });

  it('§24.11 — le trou cite le critère et sa source (§16)', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'TRAME-101', scopeType: 'ticket' },
      ACTOR,
    )) as HolesResponse;
    expect(out.holes[0].priorityTerms.map((row) => row.name)).toEqual([
      'kind',
      'zone-risk',
      'recurrence',
    ]);
  });
});

describe('list-holes — §24.12 une zone qui a déjà cassé remonte', () => {
  it('§24.12 — le trou d’une zone à risque est mieux classé', async () => {
    const { deps, store } = await buildScenario();
    const risky = criterionIn('TRAME-3', { criterionKey: 'AC-1', text: 'le tissage classe les critères' });
    const calm = criterionIn('TRAME-3', { criterionKey: 'AC-2', text: 'un jeton expiré est refusé' });
    for (const criterion of [risky, calm]) await store.putCriterion(criterion);
    const deadRisky = verificationIn('TRAME-3', { id: 'ver_r', name: 'TRAME-3.testShouldWeave', zone: 'src/weave', disabledAt: '2026-11-11T00:00:00.000Z' });
    const deadCalm = verificationIn('TRAME-3', { id: 'ver_c', name: 'TRAME-3.testShouldReject', zone: 'src/safe', disabledAt: '2026-11-11T00:00:00.000Z' });
    for (const act of [deadRisky, deadCalm]) await store.putVerification(act);
    await store.putLink(linkIn(risky, deadRisky));
    await store.putLink(linkIn(calm, deadCalm));
    await store.putZoneRisk({
      scope: 'TRAME-3',
      zone: 'src/weave',
      defectCount: 3,
      openIncidentCount: 1,
      score: 0.8,
      computedAt: '2026-11-12T09:00:00.000Z',
    });
    const out = (await run(
      deps,
      { scope: 'TRAME-3', scopeType: 'ticket' },
      ACTOR,
    )) as HolesResponse;
    const riskyHole = out.holes.find((hole) => hole.criterionKey === 'AC-1');
    const calmHole = out.holes.find((hole) => hole.criterionKey === 'AC-2');
    expect(riskyHole).toBeTruthy();
    expect(calmHole).toBeTruthy();
    expect(riskyHole!.zone).toBe('src/weave');
    expect(riskyHole!.priorityScore).toBeGreaterThan(calmHole!.priorityScore);
    expect(riskyHole!.priorityExplanation).toContain('déjà cassée');
  });
});