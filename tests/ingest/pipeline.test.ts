/**
 * §7 forme 1 / §18 — le pont signé vers les pipelines.
 *
 * Une charge valide devient des actes de forme `automated-test`, force
 * **machine** — la seule force qui prouve (§4). Une charge inutilisable est
 * **écartée sans lever** : jamais d'acte inventé, jamais d'exception remontée
 * au domaine (§18).
 */
import { describe, expect, it } from 'vitest';
import { FakeClock, FakeLogger } from '../helpers/index.js';
import { DEFAULT_STRENGTH_BY_FORM } from '../../src/defaults.js';
import { createPipelineGateway, PIPELINE_SCHEMA } from '../../src/ingest/pipeline.js';

const NOW = '2026-11-12T09:00:00.000Z';

/** Une charge valide du pont signé. */
function payload(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: PIPELINE_SCHEMA,
    repository: 'ws/service',
    build: {
      id: 'build-42',
      url: 'https://ci.example/build-42',
      startedAt: '2026-11-10T08:00:00.000Z',
    },
    results: [
      {
        name: 'PROJ-12.testShouldRetry',
        status: 'passed',
        at: '2026-11-10T08:12:31.000Z',
      },
    ],
    ...over,
  };
}

/** L'adaptateur, avec une horloge fixe. */
function gateway() {
  return createPipelineGateway(new FakeClock(NOW), { log: new FakeLogger() });
}

describe('pont signé : des actes « machine » (§7, §24.2)', () => {
  it('§24.2 — un résultat de pipeline est compté « machine »', async () => {
    const acts = await gateway().ingest(payload());
    expect(acts).toHaveLength(1);
    expect(acts[0].form).toBe('automated-test');
    expect(acts[0].strength).toBe('machine');
    expect(acts[0].strength).toBe(DEFAULT_STRENGTH_BY_FORM['automated-test']);
    expect(acts[0].status).toBe('passed');
  });

  it('§7 — la date d’exécution vient du résultat, la source du pipeline', async () => {
    const [act] = await gateway().ingest(payload());
    expect(act.executedAt).toBe('2026-11-10T08:12:31.000Z');
    expect(act.sourceSystem).toBe('pipeline');
    expect(act.sourceRef).toBe('pipeline/build-42/PROJ-12.testShouldRetry');
  });

  it('§18 — l’artefact du build est référencé, jamais recopié', async () => {
    const [act] = await gateway().ingest(payload());
    expect(act.artifactRef).toBe('https://ci.example/build-42');
  });

  it('§10 chemin 2 — le ticket vient de la convention de nommage du test', async () => {
    const [act] = await gateway().ingest(payload());
    expect(act.ticketKey).toBe('PROJ-12');
  });

  it('§8.3 — un test désactivé reste visible', async () => {
    const acts = await gateway().ingest(
      payload({
        results: [{ name: 'PROJ-12.testShouldRetry', status: 'ignored', at: '2026-11-10T08:12:31.000Z' }],
      }),
    );
    expect(acts[0].status).toBe('ignored');
    expect(acts[0].disabledAt).toBe('2026-11-10T08:12:31.000Z');
  });

  it('un résultat sans date propre prend la date du build', async () => {
    const acts = await gateway().ingest(payload({ results: [{ name: 'PROJ-12.testShouldRetry' }] }));
    expect(acts[0].executedAt).toBe('2026-11-10T08:00:00.000Z');
  });

  it('un résultat sans date du tout est daté de la réception (horloge injectée)', async () => {
    const acts = await gateway().ingest(
      payload({
        build: { id: 'build-42' },
        results: [{ name: 'PROJ-12.testShouldRetry' }],
      }),
    );
    expect(acts[0].executedAt).toBe(NOW);
  });

  it('la zone est le dépôt, ou la zone explicite', async () => {
    const [act] = await gateway().ingest(payload());
    expect(act.zone).toBe('ws/service');
    const [other] = await gateway().ingest(payload({ zone: 'billing' }));
    expect(other.zone).toBe('billing');
  });
});

describe('pont signé : une charge inutilisable est écartée (§18)', () => {
  const invalid: [string, unknown][] = [
    ['rien du tout', null],
    ['une chaîne', 'pas un objet'],
    ['un objet vide', {}],
    ['un schéma inconnu', payload({ schema: 'trame.ci.v0' })],
    ['un build sans identifiant', payload({ build: { url: 'https://ci' } })],
    ['aucun résultat', payload({ results: [] })],
    ['des résultats illisibles', payload({ results: 'beaucoup' })],
    ['des résultats sans nom', payload({ results: [{ status: 'passed' }] })],
  ];

  it('une charge invalide est écartée sans exception, et journalisée', async () => {
    const log = new FakeLogger();
    const bridge = createPipelineGateway(new FakeClock(NOW), { log });
    for (const [label, charge] of invalid) {
      await expect(bridge.ingest(charge), label).resolves.toEqual([]);
    }
    expect(log.has('charge écartée')).toBe(true);
  });
});
