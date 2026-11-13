/**
 * Tests du métré — la priorité d'un trou (§11).
 *
 * Les tests portent le numéro de recette du §24 : chaque exigence testée est
 * nommée, pour que la recette se lise dans les titres.
 *
 * Trois entrées, toutes vérifiables : le type du critère, le risque observé de
 * la zone, la récurrence. Et **un score sans ses termes est refusé** : c'est
 * ce qui rend le classement explicable (§22).
 */
import { describe, expect, it } from 'vitest';
import { explainScore, scoreHole } from '../../src/domain/metric.js';
import type { ScoreInput } from '../../src/domain/metric.js';
import { KIND_WEIGHTS, RECURRENCE_WEIGHT, ZONE_RISK_WEIGHT } from '../../src/defaults.js';
import type { MetricRule, PriorityTerm, ZoneRisk } from '../../src/types.js';
import { AT, WEIGHTS, daysBefore, risk } from './metre-fixtures.js';

/** Une zone à risque mesurée : trois défauts récents, score 0,5. */
const ZONE_PAY: ZoneRisk = risk('src/pay');

/** Une entrée de métré avec les poids du socle. */
function input(over: Partial<ScoreInput> = {}): ScoreInput {
  return {
    kind: 'functional',
    recurrence: 0,
    weights: WEIGHTS,
    ...over,
  };
}

/** Le terme d'un nom donné. */
function term(terms: readonly PriorityTerm[], name: PriorityTerm['name']): PriorityTerm {
  const found = terms.find((row) => row.name === name);
  if (!found) throw new Error(`terme ${name} absent`);
  return found;
}

describe('métré — §24.11 le trou est priorisé et le calcul du score est affiché', () => {
  it('§24.11 — le score revient avec ses trois termes, jamais seul', () => {
    const scored = scoreHole(input({ kind: 'security' }));
    expect(scored.terms).toHaveLength(3);
    expect(scored.terms.map((row) => row.name)).toEqual(['kind', 'zone-risk', 'recurrence']);
  });

  it('§24.11 — le score est borné dans [0, 1]', () => {
    const scored = scoreHole(input({ kind: 'security', zoneRisk: ZONE_PAY, recurrence: 3 }));
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.score).toBeLessThanOrEqual(1);
  });

  it('§24.11 — la phrase affichée montre le calcul, terme par terme', () => {
    const scored = scoreHole(input({ kind: 'security', zoneRisk: ZONE_PAY, recurrence: 1 }));
    const phrase = explainScore(scored.terms);
    expect(phrase).toContain('type de critère');
    expect(phrase).toContain('critère de sécurité');
    expect(phrase).toContain('zone à risque');
    expect(phrase).toContain('src/pay');
    expect(phrase).toContain('récurrence');
    expect(phrase).toContain('échappé');
    expect(phrase).toContain('Σ(poids × valeur)');
  });

  it('§24.11 — la phrase se recalcule : poids × valeur, divisés par les poids', () => {
    const scored = scoreHole(input({ kind: 'security', zoneRisk: ZONE_PAY, recurrence: 1 }));
    const total = scored.terms.reduce((sum, term) => sum + term.weight, 0);
    const weighted = scored.terms.reduce((sum, term) => sum + term.weight * term.value, 0);
    expect(scored.score).toBeCloseTo(weighted / total, 4);
  });

  it('§24.11 — un score sans ses termes est refusé', () => {
    expect(() => explainScore([])).toThrow(/refusé/);
  });
});

