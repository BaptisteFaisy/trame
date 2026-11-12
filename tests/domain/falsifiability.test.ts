/**
 * Le jugement de falsifiabilité — tests réels (§8.4, §23, §24.10, TR-25).
 *
 * Ce que la recette exige (§24.10) : « un critère infalsifiable est compté à
 * part, et une reformulation vérifiable est proposée ». Et le cas limite
 * (§23) : « le système doit » est infaisable, pas un trou.
 */
import { describe, expect, it } from 'vitest';
import type { LlmGateway } from '../../src/ports.js';
import { falsifiabilityOf, isNegative } from '../../src/domain/falsifiability.js';
import { proposeReformulation, proposeReformulationWithModel } from '../../src/domain/reformulation.js';
import { buildScenario, makeCriterion } from '../helpers/index.js';

describe('falsifiabilité — un critère infalsifiable est compté à part (§24.10, §8.4)', () => {
  it('« l’application doit être rapide » n’est pas falsifiable, et la raison dit ce qui manque', () => {
    const verdict = falsifiabilityOf('l’application doit être rapide');
    expect(verdict.falsifiable).toBe(false);
    expect(verdict.reason).toContain('rapide');
    expect(verdict.reason).toContain('mesurable');
  });

  it('le critère AC-3 de TRAME-1 est compté à part : ni trou, ni couverture', async () => {
    const scenario = await buildScenario();
    const critere = await scenario.store.getCriterion(scenario.ids.ac3);
    if (!critere) throw new Error('AC-3 absent du scénario');
    expect(critere.falsifiable).toBe(false);
    expect(falsifiabilityOf(critere.text).falsifiable).toBe(false);
    const criteres = await scenario.store.listCriteria({ scopeType: 'ticket', scope: 'TRAME-1' });
    const verifiables = criteres.filter((un) => un.falsifiable);
    expect(criteres).toHaveLength(4);
    expect(verifiables).toHaveLength(3);
    expect(verifiables.map((un) => un.criterionKey)).not.toContain('AC-3');
  });

  it('une reformulation vérifiable est proposée : une mesure et un percentile (§24.10)', () => {
    const reformulation = proposeReformulation(
      'l’application doit être rapide',
      'pas de mesure : « rapide » n’est pas mesurable',
    );
    expect(reformulation.after).toBe('le temps de réponse du tableau de bord reste sous 2 s au 95ᵉ centile');
    expect(reformulation.measure).toContain('2 s');
    expect(reformulation.after).toContain('95ᵉ centile');
  });

  it('« l’ergonomie doit être agréable » devient une reformulation mesurable', () => {
    const reformulation = proposeReformulation(
      'l’ergonomie doit être agréable',
      'pas de mesure : « agréable » n’est pas mesurable',
    );
    expect(reformulation.after).toBe('80 % des utilisateurs terminent la tâche en moins de 30 s');
    expect(reformulation.measure).toContain('30 s');
  });
});

describe('falsifiabilité — un critère mesuré ou observable est falsifiable', () => {
  it('une grandeur chiffrée rend le critère tranchable', () => {
    expect(falsifiabilityOf('le temps de réponse du tableau de bord reste sous 2 s au 95ᵉ centile').falsifiable).toBe(
      true,
    );
  });

  it('un comportement observable rend le critère tranchable, même sans chiffre', () => {
    const verdict = falsifiabilityOf('le tissage classe les critères par ticket');
    expect(verdict.falsifiable).toBe(true);
    expect(verdict.reason).toBeUndefined();
  });

  it('une mesure l’emporte sur un mot sans mesure', () => {
    expect(falsifiabilityOf('l’application doit rester rapide sous 500 ms').falsifiable).toBe(true);
  });

  it('le numéro d’un critère (AC-3) n’est pas une mesure', () => {
    const verdict = falsifiabilityOf('AC-3 : le tableau de bord');
    expect(verdict.falsifiable).toBe(false);
    expect(verdict.reason).toContain('aucune vérification conceivable');
  });
});

