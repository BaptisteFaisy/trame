/**
 * `propose-test` — un brouillon de test proposé, jamais appliqué (§12.6).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/propose-test.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface ProposalResponse {
  proposal: {
    id: string;
    type: string;
    state: string;
    title?: string;
    body?: string;
    expectedForm?: string;
    zone?: string;
  };
  criterion: { criterionKey: string; text: string };
  applied: boolean;
  awaitingHumanDecision: boolean;
  error?: string;
}

describe('propose-test — §12.6 une proposition n’est jamais appliquée', () => {
  it('§12.6 — le brouillon cite le critère et la forme attendue', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-1' },
      ACTOR,
    )) as ProposalResponse;
    expect(out.error).toBeUndefined();
    expect(out.proposal.type).toBe('test-draft');
    expect(out.proposal.title).toContain('AC-1');
    expect(out.proposal.body).toContain('tissage');
    expect(out.proposal.expectedForm).toBe('automated-test');
  });

  it('§12.6 — la proposition part dans la file de validation', async () => {
    const { deps, store } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-1' },
      ACTOR,
    )) as ProposalResponse;
    expect(out.applied).toBe(false);
    expect(out.awaitingHumanDecision).toBe(true);
    expect(out.proposal.state).toBe('open');
    const queue = await store.listProposals('open');
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(out.proposal.id);
  });

  it('§12.6 — rien n’est appliqué : le critère reste ce qu’il est', async () => {
    const { deps, store } = await buildScenario();
    const before = await store.getCriterion('crit_AC-1');
    await run(deps, { ticketKey: 'TRAME-1', criterionId: 'AC-1' }, ACTOR);
    const after = await store.getCriterion('crit_AC-1');
    expect(after?.text).toBe(before?.text);
    expect(after?.version).toBe(before?.version);
    expect(after?.changedAt).toBe(before?.changedAt);
  });
});