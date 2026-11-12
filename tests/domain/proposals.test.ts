/**
 * Les propositions et la file de validation — tests réels (§12.6, §24.9,
 * §24.10, TR-09).
 *
 * La recette exige (§24.9) : « un trou prioritaire reçoit un brouillon de
 * test, proposé sans être appliqué ». Et (§24.10) : « un critère
 * infalsifiable est compté à part, et une reformulation vérifiable est
 * proposée ».
 */
import { describe, expect, it } from 'vitest';
import type { Perforation, ProposalPayload } from '../../src/types.js';
import {
  draftRelink,
  draftReformulation,
  draftRetest,
  draftTest,
  enqueueProposal,
  validationQueue,
} from '../../src/domain/proposals.js';
import { buildScenario, makeCriterion } from '../helpers/index.js';

/** La perforation du scénario : un critère changé après sa vérification. */
const PERFORATION: Perforation = {
  id: 'perf_1',
  criterionId: 'crit_AC-4',
  ticketKey: 'TRAME-1',
  criterionKey: 'AC-4',
  verificationId: 'ver_old',
  criterionVersionNo: 2,
  changedAt: '2026-11-09T09:00:00.000Z',
  verifiedAt: '2026-10-03T09:00:00.000Z',
  ageDays: 37,
  klass: 'dry',
  state: 'open',
};

/** Le payload d'un brouillon de test, une fois le type vérifié. */
function asTestDraft(payload: ProposalPayload): Extract<ProposalPayload, { kind: 'test-draft' }> {
  if (payload.kind !== 'test-draft') throw new Error(`payload inattendu : ${payload.kind}`);
  return payload;
}

describe('propositions — un trou prioritaire reçoit un brouillon, jamais appliqué (§24.9, TR-09)', () => {
  it('le brouillon est enfilé en attente de décision, et rien n’est appliqué', async () => {
    const scenario = await buildScenario();
    const critere = makeCriterion({
      criterionKey: 'AC-9',
      kind: 'security',
      text: 'un jeton expiré est refusé',
    });
    await scenario.store.putCriterion(critere);
    const liens = scenario.store.links.length;
    const actes = scenario.store.verifications.length;
    const versions = scenario.store.versions.length;

    const proposition = await enqueueProposal(scenario.deps, draftTest(critere, 'src/auth'));

    expect(proposition.state).toBe('open');
    expect(proposition.type).toBe('test-draft');
    const stockee = await scenario.store.getProposal(proposition.id);
    expect(stockee?.state).toBe('open');
    // rien n'est appliqué : ni lien, ni acte de vérification, ni version de critère
    expect(scenario.store.links.length).toBe(liens);
    expect(scenario.store.verifications.length).toBe(actes);
    expect(scenario.store.versions.length).toBe(versions);
    const apres = await scenario.store.getCriterion(critere.id);
    expect(apres?.text).toBe(critere.text);
    expect(apres?.falsifiable).toBe(critere.falsifiable);
  });

  it('le brouillon cite le critère qu’il couvrirait et dit la forme attendue', () => {
    const critere = makeCriterion({
      criterionKey: 'AC-9',
      kind: 'security',
      text: 'un jeton expiré est refusé',
    });
    const brouillon = draftTest(critere, 'src/auth');
    const payload = asTestDraft(brouillon.payload);
    expect(brouillon.criterionId).toBe(critere.id);
    expect(payload.body).toContain('AC-9');
    expect(payload.body).toContain('GIVEN');
    expect(payload.body).toContain('WHEN');
    expect(payload.body).toContain('THEN');
    expect(payload.expectedForm).toBe('automated-test');
    expect(payload.zone).toBe('src/auth');
  });

  it('un critère d’expérience se vérifie par recette manuelle, pas par test automatisé', () => {
    const critere = makeCriterion({
      criterionKey: 'AC-10',
      kind: 'experience',
      text: '80 % des utilisateurs terminent la tâche en moins de 30 s',
    });
    const payload = asTestDraft(draftTest(critere).payload);
    expect(payload.expectedForm).toBe('manual-case');
  });

  it('un critère infalsifiable est reformulé dans le brouillon, avant d’être vérifié', () => {
    const critere = makeCriterion({
      criterionKey: 'AC-11',
      kind: 'performance',
      text: 'l’application doit être rapide',
    });
    const payload = asTestDraft(draftTest(critere).payload);
    expect(payload.body).toContain('95ᵉ centile');
  });
});