describe('falsifiabilité — cas limites (§23)', () => {
  it('« le système doit » est infaisable : compté à part, jamais compté comme trou', () => {
    const verdict = falsifiabilityOf('le système doit');
    expect(verdict.falsifiable).toBe(false);
    expect(verdict.reason).toContain('à moitié écrit');
    expect(verdict.reason).toContain('jamais compté comme trou');
  });

  it('un critère vide est infalsifiable', () => {
    const verdict = falsifiabilityOf('   ');
    expect(verdict.falsifiable).toBe(false);
    expect(verdict.reason).toContain('vide');
  });

  it('un critère tronqué est infalsifiable', () => {
    const verdict = falsifiabilityOf('le clic');
    expect(verdict.falsifiable).toBe(false);
    expect(verdict.reason).toContain('à moitié écrit');
  });
});

describe('critères négatifs — « ne doit pas » (TR-25)', () => {
  it('une interdiction est un critère négatif', () => {
    expect(isNegative('l’application ne doit pas exposer les clés')).toBe(true);
  });

  it('une réalisation n’est pas un critère négatif', () => {
    expect(isNegative('le tableau de bord classe les critères par ticket')).toBe(false);
  });

  it('l’anglais est lu aussi', () => {
    expect(isNegative('the export must not contain personal data')).toBe(true);
  });
});

describe('reformulation — déterministe, sans modèle', () => {
  it('si le critère porte déjà une mesure, la reformulation la précise au lieu de l’inventer', () => {
    const reformulation = proposeReformulation(
      'le temps de réponse du tableau de bord reste sous 2 s',
      'pas de mesure : « rapide » n’est pas mesurable',
    );
    expect(reformulation.measure).toBe('sous 2 s');
    expect(reformulation.after).toContain('sous 2 s');
    expect(reformulation.after).toContain('95ᵉ centile');
  });

  it('un critère sans mesure connue propose la forme d’une mesure, sans inventer de seuil', () => {
    const reformulation = proposeReformulation(
      'le tableau de bord est élégant',
      'aucune vérification conceivable ne pourrait trancher',
    );
    expect(reformulation.after).toContain('95ᵉ centile');
    expect(reformulation.measure).toContain('à fixer');
  });

  it('le même texte donne toujours la même reformulation', () => {
    const une = proposeReformulation('l’application doit être rapide', 'pas de mesure');
    const deux = proposeReformulation('l’application doit être rapide', 'pas de mesure');
    expect(une).toEqual(deux);
  });
});

describe('reformulation — passerelle LLM, repli et budget (§22)', () => {
  it('le modèle est appelé et le budget du jour est incrémenté', async () => {
    const scenario = await buildScenario();
    scenario.llm.reformulations.set('l’application doit être rapide', {
      after: 'le temps de réponse du tableau de bord reste sous 500 ms au 95ᵉ centile',
      measure: 'temps de réponse < 500 ms',
    });
    const critere = makeCriterion({ text: 'l’application doit être rapide' });
    const resultat = await proposeReformulationWithModel(scenario.deps, critere, 'pas de mesure');
    expect(resultat.after).toContain('500 ms');
    const budget = await scenario.store.getBudget('2026-11-12');
    expect(budget?.llmCalls).toBe(1);
  });

  it('sans passerelle de reformulation, le gabarit déterministe prend le relais', async () => {
    const scenario = await buildScenario();
    const llm = {
      suggestLinks: async () => [],
      classifyKind: async () => 'functional' as const,
      unfalsifiableReason: async () => null,
      draftTest: async () => ({ title: '', body: '' }),
    } as unknown as LlmGateway;
    const deps = { ...scenario.deps, llm };
    const critere = makeCriterion({ text: 'l’application doit être rapide' });
    const resultat = await proposeReformulationWithModel(deps, critere, 'pas de mesure');
    expect(resultat.after).toBe('le temps de réponse du tableau de bord reste sous 2 s au 95ᵉ centile');
  });

  it('une passerelle qui échoue retombe sur le gabarit, et l’appel reste au budget', async () => {
    const scenario = await buildScenario();
    scenario.llm.proposeReformulation = async () => {
      throw new Error('passerelle injoignable');
    };
    const critere = makeCriterion({ text: 'l’application doit être rapide' });
    const resultat = await proposeReformulationWithModel(scenario.deps, critere, 'pas de mesure');
    expect(resultat.after).toBe('le temps de réponse du tableau de bord reste sous 2 s au 95ᵉ centile');
    const budget = await scenario.store.getBudget('2026-11-12');
    expect(budget?.llmCalls).toBe(1);
  });
});
