/**
 * `get-bulletin` — le bulletin de trame daté et comparable (§12.4).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/get-bulletin.js';
import { run as saveWitness } from '../../src/actions/save-witness.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface BulletinResponse {
  bulletin: { computedAt: string; topHoles: unknown[] };
  comparison: {
    comparable: boolean;
    conclusion: string;
    coveredDeclaredDelta: number;
    previousCoveredDeclared: number;
  } | null;
  previousWitnessAt: string | null;
  error?: string;
}

describe('get-bulletin — §24.13 le bulletin est daté et comparable', () => {
  it('§24.13 — sans témoin précédent, le bulletin est seul (pas de comparaison)', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as BulletinResponse;
    expect(out.error).toBeUndefined();
    expect(out.bulletin.computedAt).toBe('2026-11-12T09:00:00.000Z');
    expect(out.comparison).toBeNull();
    expect(out.previousWitnessAt).toBeNull();
  });

  it('§24.13 — avec un témoin, le bulletin est comparable', async () => {
    const { deps } = await buildScenario();
    await saveWitness(deps, { scope: 'TRAME-1', scopeType: 'ticket', period: 'Sprint 6' }, ACTOR);
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as BulletinResponse;
    expect(out.comparison).toBeTruthy();
    expect(out.comparison!.comparable).toBe(true);
    expect(out.previousWitnessAt).toBe('2026-11-12T09:00:00.000Z');
    // Sous l’effectif minimal, l’app refuse de conclure, même comparable.
    expect(out.comparison!.conclusion).toBe('not-enough-history');
  });
});