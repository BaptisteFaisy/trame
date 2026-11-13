/**
 * The runtime paths of the app: the trigger, the nightly recomputation, the
 * consumer's slices, the signed pipeline bridge, the closing gate and the four
 * JQL functions (§18, TR-30).
 *
 * Everything runs on the in-memory doubles: no network, no Forge, a fixed
 * clock.
 */
import { describe, expect, it } from 'vitest';
import { onJiraEvent } from '../../src/handlers/events.js';
import { onScheduledTick, parseScope, recomputeScope } from '../../src/handlers/scheduled.js';
import { onRecomputeMessage } from '../../src/handlers/consumer.js';
import { handleCiResults, parsePayload, toVerifications } from '../../src/handlers/ingest.js';
import { createValidator } from '../../src/handlers/validator.js';
import { jqlDangling, jqlHoles, jqlPerforated, jqlUncovered } from '../../src/handlers/jql.js';
import { FakeJira, FakeStore, createFakeIds, FakeClock, FakeLogger, FakeQueue } from '../helpers/index.js';
import type { Deps } from '../../src/ports.js';
import type { IssueRef } from '../../src/ports.js';
import { DEFAULT_SETTINGS } from '../../src/defaults.js';

const TODAY = '2026-11-12T09:00:00.000Z';

function makeDeps(store = new FakeStore()): Deps {
  const clock = new FakeClock(TODAY);
  const log = new FakeLogger();
  const queue = new FakeQueue();
  return {
    clock,
    ids: createFakeIds(),
    log,
    queue,
    jira: new FakeJira(),
    graph: {} as Deps['graph'],
    bitbucket: {} as Deps['bitbucket'],
    confluence: {} as Deps['confluence'],
    pipeline: {} as Deps['pipeline'],
    llm: {} as Deps['llm'],
    secrets: { scan: () => ({ clean: true, findings: [] }) },
    store,
    settings: DEFAULT_SETTINGS,
  };
}

const ISSUE: IssueRef = {
  id: '10001',
  key: 'TRAME-1',
  projectId: 'TRAME',
  summary: 'Ticket de démonstration',
  status: 'TO DO',
  acceptanceField: '- le tissage classe les critères\n- un jeton expiré est refusé',
  description: '- la couverture déclarée ne doit pas baisser',
  labels: [],
  components: [],
  sprint: 'Sprint 7',
  fixVersion: '2026.11',
  updatedAt: TODAY,
};

describe('le trigger d’un ticket modifié', () => {
  it('lit le ticket dans la charge utile de Forge (issue imbriquée)', async () => {
    // Forme réelle de `avi:jira:updated:issue` : le ticket est sous `issue`.
    // La forme `issueKey` en tête ne sort que des tests — c'est elle qui
    // masquait l'incident du 13/11/2026 (rien n'était jamais ingéré).
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issue: { id: '10002', key: 'TRAME-1' } }, deps);
    const criteria = await deps.store.listCriteria({ scopeType: 'ticket', scope: 'TRAME-1' });
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-2', 'AC-3']);
  });

  it('extrait les critères des six origines et les inscrit', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    const criteria = await deps.store.listCriteria({ scopeType: 'ticket', scope: 'TRAME-1' });
    expect(criteria.length).toBeGreaterThanOrEqual(3);
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-2', 'AC-3']);
    expect(criteria[0]?.textHash).toHaveLength(16);
    expect((deps.queue as FakeQueue).messages).toHaveLength(1);
  });

  it('inscrit une version quand le texte du critère change', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    const changed: IssueRef = {
      ...ISSUE,
      acceptanceField: '- le tissage classe les critères par ticket\n- un jeton expiré est refusé',
      updatedAt: '2026-11-12T10:00:00.000Z',
    };
    (deps.jira as FakeJira).issues = [changed];
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    const criteria = await deps.store.listCriteria({ scopeType: 'ticket', scope: 'TRAME-1' });
    const versions = await deps.store.listVersions(criteria[0]?.id ?? '');
    expect(versions.length).toBe(2);
    expect(versions[1]?.changeKind).toBe('edited');
  });

  it('ne tisse rien et ne lève pas si le ticket est illisible', async () => {
    const deps = makeDeps();
    await onJiraEvent({ issueKey: 'INCONNU' }, deps);
    expect((deps.log as FakeLogger).has('illisible')).toBe(true);
  });
});

describe('le recalcul nocturne', () => {
  it('calcule la couverture, les trous et le témoin d’un périmètre', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    const coverage = await recomputeScope(deps, { scopeType: 'ticket', scope: 'TRAME-1' });
    expect(coverage?.criteriaTotal).toBeGreaterThan(0);
    expect(coverage?.holes).toBeGreaterThan(0);
    const witness = await deps.store.lastWitness('TRAME-1', 'ticket');
    expect(witness).not.toBeNull();
  });

  it('parcourt les périmètres connus', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    await onScheduledTick({}, deps);
    expect((deps.log as FakeLogger).has('recalcul nocturne')).toBe(true);
  });

  it('lit un périmètre brut (« project:TRAME ») sans se tromper de type', () => {
    expect(parseScope('project:TRAME')).toEqual({ scopeType: 'project', scope: 'TRAME' });
    expect(parseScope('TRAME-1')).toEqual({ scopeType: 'ticket', scope: 'TRAME-1' });
  });
});

