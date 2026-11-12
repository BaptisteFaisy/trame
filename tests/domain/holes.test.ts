/**
 * Tests des trous — les critères sans maille vivante, classés par le métré
 * (§11, §12.1).
 *
 * Les tests portent le numéro de recette du §24 : chaque exigence testée est
 * nommée, pour que la recette se lise dans les titres.
 */
import { describe, expect, it } from 'vitest';
import { findHoles } from '../../src/domain/holes.js';
import type { HoleInput } from '../../src/domain/holes.js';
import { explainScore } from '../../src/domain/metric.js';
import { computeZoneRisks } from '../../src/domain/zones.js';
import { KIND_WEIGHTS } from '../../src/defaults.js';
import type {
  Criterion,
  Dangling,
  Link,
  MetricRule,
  Verification,
  ZoneRisk,
} from '../../src/types.js';
import { AT, act, crit, dang, daysBefore, mesh, risk } from './metre-fixtures.js';

/** Le périmètre de référence : six critères écrits, un trou clarifié. */
interface Scenario {
  criteria: Criterion[];
  verifications: Verification[];
  links: Link[];
  dangling: Dangling[];
  zoneRisks: ZoneRisk[];
  recurrenceByCriterion: Record<string, number>;
}

/** Un périmètre de base : un critère fonctionnel nu. */
function bare(): Scenario {
  return {
    criteria: [crit('AC-1')],
    verifications: [],
    links: [],
    dangling: [],
    zoneRisks: [],
    recurrenceByCriterion: {},
  };
}

/** L'entrée du domaine, avec le périmètre et son poids de règle. */
function inputOf(scenario: Scenario, over: Partial<HoleInput> = {}): HoleInput {
  return {
    ...scenario,
    scope: 'TRAME-1',
    ...over,
  };
}

/** Le trou d'un critère, trouvé par sa clé. */
function holeOf(scenario: Scenario, criterionKey: string, over: Partial<HoleInput> = {}) {
  const hole = findHoles(inputOf(scenario, over)).find((row) => row.criterionKey === criterionKey);
  if (!hole) throw new Error(`pas de trou pour ${criterionKey}`);
  return hole;
}

describe('trous — §24.11 le trou est priorisé par le métré et le calcul est affiché', () => {
  it('§24.11 — un critère sans maille vivante est un trou', () => {
    const scenario = bare();
    const holes = findHoles(inputOf(scenario));
    expect(holes).toHaveLength(1);
    expect(holes[0].criterionKey).toBe('AC-1');
    expect(holes[0].state).toBe('open');
  });

  it('§24.11 — chaque trou porte son score et ses trois termes', () => {
    const scenario = bare();
    const hole = holeOf(scenario, 'AC-1');
    expect(hole.priorityScore).toBeGreaterThan(0);
    expect(hole.priorityScore).toBeLessThanOrEqual(1);
    expect(hole.priorityTerms.map((row) => row.name)).toEqual(['kind', 'zone-risk', 'recurrence']);
  });

  it('§24.11 — la phrase du trou montre le calcul de la priorité', () => {
    const scenario = bare();
    const hole = holeOf(scenario, 'AC-1');
    const phrase = explainScore(hole.priorityTerms);
    expect(phrase).toContain('type de critère');
    expect(phrase).toContain('critère fonctionnel');
    expect(phrase).toContain('zone sans antécédent');
  });

  it('§24.11 — les trous sont triés par priorité décroissante', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1'), crit('AC-2', { kind: 'security' })];
    const holes = findHoles(inputOf(scenario));
    expect(holes[0].criterionKey).toBe('AC-2');
    expect(holes[0].priorityScore).toBeGreaterThanOrEqual(holes[1].priorityScore);
  });
});

