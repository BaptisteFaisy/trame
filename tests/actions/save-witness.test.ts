/**
 * `save-witness` — conserver l'état daté d'une trame (§4, §12.4).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/save-witness.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface WitnessResponse {
  witness: { id: string; period: string; computedAt: string; coveredDeclared: number };
  error?: string;
}

describe('save-witness — §12.4 un témoin daté, conservé', () => {
  it('§12.4 — le témoin porte la date de la trame, pas celle de l’enregistrement', async () => {
    const { deps, store } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket', period: 'Sprint 6' },
      ACTOR,
    )) as WitnessResponse;
    expect(out.error).toBeUndefined();
    expect(out.witness.period).toBe('Sprint 6');
    expect(out.witness.computedAt).toBe('2026-11-12T09:00:00.000Z');
    const last = await store.lastWitness('TRAME-1', 'ticket');
    expect(last?.id).toBe(out.witness.id);
    expect(last?.coverage.computedAt).toBe('2026-11-12T09:00:00.000Z');
  });

  it('§12.4 — deux témoins du même périmètre se distinguent par leur date', async () => {
    const { deps, clock, store } = await buildScenario();
    await run(deps, { scope: 'TRAME-1', scopeType: 'ticket', period: 'Sprint 6' }, ACTOR);
    clock.advanceDays(7);
    await run(deps, { scope: 'TRAME-1', scopeType: 'ticket', period: 'Sprint 7' }, ACTOR);
    const last = await store.lastWitness('TRAME-1', 'ticket');
    expect(last?.period).toBe('Sprint 7');
    expect(store.witnesses).toHaveLength(2);
  });
});