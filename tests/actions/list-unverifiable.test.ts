/**
 * `list-unverifiable` — les critères infalsifiables, comptés à part (§8.4).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/list-unverifiable.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface UnverifiableLine {
  criterionKey: string;
  text: string;
  reason: string;
  proposedReformulation: { after: string; measure: string };
}

interface UnverifiableResponse {
  criteria: UnverifiableLine[];
  count: number;
  total: number;
  figures: { unfalsifiable?: { percent: number; count: number; total: number } };
  error?: string;
}

describe('list-unverifiable — §24.10 un critère infalsifiable est compté à part', () => {
  it('§24.10 — le critère infalsifiable est listé avec sa raison', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as UnverifiableResponse;
    expect(out.error).toBeUndefined();
    expect(out.count).toBe(1);
    expect(out.criteria[0].criterionKey).toBe('AC-3');
    expect(out.criteria[0].reason).toContain('mesurable');
  });

  it('§24.10 — une reformulation vérifiable est proposée, avec sa mesure', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as UnverifiableResponse;
    const proposal = out.criteria[0].proposedReformulation;
    expect(proposal.after.length).toBeGreaterThan(0);
    expect(proposal.measure.length).toBeGreaterThan(0);
    // Le texte d’origine n’est jamais remplacé : c’est une proposition.
    expect(out.criteria[0].text).toContain('rapide');
  });

  it('§24.10 — le compte porte son dénominateur (quatre sur vingt-quatre)', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint' },
      ACTOR,
    )) as UnverifiableResponse;
    expect(out.count).toBe(4);
    expect(out.figures.unfalsifiable?.count).toBe(4);
    // Le dénominateur est l'effectif écrit du périmètre (22 vivants, 2 supprimés).
    expect(out.figures.unfalsifiable?.total).toBe(22);
  });
});