describe('trous — §24.12 un critère d’une zone à risque remonte dans le classement', () => {
  it('§24.12 — le trou d’une zone déjà cassée passe devant celui d’une zone calme', () => {
    const scenario = bare();
    const testPay = act('ver_pay', { zone: 'src/pay' });
    const testWeb = act('ver_web', { zone: 'src/web' });
    scenario.criteria = [crit('AC-1'), crit('AC-2')];
    scenario.verifications = [testPay, testWeb];
    scenario.links = [
      mesh(scenario.criteria[0], testPay, { kind: 'derived', confidence: 0.5 }),
      mesh(scenario.criteria[1], testWeb, { kind: 'derived', confidence: 0.5 }),
    ];
    scenario.zoneRisks = [
      risk('src/pay', { scope: 'TRAME-1', score: 0.8, defectCount: 5 }),
      risk('src/web', { scope: 'TRAME-1', score: 0.1, defectCount: 1 }),
    ];
    const holes = findHoles(inputOf(scenario));
    expect(holes[0].criterionKey).toBe('AC-1');
    expect(holes[0].zone).toBe('src/pay');
    expect(holes[0].priorityScore).toBeGreaterThan(holes[1].priorityScore);
  });

  it('§24.12 — le terme de zone du trou affiche le score observé de la zone', () => {
    const scenario = bare();
    const testPay = act('ver_pay', { zone: 'src/pay' });
    scenario.verifications = [testPay];
    scenario.links = [mesh(scenario.criteria[0], testPay, { kind: 'derived', confidence: 0.5 })];
    scenario.zoneRisks = [risk('src/pay', { scope: 'TRAME-1', score: 0.8, defectCount: 5 })];
    const hole = holeOf(scenario, 'AC-1');
    const zoneTerm = hole.priorityTerms.find((row) => row.name === 'zone-risk');
    expect(zoneTerm?.value).toBe(0.8);
    expect(zoneTerm?.because).toContain('src/pay');
  });

  it('la zone à risque se mesure avec les zones calculées (zones.ts)', () => {
    const scenario = bare();
    const testPay = act('ver_pay', { zone: 'src/pay' });
    scenario.verifications = [testPay];
    scenario.links = [mesh(scenario.criteria[0], testPay, { kind: 'derived', confidence: 0.5 })];
    scenario.zoneRisks = computeZoneRisks({
      scope: 'TRAME-1',
      defects: [{ zone: 'src/pay', at: daysBefore(2), resolvedAfterDelivery: true }],
      openIncidents: [],
      now: AT,
    });
    const hole = holeOf(scenario, 'AC-1');
    expect(hole.zone).toBe('src/pay');
    expect(hole.priorityScore).toBeGreaterThan(0.3);
  });

  it('des actes qui se contredisent ne donnent pas de zone devinée', () => {
    const scenario = bare();
    scenario.verifications = [act('ver_a', { zone: 'src/a' }), act('ver_b', { zone: 'src/b' })];
    const hole = holeOf(scenario, 'AC-1');
    expect(hole.zone).toBeUndefined();
    const zoneTerm = hole.priorityTerms.find((row) => row.name === 'zone-risk');
    expect(zoneTerm?.because).toContain('zone sans antécédent');
  });

  it('la zone du critère lui-même prime sur celle des actes', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1', { zone: 'src/propre' } as Partial<Criterion>)];
    scenario.verifications = [act('ver_a', { zone: 'src/autre' })];
    const hole = holeOf(scenario, 'AC-1');
    expect(hole.zone).toBe('src/propre');
  });
});

describe('trous — un critère infalsifiable n’est pas un trou (§8.4)', () => {
  it('un critère infalsifiable n’apparaît pas dans les trous', () => {
    const scenario = bare();
    scenario.criteria = [
      crit('AC-1', { falsifiable: false, unfalsifiableReason: '« rapide » n’est pas mesurable' }),
    ];
    expect(findHoles(inputOf(scenario))).toEqual([]);
  });

  it('un critère falsifiable voisin reste un trou', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1', { falsifiable: false }), crit('AC-2')];
    const holes = findHoles(inputOf(scenario));
    expect(holes).toHaveLength(1);
    expect(holes[0].criterionKey).toBe('AC-2');
  });

  it('un critère supprimé disparaît du périmètre', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1', { deletedAt: daysBefore(1) })];
    expect(findHoles(inputOf(scenario))).toEqual([]);
  });
});

