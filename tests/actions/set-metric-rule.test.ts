/**
 * `set-metric-rule` — les poids du métré, une décision d'équipe (§11).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/set-metric-rule.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface RuleResponse {
  weights: { kind: Record<string, number>; zoneRisk: number; recurrence: number };
  error?: string;
}

describe('set-metric-rule — §11 les poids sont une décision, pas une vérité', () => {
  it('§11 — les poids choisis par l’équipe sont enregistrés', async () => {
    const { deps, store } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project', weights: { zoneRisk: 0.9, recurrence: 0.25, kind: { security: 2 } } },
      ACTOR,
    )) as RuleResponse;
    expect(out.error).toBeUndefined();
    expect(out.weights.zoneRisk).toBe(0.9);
    expect(out.weights.recurrence).toBe(0.25);
    expect(out.weights.kind.security).toBe(2);
    // Les poids non choisis gardent leur valeur de socle.
    expect(out.weights.kind.functional).toBe(0.5);
    const rule = await store.getMetricRule('TRAME');
    expect(rule?.weights.zoneRisk).toBe(0.9);
  });

  it('§11 — un poids illisible interrompt la lecture', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project', weights: { zoneRisk: -1 } },
      ACTOR,
    )) as RuleResponse;
    expect(out.error).toBe('poids illisible');
  });
});