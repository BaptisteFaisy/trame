/**
 * `get-coverage` — l'outil MCP qui lit la trame d'un périmètre (§16).
 *
 * Les tests portent le numéro de recette du §24 : chaque exigence testée est
 * nommée, pour que la recette se lise dans les titres.
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/get-coverage.js';
import { FR } from '../../src/i18n/index.js';
import { buildScenario } from '../helpers/index.js';
import type { Scenario } from '../helpers/index.js';
import {
  ACTOR,
  criterionIn,
  linkIn,
  seedDemoProject,
  verificationIn,
} from './fixtures.js';

/** La réponse de l'outil, avec ses types. */
interface CoverageResponse {
  scope: string;
  scopeType: string;
  computedAt: string;
  mode: string;
  coverage: {
    criteriaTotal: number;
    unfalsifiableCount: number;
    byStrength: { machine: number; attested: number; declared: number };
    byLink: { declared: number; confirmed: number; derived: number };
    byFreshness: { current: number; stale: number };
    coveredDeclared: number;
    coveredProvisional: number;
    proven: number;
    holes: number;
  };
  figures: {
    conclusion: string;
    noCriterionWritten: boolean;
    coveredDeclared?: { percent: number; count: number; total: number };
    coveredProvisional?: { percent: number; count: number; total: number };
  };
  focus?: { line: string; count: number; total: number; percent: number } | null;
  blindSpots: { absence: string; objectType: string; detail: string }[];
  messages: string[];
  error?: string;
}

/** Un périmètre avec une force par critère : machine, attestée, déclarée. */
async function strengthScope(store: Scenario['store']): Promise<void> {
  const machine = criterionIn('TRAME-2', { criterionKey: 'AC-1', text: 'le tissage classe les critères' });
  const attested = criterionIn('TRAME-2', { criterionKey: 'AC-2', text: 'un jeton expiré est refusé' });
  const declared = criterionIn('TRAME-2', { criterionKey: 'AC-3', text: 'la trame est datée' });
  for (const criterion of [machine, attested, declared]) await store.putCriterion(criterion);
  const auto = verificationIn('TRAME-2', { id: 'ver_auto', name: 'TRAME-2.testShouldWeave' });
  const manual = verificationIn('TRAME-2', { id: 'ver_manual', name: 'TRAME-2.caseShouldRefuse', form: 'manual-case' });
  const comment = verificationIn('TRAME-2', { id: 'ver_comment', name: 'commentaire de recette', form: 'declaration', sourceSystem: 'jira' });
  for (const act of [auto, manual, comment]) await store.putVerification(act);
  await store.putLink(linkIn(machine, auto));
  await store.putLink(linkIn(attested, manual));
  await store.putLink(linkIn(declared, comment));
}

describe('get-coverage — §24.2 la couverture par force, attestée ou déclarée', () => {
  it('§24.2 — chaque critère couvert porte sa force, avec son effectif', async () => {
    const { deps, store } = await buildScenario();
    await strengthScope(store);
    const out = (await run(
      deps,
      { scope: 'TRAME-2', scopeType: 'ticket' },
      ACTOR,
    )) as CoverageResponse;
    expect(out.error).toBeUndefined();
    expect(out.coverage.byStrength).toEqual({ machine: 1, attested: 1, declared: 1 });
    expect(out.coverage.byLink).toEqual({ declared: 3, confirmed: 0, derived: 0 });
    expect(out.coverage.criteriaTotal).toBe(3);
    expect(out.figures.coveredDeclared).toEqual({ percent: 100, count: 3, total: 3 });
  });

  it('§24.2 — la réponse est datée, scopée, et porte les effectifs', async () => {
    const { deps, store } = await buildScenario();
    await strengthScope(store);
    const out = (await run(deps, { scope: 'TRAME-2', scopeType: 'ticket' }, ACTOR)) as CoverageResponse;
    expect(out.scope).toBe('TRAME-2');
    expect(out.scopeType).toBe('ticket');
    expect(out.computedAt).toBe('2026-11-12T09:00:00.000Z');
    expect(out.messages).toContain(FR['msg.dated-scope']);
  });

  it('§24.2 — sous l’effectif minimal, l’app refuse de conclure', async () => {
    const { deps, store } = await buildScenario();
    await strengthScope(store);
    const out = (await run(deps, { scope: 'TRAME-2', scopeType: 'ticket' }, ACTOR)) as CoverageResponse;
    expect(out.figures.conclusion).toBe('not-enough-history');
    expect(out.messages).toContain(FR['msg.not-enough-history']);
  });
});