describe('trous — une maille morte ne couvre plus rien (§8.3)', () => {
  it('un critère couvert par un test désactivé redevient un trou', () => {
    const scenario = bare();
    const test = act('ver_off', { disabledAt: daysBefore(1), status: 'ignored' });
    scenario.verifications = [test];
    scenario.links = [mesh(scenario.criteria[0], test)];
    const holes = findHoles(inputOf(scenario));
    expect(holes).toHaveLength(1);
    expect(holes[0].criterionKey).toBe('AC-1');
  });

  it('un critère couvert par une liaison rejetée redevient un trou', () => {
    const scenario = bare();
    const test = act('ver_ok');
    scenario.verifications = [test];
    scenario.links = [
      mesh(scenario.criteria[0], test, { rejectedAt: daysBefore(2), rejectReason: 'autre test' }),
    ];
    expect(findHoles(inputOf(scenario))).toHaveLength(1);
  });

  it('un critère dont le fil est détendu redevient un trou', () => {
    const scenario = bare();
    const test = act('ver_gone');
    scenario.verifications = [test];
    scenario.links = [mesh(scenario.criteria[0], test)];
    scenario.dangling = [dang('ver_gone')];
    expect(findHoles(inputOf(scenario))).toHaveLength(1);
  });

  it('un fil détendu réparé ne vide plus la couverture', () => {
    const scenario = bare();
    const test = act('ver_gone');
    scenario.verifications = [test];
    scenario.links = [mesh(scenario.criteria[0], test)];
    scenario.dangling = [dang('ver_gone', { state: 'repaired' })];
    expect(findHoles(inputOf(scenario))).toEqual([]);
  });

  it('une liaison dérivée sous le seuil ne couvre pas (§9.2)', () => {
    const scenario = bare();
    const test = act('ver_maybe');
    scenario.verifications = [test];
    scenario.links = [mesh(scenario.criteria[0], test, { kind: 'derived', confidence: 0.62 })];
    expect(findHoles(inputOf(scenario))).toHaveLength(1);
  });

  it('une liaison dérivée au-dessus du seuil ne fait pas de trou', () => {
    const scenario = bare();
    const test = act('ver_maybe');
    scenario.verifications = [test];
    scenario.links = [mesh(scenario.criteria[0], test, { kind: 'derived', confidence: 0.91 })];
    expect(findHoles(inputOf(scenario))).toEqual([]);
  });

  it('une maille vivante couvre : le critère n’est pas un trou', () => {
    const scenario = bare();
    const test = act('ver_ok');
    scenario.verifications = [test];
    scenario.links = [mesh(scenario.criteria[0], test)];
    expect(findHoles(inputOf(scenario))).toEqual([]);
  });
});

describe('trous — la récurrence prioritaire (§11)', () => {
  it('un critère déjà échappé passe devant son frère jamais échappé', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1'), crit('AC-2')];
    scenario.recurrenceByCriterion = { 'crit_AC-1': 1 };
    const holes = findHoles(inputOf(scenario));
    expect(holes[0].criterionKey).toBe('AC-1');
    expect(holes[0].priorityScore).toBeGreaterThan(holes[1].priorityScore);
  });

  it('le terme de récurrence explique l’échappement', () => {
    const scenario = bare();
    scenario.recurrenceByCriterion = { 'crit_AC-1': 2 };
    const hole = holeOf(scenario, 'AC-1');
    const recurrence = hole.priorityTerms.find((row) => row.name === 'recurrence');
    expect(recurrence?.value).toBe(1);
    expect(recurrence?.because).toContain('échappé');
  });
});

describe('trous — les poids réglés par une équipe changent le classement', () => {
  it('une règle d’équipe change l’ordre sans changer les termes affichés', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1', { kind: 'security' }), crit('AC-2', { kind: 'functional' })];
    const rule: MetricRule = {
      id: 'rule_1',
      scope: 'TRAME-1',
      weights: {
        kind: { ...KIND_WEIGHTS, security: 0.3, functional: 1 },
        zoneRisk: 0.6,
        recurrence: 0.5,
      },
      updatedAt: AT,
    };
    const standard = findHoles(inputOf(scenario));
    const tuned = findHoles(inputOf(scenario, { rule }));
    expect(standard[0].criterionKey).toBe('AC-1');
    expect(tuned[0].criterionKey).toBe('AC-2');
    const reasonsOf = (holes: typeof standard, key: string) =>
      holes.find((row) => row.criterionKey === key)?.priorityTerms.map((row) => row.because);
    expect(reasonsOf(tuned, 'AC-2')).toEqual(reasonsOf(standard, 'AC-2'));
  });
});

describe('trous — aucun score par personne (§5)', () => {
  it('le trou ne porte aucun auteur', () => {
    const scenario = bare();
    scenario.criteria = [crit('AC-1', { authorRef: 'acc-1' })];
    const hole = holeOf(scenario, 'AC-1');
    expect(JSON.stringify(hole)).not.toContain('acc-1');
  });

  it('le trou est déterministe : deux calculs donnent le même identifiant', () => {
    const scenario = bare();
    const first = findHoles(inputOf(scenario));
    const second = findHoles(inputOf(scenario));
    expect(first[0].id).toBe(second[0].id);
  });
});
