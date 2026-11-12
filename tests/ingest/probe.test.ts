/**
 * §18 / §24.15 — la sonde de visibilité : « pas de droit » ≠ « pas de données ».
 *
 * C'est le test le plus important du lot : sans cette distinction, l'app
 * afficherait des trous là où elle n'a **simplement pas regardé** (§23). Un
 * droit manquant donne le vide **sans erreur**, et la sonde le déclare.
 */
import { describe, expect, it } from 'vitest';
import { FakeLogger } from '../helpers/index.js';
import { createGraphGateway } from '../../src/ingest/graph.js';
import type { GraphTransport, GraphTransportOutcome } from '../../src/ingest/graph.js';
import { createBitbucketGateway } from '../../src/ingest/bitbucket.js';

const SCOPE = { scopeType: 'project' as const, scope: 'PROJ' };

/** Un transport qui répond toujours la même chose. */
function transportOf(outcome: GraphTransportOutcome): GraphTransport {
  return () => Promise.resolve(outcome);
}

describe('sonde du Teamwork Graph (§18, §24.15)', () => {
  it('§24.15 — un droit manquant sur `test-execution` apparaît comme `no-right`', async () => {
    const gateway = createGraphGateway(new FakeLogger(), {
      transport: transportOf({ ok: false, reason: 'no-right', detail: 'HTTP 403' }),
    });
    const probe = await gateway.probe('test-execution');
    expect(probe.absence).toBe('no-right');
    expect(probe.readable).toBe(false);
    expect(probe.objectType).toBe('test-execution');
  });

  it('§24.15 — et aucun trou ne lui est attribué : la lecture est vide', async () => {
    const gateway = createGraphGateway(new FakeLogger(), {
      transport: transportOf({ ok: false, reason: 'no-right', detail: 'HTTP 403' }),
    });
    const objects = await gateway.query('test-execution', SCOPE);
    expect(objects).toEqual([]);
  });

  it('§22 — un droit présent mais sans données donne `no-data`, pas `no-right`', async () => {
    const gateway = createGraphGateway(new FakeLogger(), { transport: transportOf({ ok: true, objects: [] }) });
    const probe = await gateway.probe('test-execution');
    expect(probe.absence).toBe('no-data');
    expect(probe.readable).toBe(true);
  });

  it('§22 — un droit présent qui lit des objets donne une sonde lisible', async () => {
    const gateway = createGraphGateway(new FakeLogger(), {
      transport: transportOf({
        ok: true,
        objects: [{ objectType: 'test-execution', id: 'exec-1', name: 'n', at: '2026-11-10T08:00:00Z' }],
      }),
    });
    const probe = await gateway.probe('test-execution');
    expect(probe.readable).toBe(true);
    expect(probe.probeRef).toBe('exec-1');
  });

  it('§18 — un transport qui tombe ne lève jamais : le résultat est vide', async () => {
    const gateway = createGraphGateway(new FakeLogger(), {
      transport: () => Promise.reject(new Error('réseau coupé')),
    });
    await expect(gateway.query('test-execution', SCOPE)).resolves.toEqual([]);
    const probe = await gateway.probe('test-execution');
    expect(probe.readable).toBe(false);
    expect(probe.absence).toBe('no-right');
  });

  it('§22 — un type d’objet que Trame ne lit pas est déclaré, pas inventé', async () => {
    const gateway = createGraphGateway(new FakeLogger(), { transport: transportOf({ ok: true, objects: [] }) });
    const objects = await gateway.query('AtlassianTeam', SCOPE);
    expect(objects).toEqual([]);
    const probe = await gateway.probe('AtlassianTeam');
    expect(probe.readable).toBe(false);
  });
});

describe('sonde de Bitbucket (§18, §22)', () => {
  it('un dépôt illisible est `no-right`, jamais « dépôt sans test »', async () => {
    const denied = { ok: false, reason: 'no-right', detail: 'HTTP 403' } as const;
    const gateway = createBitbucketGateway(new FakeLogger(), {
      transport: () => Promise.resolve(denied),
    });
    const probe = await gateway.probe('ws/service');
    expect(probe.absence).toBe('no-right');
    expect(probe.readable).toBe(false);
    expect(await gateway.listTests('ws/service')).toEqual([]);
  });

  it('un dépôt lisible donne une sonde lisible', async () => {
    const readable = { ok: true, body: { values: [] } } as const;
    const gateway = createBitbucketGateway(new FakeLogger(), {
      transport: () => Promise.resolve(readable),
    });
    const probe = await gateway.probe('ws/service');
    expect(probe.readable).toBe(true);
    expect(probe.absence).toBe('no-data');
  });

  it('un transport qui tombe ne lève jamais', async () => {
    const gateway = createBitbucketGateway(new FakeLogger(), {
      transport: () => Promise.reject(new Error('réseau coupé')),
    });
    await expect(gateway.listBuilds('ws/service', '2026-01-01')).resolves.toEqual([]);
    await expect(gateway.pullRequestMentions('ws/service', '2026-01-01')).resolves.toEqual([]);
  });
});