describe('get-coverage — §24.7 la couverture provisoire n’entre pas dans la déclarée', () => {
  it('§24.7 — une liaison dérivée au-dessus du seuil est provisoire, jamais déclarée', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'TRAME-102', scopeType: 'ticket' },
      ACTOR,
    )) as CoverageResponse;
    // TRAME-102/AC-3 n’est couvert que par une liaison dérivée (0,88) :
    // elle est à part, elle n’entre pas dans la couverture déclarée.
    expect(out.coverage.coveredProvisional).toBe(1);
    expect(out.coverage.byLink.derived).toBe(1);
    expect(out.coverage.coveredDeclared).toBe(3);
    expect(out.coverage.criteriaTotal).toBe(4);
    expect(out.figures.coveredProvisional?.count).toBe(1);
    expect(out.messages).toContain(FR['msg.provisional']);
  });

  it('§24.7 — la ligne provisoire a son propre effectif et son dénominateur', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'TRAME-102', scopeType: 'ticket', mode: 'provisional' },
      ACTOR,
    )) as CoverageResponse;
    expect(out.mode).toBe('provisional');
    expect(out.focus?.line).toBe('provisional');
    expect(out.focus?.count).toBe(1);
    expect(out.focus?.total).toBe(4);
  });
});

describe('get-coverage — §24.15 un droit manquant n’est jamais un trou', () => {
  it('§24.15 — le droit manquant apparaît comme angle mort', async () => {
    const { deps, graph } = await buildScenario();
    graph.denyRead('test-execution');
    const out = (await run(deps, { scope: 'TRAME-1', scopeType: 'ticket' }, ACTOR)) as CoverageResponse;
    expect(out.blindSpots.length).toBeGreaterThan(0);
    expect(out.blindSpots[0].absence).toBe('no-right');
    expect(out.blindSpots[0].objectType).toBe('test-execution');
  });

  it('§24.15 — aucun trou n’est attribué au droit manquant', async () => {
    const { deps, graph } = await buildScenario();
    const before = (await run(deps, { scope: 'TRAME-1', scopeType: 'ticket' }, ACTOR)) as CoverageResponse;
    graph.denyRead('test-execution');
    const after = (await run(deps, { scope: 'TRAME-1', scopeType: 'ticket' }, ACTOR)) as CoverageResponse;
    expect(after.coverage.holes).toBe(before.coverage.holes);
    expect(after.coverage.criteriaTotal).toBe(before.coverage.criteriaTotal);
  });
});

describe('get-coverage — §24.16 un projet sans critère', () => {
  it('§24.16 — l’app dit « aucun critère écrit », pas « 0 % »', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-404', scopeType: 'project' },
      ACTOR,
    )) as CoverageResponse;
    expect(out.figures.noCriterionWritten).toBe(true);
    expect(out.messages).toContain(FR['msg.no-criterion-written']);
    expect(out.figures.coveredDeclared).toBeUndefined();
    expect(out.coverage.criteriaTotal).toBe(0);
  });
});

describe('get-coverage — §24.19 aucune statistique par personne', () => {
  it('§24.19 — un filtre par personne est refusé', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket', author: 'alice' },
      ACTOR,
    )) as CoverageResponse;
    expect(out.error).toBe('filtre par personne refusé');
  });

  it('§24.19 — la réponse ne porte aucun champ de personne', async () => {
    const { deps } = await buildScenario();
    const out = (await run(deps, { scope: 'TRAME-1', scopeType: 'ticket' }, ACTOR)) as CoverageResponse;
    const body = JSON.stringify(out);
    expect(body).not.toMatch(/authorRef|accountId|displayName|author/);
  });
});
