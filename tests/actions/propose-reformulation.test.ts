/**
 * `propose-reformulation` — une reformulation proposée, jamais appliquée (§12.6).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/propose-reformulation.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface ReformulationResponse {
  proposal?: {
    id: string;
    type: string;
    state: string;
    before?: string;
    after?: string;
    measure?: string;
  };
  proposed?: boolean;
  reason?: string;
  applied: boolean;
  awaitingHumanDecision: boolean;
  error?: string;
}

describe('propose-reformulation — §24.10 une reformulation vérifiable est proposée', () => {
  it('§24.10 — la proposition porte le texte d’origine, le texte proposé et la mesure', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-3' },
      ACTOR,
    )) as ReformulationResponse;
    expect(out.error).toBeUndefined();
    expect(out.proposal?.type).toBe('reformulation');
    expect(out.proposal?.before).toContain('rapide');
    expect(out.proposal?.after?.length).toBeGreaterThan(0);
    expect(out.proposal?.measure?.length).toBeGreaterThan(0);
  });

  it('§12.6 — la proposition attend une décision humaine, elle n’est pas appliquée', async () => {
    const { deps, store } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-3' },
      ACTOR,
    )) as ReformulationResponse;
    expect(out.applied).toBe(false);
    expect(out.awaitingHumanDecision).toBe(true);
    const queue = await store.listProposals('open');
    expect(queue.length).toBe(1);
    // Le critère d’origine n’est pas remplacé.
    const criterion = await store.getCriterion('crit_AC-3');
    expect(criterion?.text).toContain('rapide');
  });

  it('§24.10 — un critère déjà vérifiable n’a pas besoin de reformulation', async () => {
    const { deps, store } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-1' },
      ACTOR,
    )) as ReformulationResponse;
    expect(out.proposed).toBe(false);
    expect(out.proposal).toBeUndefined();
    expect((await store.listProposals('open')).length).toBe(0);
  });
});