describe('propositions — la reformulation d’un critère infalsifiable (§24.10, §8.4)', () => {
  it('la proposition porte le texte d’origine, le texte proposé et la mesure', async () => {
    const scenario = await buildScenario();
    const critere = await scenario.store.getCriterion(scenario.ids.ac3);
    if (!critere) throw new Error('AC-3 absent du scénario');

    const proposition = await enqueueProposal(
      scenario.deps,
      draftReformulation(critere, 'pas de mesure : « rapide » n’est pas mesurable'),
    );

    expect(proposition.type).toBe('reformulation');
    expect(proposition.state).toBe('open');
    if (proposition.payload.kind !== 'reformulation') throw new Error('payload inattendu');
    expect(proposition.payload.before).toBe('l’application doit être rapide');
    expect(proposition.payload.after).toContain('2 s');
    expect(proposition.payload.measure).not.toBe('');
    // le critère d'origine n'est pas touché : la reformulation est une proposition
    const apres = await scenario.store.getCriterion(critere.id);
    expect(apres?.text).toBe('l’application doit être rapide');
  });
});

describe('propositions — re-tissage et re-lien (§12.6)', () => {
  it('la proposition de re-tissage cite les perforations à rejouer', () => {
    const proposition = draftRetest([PERFORATION]);
    expect(proposition.type).toBe('retest');
    if (proposition.payload.kind !== 'retest') throw new Error('payload inattendu');
    expect(proposition.payload.perforationIds).toEqual(['perf_1']);
    expect(proposition.criterionId).toBe(PERFORATION.criterionId);
  });

  it('la proposition de re-lien cite les actes et la raison', () => {
    const proposition = draftRelink(['ver_old', 'ver_green'], 'lien perdu après renommage du test');
    expect(proposition.type).toBe('relink');
    if (proposition.payload.kind !== 'relink') throw new Error('payload inattendu');
    expect(proposition.payload.verificationIds).toEqual(['ver_old', 'ver_green']);
    expect(proposition.payload.reason).toContain('renommage');
  });
});

describe('file de validation — ce qui attend une décision humaine (§12.6)', () => {
  it('la file contient les propositions en attente, dans l’ordre d’arrivée', async () => {
    const scenario = await buildScenario();
    const critere = makeCriterion({ criterionKey: 'AC-9', text: 'un jeton expiré est refusé' });
    const premiere = await enqueueProposal(scenario.deps, draftTest(critere));
    const seconde = await enqueueProposal(
      scenario.deps,
      draftRelink(['ver_old'], 'lien perdu après renommage du test'),
    );

    const file = await validationQueue(scenario.deps, 10);
    expect(file.map((proposition) => proposition.id)).toEqual([premiere.id, seconde.id]);
  });

  it('une proposition décidée sort de la file', async () => {
    const scenario = await buildScenario();
    const critere = makeCriterion({ criterionKey: 'AC-9', text: 'un jeton expiré est refusé' });
    const proposition = await enqueueProposal(scenario.deps, draftTest(critere));
    await scenario.store.putProposal({ ...proposition, state: 'accepted' });

    const file = await validationQueue(scenario.deps, 10);
    expect(file).toHaveLength(0);
  });

  it('la file respecte la limite demandée', async () => {
    const scenario = await buildScenario();
    const critere = makeCriterion({ criterionKey: 'AC-9', text: 'un jeton expiré est refusé' });
    await enqueueProposal(scenario.deps, draftTest(critere));
    await enqueueProposal(scenario.deps, draftRelink(['ver_old'], 'lien perdu'));

    expect(await validationQueue(scenario.deps, 1)).toHaveLength(1);
    expect(await validationQueue(scenario.deps, 0)).toHaveLength(0);
  });
});
