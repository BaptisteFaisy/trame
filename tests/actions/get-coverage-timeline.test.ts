/**
 * `get-coverage-timeline` — l'historique de la couverture, témoin par témoin.
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/get-coverage-timeline.js';
import { run as getCoverage } from '../../src/actions/get-coverage.js';
import type { Coverage } from '../../src/types.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface PeriodLine {
  computedAt: string;
  coveredDeclared: number;
  coveredProvisional: number;
  holes: number;
}

interface TimelineResponse {
  periods: PeriodLine[];
  count: number;
  requestedPeriods: number;
  error?: string;
}

describe('get-coverage-timeline — §19 l’historique est daté, du plus récent au plus ancien', () => {
  it('§19 — les mesures sont relues du plus récent au plus ancien', async () => {
    const { deps, store } = await buildScenario();
    const current = (await getCoverage(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as { coverage: Coverage };
    await store.putCoverage({ ...current.coverage, computedAt: '2026-11-05T09:00:00.000Z', coveredDeclared: 4 });
    await store.putCoverage({ ...current.coverage, computedAt: '2026-11-08T09:00:00.000Z', coveredDeclared: 3 });
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket', periods: 10 },
      ACTOR,
    )) as TimelineResponse;
    expect(out.error).toBeUndefined();
    expect(out.count).toBe(2);
    expect(out.periods[0].computedAt).toBe('2026-11-08T09:00:00.000Z');
    expect(out.periods[1].computedAt).toBe('2026-11-05T09:00:00.000Z');
  });

  it('§19 — chaque mesure porte ses effectifs, jamais un pourcentage seul', async () => {
    const { deps, store } = await buildScenario();
    const current = (await getCoverage(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as { coverage: Coverage };
    await store.putCoverage({ ...current.coverage, computedAt: '2026-11-05T09:00:00.000Z', coveredDeclared: 4, coveredProvisional: 1 });
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as TimelineResponse;
    const period = out.periods[0];
    expect(typeof period.coveredDeclared).toBe('number');
    expect(typeof period.coveredProvisional).toBe('number');
    expect(typeof period.holes).toBe('number');
  });
});