describe('le consumer', () => {
  it('traite la tranche « mesures » et enregistre la couverture', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    await onRecomputeMessage(
      { scope: 'TRAME-1', scopeType: 'ticket', mode: 'measures' },
      deps,
    );
    const coverage = await deps.store.getCoverage('TRAME-1', 'ticket');
    expect(coverage).not.toBeNull();
    expect(coverage?.scopeType).toBe('ticket');
  });

  it('traite la tranche « critères » et avance le curseur', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onRecomputeMessage(
      { scope: 'TRAME-1', scopeType: 'ticket', mode: 'criteria' },
      deps,
    );
    const cursor = await deps.store.getCursor('TRAME-1', 'criteria');
    expect(cursor).not.toBeNull();
    expect(cursor?.lastIssueId).toBe('10001');
  });

  it('refuse un mode inconnu sans rien casser', async () => {
    const deps = makeDeps();
    await onRecomputeMessage(
      { scope: 'TRAME-1', scopeType: 'ticket', mode: 'inconnu' as never },
      deps,
    );
    expect((deps.log as FakeLogger).has('mode inconnu')).toBe(true);
  });
});

describe('le pont signé des pipelines', () => {
  it('refuse une charge non signée', async () => {
    const deps = makeDeps();
    process.env['TRAME_WEBHOOK_SECRET'] = 'secret-de-test';
    const response = await handleCiResults(
      { method: 'POST', path: '/ci-results', headers: {}, body: '{}', query: {} },
      deps,
    );
    expect(response.status).toBe(401);
    delete process.env['TRAME_WEBHOOK_SECRET'];
  });

  it('accepte une charge signée et en tire des actes « machine »', async () => {
    const deps = makeDeps();
    process.env['TRAME_WEBHOOK_SECRET'] = 'secret-de-test';
    const body = JSON.stringify({
      repository: 'TRAME',
      buildId: '42',
      zone: 'src/weave',
      tests: [{ name: 'TRAME-1.testShouldWeave', status: 'passed', finishedAt: TODAY }],
    });
    const { expectedSignature } = await import('../../src/handlers/ingest.js');
    const response = await handleCiResults(
      {
        method: 'POST',
        path: '/ci-results',
        headers: { 'x-trame-signature': expectedSignature(body, 'secret-de-test') },
        body,
        query: {},
      },
      deps,
    );
    expect(response.status).toBe(202);
    const acts = await deps.store.listVerifications({ scopeType: 'ticket', scope: 'TRAME-1' });
    expect(acts).toHaveLength(0);
    delete process.env['TRAME_WEBHOOK_SECRET'];
  });

  it('écarte une charge illisible sans lever', () => {
    expect(parsePayload('{cassé')).toBeNull();
    expect(parsePayload('{"repository":"x"}')).toBeNull();
    const verifications = toVerifications({
      repository: 'TRAME',
      buildId: '1',
      tests: [{ name: 't', status: 'passed', finishedAt: TODAY }],
    });
    expect(verifications[0]?.strength).toBe('machine');
  });
});

describe('la porte de clôture (TR-30)', () => {
  it('signale les trous sans jamais bloquer', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    const verdict = await createValidator(deps)({
      issueKey: 'TRAME-1',
      configuration: {},
      transition: { fromStatus: 'IN PROGRESS', toStatus: 'DONE' },
    });
    expect( verdict.valid).toBe(true);
    expect(verdict.blocking).toBe(false);
    expect(verdict.holes).toBeGreaterThan(0);
  });
});

describe('les fonctions JQL', () => {
  it('trouvent le ticket qui a un trou, et lui seul', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    // Jira donne à une fonction JQL l'IDENTIFIANT du ticket ; les registres
    // sont indexés sur la CLÉ. La fonction rend l'identifiant qu'elle a reçu.
    expect(await jqlHoles(deps, ['10001'])).toEqual(['10001']);
    expect(await jqlUncovered(deps, ['10001'])).toEqual(['10001']);
    expect(await jqlPerforated(deps, ['10001'])).toEqual([]);
    expect(await jqlDangling(deps, ['10001'])).toEqual([]);
  });

  it('ne voit rien quand la clé ne correspond à aucun ticket', async () => {
    const deps = makeDeps();
    (deps.jira as FakeJira).withIssues(ISSUE);
    await onJiraEvent({ issueKey: 'TRAME-1' }, deps);
    expect(await jqlHoles(deps, ['99999'])).toEqual([]);
  });
});