describe('métré — les trois entrées sont vérifiables', () => {
  it('le type du critère : la sécurité passe avant le fonctionnel', () => {
    const security = scoreHole(input({ kind: 'security' }));
    const functional = scoreHole(input({ kind: 'functional' }));
    expect(security.score).toBeGreaterThan(functional.score);
  });

  it('le type du critère : les poids du socle sont ceux du §11', () => {
    expect(KIND_WEIGHTS.security).toBe(1);
    expect(KIND_WEIGHTS['non-regression']).toBe(0.9);
    expect(KIND_WEIGHTS['edge-case']).toBe(0.7);
    expect(KIND_WEIGHTS.functional).toBe(0.5);
    expect(KIND_WEIGHTS.performance).toBe(0.4);
    expect(KIND_WEIGHTS.documentation).toBe(0.2);
    expect(KIND_WEIGHTS.experience).toBe(0.2);
  });

  it('la zone à risque : un score observé fait monter le trou', () => {
    const sansZone = scoreHole(input());
    const avecZone = scoreHole(input({ zoneRisk: ZONE_PAY }));
    expect(avecZone.score).toBeGreaterThan(sansZone.score);
    expect(term(avecZone.terms, 'zone-risk').value).toBe(ZONE_PAY.score);
    expect(term(avecZone.terms, 'zone-risk').weight).toBe(ZONE_RISK_WEIGHT);
  });

  it('la zone à risque : une zone inconnue vaut 0 et le dit', () => {
    const scored = scoreHole(input());
    expect(term(scored.terms, 'zone-risk').value).toBe(0);
    expect(term(scored.terms, 'zone-risk').because).toContain('zone sans antécédent');
  });

  it('la zone à risque : la raison cite la zone et le nombre de cassures', () => {
    const scored = scoreHole(input({ zoneRisk: ZONE_PAY }));
    expect(term(scored.terms, 'zone-risk').because).toContain('src/pay');
    expect(term(scored.terms, 'zone-risk').because).toContain('3 fois');
  });

  it('la récurrence : un critère déjà échappé est prioritaire', () => {
    const scored = scoreHole(input({ recurrence: 1 }));
    expect(term(scored.terms, 'recurrence').value).toBe(1);
    expect(term(scored.terms, 'recurrence').weight).toBe(RECURRENCE_WEIGHT);
    expect(term(scored.terms, 'recurrence').because).toContain('échappé');
  });

  it('la récurrence : un critère jamais échappé vaut 0', () => {
    const scored = scoreHole(input({ recurrence: 0 }));
    expect(term(scored.terms, 'recurrence').value).toBe(0);
    expect(scoreHole(input({ recurrence: 1 })).score).toBeGreaterThan(scored.score);
  });
});

describe('métré — les poids sont une décision, pas une vérité (§11)', () => {
  it('une règle d’équipe change le classement sans changer les termes affichés', () => {
    const rule: MetricRule = {
      id: 'rule_1',
      scope: 'TRAME-1',
      weights: {
        kind: { ...KIND_WEIGHTS, security: 0.3, functional: 1 },
        zoneRisk: 0.1,
        recurrence: 0.1,
      },
      updatedAt: AT,
    };
    const standard = scoreHole(input({ kind: 'security' }));
    const tuned = scoreHole(input({ kind: 'security', weights: rule.weights }));
    // les termes affichés ne changent pas : mêmes entrées, mêmes raisons
    expect(tuned.terms.map((row) => row.name)).toEqual(standard.terms.map((row) => row.name));
    expect(tuned.terms.map((row) => row.because)).toEqual(standard.terms.map((row) => row.because));
    // mais le classement, si : l'équipe qui privilégie le fonctionnel passe devant
    const standardFunctional = scoreHole(input({ kind: 'functional' }));
    const tunedFunctional = scoreHole(input({ kind: 'functional', weights: rule.weights }));
    expect(standard.score).toBeGreaterThan(standardFunctional.score);
    expect(tunedFunctional.score).toBeGreaterThan(tuned.score);
  });

  it('une équipe qui ignore la zone ne fait plus remonter la zone', () => {
    const weights: MetricRule['weights'] = {
      kind: KIND_WEIGHTS,
      zoneRisk: 0,
      recurrence: RECURRENCE_WEIGHT,
    };
    const sansZone = scoreHole(input({ weights }));
    const avecZone = scoreHole(input({ weights, zoneRisk: ZONE_PAY }));
    expect(avecZone.score).toBe(sansZone.score);
    // le terme reste affiché : on ne cache pas une entrée, on l'annonce
    expect(term(avecZone.terms, 'zone-risk').weight).toBe(0);
  });

  it('un poids nul sur une entrée l’élimine du classement', () => {
    const weights: MetricRule['weights'] = {
      kind: { ...KIND_WEIGHTS, functional: 0 },
      zoneRisk: ZONE_RISK_WEIGHT,
      recurrence: RECURRENCE_WEIGHT,
    };
    const scored = scoreHole(input({ weights }));
    expect(term(scored.terms, 'kind').weight).toBe(0);
    expect(scored.score).toBe(0);
  });
});

describe('métré — le module est pur', () => {
  it('aucune date ne vient de l’horloge : la zone est celle qu’on donne', () => {
    const ancienne = risk('src/pay', { lastDefectAt: daysBefore(400), computedAt: daysBefore(1) });
    const scored = scoreHole(input({ zoneRisk: ancienne }));
    expect(term(scored.terms, 'zone-risk').because).toContain('src/pay');
  });

  it('le score ne dépend d’aucune personne : aucun auteur dans les termes', () => {
    const scored = scoreHole(input({ kind: 'security', zoneRisk: ZONE_PAY, recurrence: 1 }));
    const rendered = JSON.stringify(scored.terms);
    expect(rendered).not.toContain('author');
    expect(rendered).not.toContain('actor');
  });
});
