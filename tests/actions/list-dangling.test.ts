/**
 * `list-dangling` — l'outil MCP qui liste les fils détendus (§16).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/list-dangling.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface DanglingLine {
  verificationName: string;
  reason: string;
  impact: number;
  state: string;
}

interface DanglingResponse {
  dangling: DanglingLine[];
  count: number;
  coverageRemoved: number;
  error?: string;
}

describe('list-dangling — §24.5 un test désactivé retire sa couverture', () => {
  it('§24.5 — un acte désactivé est listé avec sa raison (scénario TRAME-1)', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as DanglingResponse;
    expect(out.error).toBeUndefined();
    expect(out.dangling.length).toBe(1);
    expect(out.dangling[0].reason).toBe('test-disabled');
    expect(out.dangling[0].impact).toBe(1);
    expect(out.coverageRemoved).toBe(1);
  });

  it('§24.6 — les fils détendus du projet de démonstration sont datés', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint' },
      ACTOR,
    )) as DanglingResponse;
    // Deux fils détendus : les tests désactivés qui tenaient une maille.
    // Le troisième test désactivé du projet de démonstration n’a jamais
    // couvert de critère : c’est un test orphelin, pas un fil détendu (§32.1).
    expect(out.count).toBe(2);
    for (const thread of out.dangling) {
      expect(thread.reason).toBe('test-disabled');
      expect(thread.state).toBe('open');
    }
  });
});