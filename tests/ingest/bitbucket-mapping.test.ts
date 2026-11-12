/**
 * §10 / §24.17 — la conversion pure des réponses Bitbucket.
 *
 * Ce qui est vérifié ici tient en trois phrases : la **zone** vient du dossier
 * du dépôt, la **clé de ticket** vient de la convention de nommage (déterministe,
 * sans modèle), et un **test désactivé reste visible** (§8.3) — sinon sa
 * couverture ne baisserait jamais.
 */
import { describe, expect, it } from 'vitest';
import {
  toBuildRef,
  toPullMention,
  toTestFile,
  zoneOf,
} from '../../src/ingest/bitbucket-mapping.js';

const TEST_PATH = 'src/test/java/com/acme/billing/OrderServiceTest.java';

describe('TestFile : nom, chemin, zone (§10, §11)', () => {
  it('§24.17 — la convention de nommage `PROJ-12.` est reconnue, sans modèle', () => {
    const test = toTestFile('PROJ-12.testShouldRetry', TEST_PATH);
    expect(test?.ticketKeyInName).toBe('PROJ-12');
    expect(test?.name).toBe('PROJ-12.testShouldRetry');
  });

  it('§24.17 — la reconnaissance est déterministe : la même entrée, la même sortie', () => {
    const first = toTestFile('PROJ-12.testShouldRetry', TEST_PATH);
    const second = toTestFile('PROJ-12.testShouldRetry', TEST_PATH);
    expect(second).toEqual(first);
  });

  it('§10 chemin 1 — les `AC-n` cités dans le nom sont relevés', () => {
    const test = toTestFile('AC-3.testShouldRetry.AC-7', TEST_PATH);
    expect(test?.criterionRefs).toEqual(['AC-3', 'AC-7']);
  });

  it('§11 — la zone est le dossier du dépôt', () => {
    expect(zoneOf(TEST_PATH)).toBe('src/test/java/com/acme/billing');
    expect(toTestFile('OrderServiceTest', TEST_PATH)?.zone).toBe('src/test/java/com/acme/billing');
  });

  it('§8.3 — un test `@Ignore` est marqué désactivé', () => {
    expect(toTestFile('@Ignore testShouldRetry', TEST_PATH)?.disabled).toBe(true);
  });

  it('§8.3 — un test `@Disabled` est marqué désactivé', () => {
    expect(toTestFile('@Disabled testShouldRetry', TEST_PATH)?.disabled).toBe(true);
  });

  it('§8.3 — un test marqué `skip` est désactivé', () => {
    expect(toTestFile('testShouldRetry', 'src/test/skipped/OrderServiceTest.java')?.disabled).toBe(
      true,
    );
  });

  it('§8.3 — un test qui tourne n’est pas marqué désactivé', () => {
    expect(toTestFile('PROJ-12.testShouldRetry', TEST_PATH)?.disabled).toBe(false);
  });

  it('§18 — un test sans chemin est écarté : on n’invente pas de zone', () => {
    const reports: string[] = [];
    expect(toTestFile('PROJ-12.testShouldRetry', '', { report: (m) => reports.push(m) })).toBeNull();
    expect(reports.join(' ')).toMatch(/chemin/i);
  });
});

describe('BuildRef : l’état du build (§8.3)', () => {
  const build = (state: unknown, over: Record<string, unknown> = {}) => ({
    uuid: '{build-1}',
    build_number: 42,
    created_on: '2026-11-10T08:00:00.000Z',
    state,
    ...over,
  });

  it('un build réussi est `successful`, et son pipeline est actif', () => {
    const ref = toBuildRef(build({ name: 'COMPLETED', result: { name: 'SUCCESSFUL' } }), 'ws/service');
    expect(ref?.state).toBe('successful');
    expect(ref?.pipelineEnabled).toBe(true);
    expect(ref?.startedAt).toBe('2026-11-10T08:00:00.000Z');
    expect(ref?.repository).toBe('ws/service');
  });

  it('un build échoué est `failed`', () => {
    expect(toBuildRef(build({ name: 'COMPLETED', result: { name: 'FAILED' } }), 'ws/s')?.state).toBe(
      'failed',
    );
  });

  it('un build arrêté est `stopped`', () => {
    expect(
      toBuildRef(build({ name: 'COMPLETED', result: { name: 'STOPPED' } }), 'ws/s')?.state,
    ).toBe('stopped');
  });

  it('un build expiré est `expired`', () => {
    expect(toBuildRef(build({ name: 'EXPIRED' }), 'ws/s')?.state).toBe('expired');
  });

  it('un build en cours n’a pas d’état connu : `unknown`, jamais `successful`', () => {
    expect(toBuildRef(build({ name: 'IN_PROGRESS' }), 'ws/s')?.state).toBe('unknown');
  });

  it('§8.3 — un build hors pipeline est signalé `pipelineEnabled: false`', () => {
    const ref = toBuildRef(
      { uuid: '{b-2}', created_on: '2026-11-10T08:00:00.000Z', state: { name: 'SUCCESSFUL' } },
      'ws/s',
    );
    expect(ref?.pipelineEnabled).toBe(false);
  });

  it('§18 — un build sans identifiant ni date est écarté', () => {
    const reports: string[] = [];
    expect(toBuildRef({ state: {} }, 'ws/s', { report: (m) => reports.push(m) })).toBeNull();
    expect(toBuildRef({ uuid: '{b}' }, 'ws/s', { report: (m) => reports.push(m) })).toBeNull();
    expect(reports).toHaveLength(2);
  });
});

describe('PullMention : les mentions d’une PR (§7 forme 4, §9.1)', () => {
  const pull = (over: Record<string, unknown> = {}) => ({
    id: 42,
    title: 'PROJ-12 AC-3: retry on timeout',
    description: 'Closes TRAME-7. Rapport : https://ci.example/42',
    state: 'MERGED',
    updated_on: '2026-11-10T09:00:00.000Z',
    author: { uuid: 'user-1' },
    ...over,
  });

  it('lit les critères et les tickets du titre et de la description', () => {
    const mention = toPullMention(pull());
    expect(mention?.criterionRefs).toEqual(['AC-3']);
    expect(mention?.ticketKeys).toEqual(['PROJ-12', 'TRAME-7']);
  });

  it('une PR fusionnée porte sa date de fusion', () => {
    expect(toPullMention(pull())?.mergedAt).toBe('2026-11-10T09:00:00.000Z');
  });

  it('une PR non fusionnée n’a pas de date de fusion', () => {
    expect(toPullMention(pull({ state: 'OPEN' }))?.mergedAt).toBeUndefined();
  });

  it('l’auteur est une référence d’audit, jamais un score (§5)', () => {
    expect(toPullMention(pull())?.authorRef).toBe('user-1');
  });

  it('§18 — une PR sans identifiant ni titre est écartée', () => {
    const reports: string[] = [];
    expect(toPullMention({ description: 'x' }, { report: (m) => reports.push(m) })).toBeNull();
    expect(toPullMention({ id: 1 }, { report: (m) => reports.push(m) })).toBeNull();
    expect(reports).toHaveLength(2);
  });
});
