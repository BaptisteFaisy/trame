/**
 * `recompute` — le recalcul est mis en file, jamais calculé en ligne (§18).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/recompute.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR } from './fixtures.js';

interface RecomputeResponse {
  queued: boolean;
  mode: string;
  cursor: unknown;
  error?: string;
}

describe('recompute — §18 un recalcul par tranches, jamais en ligne', () => {
  it('§18 — le recalcul est mis en file avec son périmètre et sa tranche', async () => {
    const { deps, queue } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project', mode: 'links' },
      ACTOR,
    )) as RecomputeResponse;
    expect(out.error).toBeUndefined();
    expect(out.queued).toBe(true);
    expect(out.mode).toBe('links');
    expect(queue.messages).toHaveLength(1);
    expect(queue.messages[0].scope).toBe('TRAME');
    expect(queue.messages[0].scopeType).toBe('project');
    expect(queue.messages[0].mode).toBe('links');
  });

  it('§18 — rien n’est calculé en ligne : aucune trame n’est écrite', async () => {
    const { deps, store } = await buildScenario();
    await run(deps, { scope: 'TRAME', scopeType: 'project', mode: 'criteria' }, ACTOR);
    expect(store.coverages).toHaveLength(0);
  });

  it('§24.18 — une modification de critère ne recalcule que les liaisons concernées', async () => {
    const { deps, queue, store } = await buildScenario();
    // Un curseur posé borne la tranche suivante : on reprend où on s'est arrêté.
    await store.putCursor({ scope: 'TRAME', mode: 'links', runAt: '2026-11-11T00:00:00.000Z' });
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project', mode: 'links' },
      ACTOR,
    )) as RecomputeResponse;
    expect(out.queued).toBe(true);
    expect(queue.messages[0].cursor).toEqual({
      scope: 'TRAME',
      mode: 'links',
      runAt: '2026-11-11T00:00:00.000Z',
    });
    expect(queue.messages[0].mode).toBe('links');
  });

  it('§18 — une tranche inconnue est refusée', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project', mode: 'explode' },
      ACTOR,
    )) as RecomputeResponse;
    expect(out.error).toBe('mode illisible');
  });
});