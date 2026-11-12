/**
 * Tests de la trame — le calcul de couverture (§8.1) et son honnêteté (§22).
 *
 * Les tests portent le numéro de recette du §24 : chaque exigence testée est
 * nommée, pour que la recette se lise dans les titres.
 */
import { describe, expect, it } from 'vitest';
import { computeCoverage } from '../../src/domain/coverage.js';
import type { CoverageInput } from '../../src/domain/coverage.js';
import { conclusion, hasNoCriterion, percent, sufficient } from '../../src/domain/percent.js';
import { MIN_SAMPLE_FOR_CONCLUSION } from '../../src/defaults.js';
import { FR } from '../../src/i18n/index.js';
import type { Coverage, Dangling, Verification } from '../../src/types.js';
import { AT, act, crit, mesh, referenceScope } from './fixtures.js';

/** La couverture du périmètre de référence, datée. */
function reference(): Coverage {
  const scope = referenceScope();
  return computeCoverage({
    ...scope,
    scope: 'TRAME-1',
    scopeType: 'ticket',
    computedAt: AT,
  });
}

/** Un périmètre ne contenant qu'un critère, couvert par un seul acte. */
function singleCriterion(verification: Verification): Coverage {
  const criterion = crit('AC-1');
  return computeCoverage({
    criteria: [criterion],
    verifications: [verification],
    links: [mesh(criterion, verification)],
    scope: 'TRAME-1',
    scopeType: 'ticket',
    computedAt: AT,
  });
}

/** La somme des valeurs d'un axe : il décompose, il ne double pas. */
function totalOf(axis: Record<string, number>): number {
  return Object.values(axis).reduce((sum, value) => sum + value, 0);
}

describe('trame — §24.3 les trois axes sont décomposés et jamais fusionnés', () => {
  it('§24.3 — force, type de liaison et fraîcheur sont trois lignes distinctes', () => {
    const coverage = reference();
    expect(coverage.byStrength).toEqual({ machine: 3, attested: 1, declared: 1 });
    expect(coverage.byLink).toEqual({ declared: 4, confirmed: 0, derived: 1 });
    expect(coverage.byFreshness).toEqual({ current: 4, stale: 1 });
  });

  it('§24.3 — chaque axe décompose le même ensemble de critères couverts', () => {
    const coverage = reference();
    const covered = coverage.coveredDeclared + coverage.coveredProvisional;
    expect(covered).toBe(5);
    expect(totalOf(coverage.byStrength)).toBe(covered);
    expect(totalOf(coverage.byLink)).toBe(covered);
    expect(totalOf(coverage.byFreshness)).toBe(covered);
  });

  it('§22 — la couverture ne contient aucun pourcentage', () => {
    expect(Object.keys(reference())).not.toContain('percent');
  });

  it('§8.1 — le dénominateur compte les critères vérifiables seulement', () => {
    const coverage = reference();
    expect(coverage.criteriaTotal).toBe(6);
    expect(coverage.criteriaFalsifiable).toBe(6);
    expect(coverage.unfalsifiableCount).toBe(1);
  });

  it('§8.1 — un critère sans maille est un trou', () => {
    const coverage = reference();
    expect(coverage.holes).toBe(1);
  });
});

describe('trame — §24.2 la force suit la forme de l’acte de vérification', () => {
  it('§24.2 — un test automatisé exécuté est compté « machine »', () => {
    const coverage = singleCriterion(act('ver_machine', { form: 'automated-test' }));
    expect(coverage.byStrength.machine).toBe(1);
    expect(coverage.proven).toBe(1);
  });

  it('§24.2 — une attestation tierce est comptée « attestée »', () => {
    const coverage = singleCriterion(act('ver_attested', { form: 'third-party' }));
    expect(coverage.byStrength.attested).toBe(1);
    expect(coverage.proven).toBe(1);
  });

  it('§24.2 — un commentaire est compté « déclarée », et le critère n’est pas prouvé', () => {
    const coverage = singleCriterion(act('ver_comment', { form: 'declaration' }));
    expect(coverage.byStrength.declared).toBe(1);
    expect(coverage.proven).toBe(0);
  });

  it('§4 — « couvert » n’est pas « prouvé » : le périmètre compte trois forces', () => {
    const coverage = reference();
    expect(coverage.coveredDeclared + coverage.coveredProvisional).toBe(5);
    expect(coverage.proven).toBe(2);
  });
});

describe('trame — §24.7 la couverture déclarée et la provisoire sont deux lignes', () => {
  it('§24.7 — une liaison dérivée au-dessus du seuil est provisoire, jamais déclarée', () => {
    const coverage = reference();
    expect(coverage.coveredProvisional).toBe(1);
    expect(coverage.byLink.derived).toBe(1);
    expect(coverage.coveredDeclared).toBe(4);
  });

  it('§24.7 — une liaison dérivée sous le seuil reste une proposition : le critère redevient un trou', () => {
    const scope = referenceScope();
    const derived = scope.links.find((link) => link.kind === 'derived');
    const weakened = scope.links.map((link) =>
      link.id === derived?.id ? { ...link, confidence: 0.62 } : link,
    );
    const coverage: CoverageInput = {
      ...scope,
      links: weakened,
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    };
    const result = computeCoverage(coverage);
    expect(result.coveredProvisional).toBe(0);
    expect(result.byLink.derived).toBe(0);
    expect(result.holes).toBe(2);
  });

  it('§24.7 — une liaison dérivée n’est jamais « prouvée »', () => {
    const coverage = reference();
    expect(coverage.coveredProvisional).toBeGreaterThan(0);
    expect(coverage.proven).toBeLessThan(coverage.coveredDeclared);
  });
});

describe('trame — §8.3 un acte mort retire sa couverture', () => {
  it('§24.5 — un test désactivé fait disparaître sa couverture du chiffre affiché', () => {
    const scope = referenceScope();
    const disabled = scope.verifications.map((verification) =>
      verification.id === 'ver_machine'
        ? { ...verification, disabledAt: '2026-11-11T08:00:00.000Z' }
        : verification,
    );
    const coverage = computeCoverage({
      ...scope,
      verifications: disabled,
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    });
    expect(coverage.byStrength.machine).toBe(2);
    expect(coverage.holes).toBe(2);
    expect(coverage.proven).toBe(1);
  });

  it('§8.3 — un fil détendu retire la couverture de son acte', () => {
    const scope = referenceScope();
    const dangling: Dangling[] = [
      {
        id: 'dang_1',
        verificationId: 'ver_machine',
        verificationName: 'TRAME-1.testMachine',
        reason: 'test-disabled',
        detectedAt: AT,
        impact: 1,
        state: 'open',
      },
    ];
    const coverage = computeCoverage({
      ...scope,
      dangling,
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    });
    expect(coverage.byStrength.machine).toBe(2);
    expect(coverage.holes).toBe(2);
    expect(coverage.dangling).toBe(1);
  });

  it('§9 — un lien rejeté ne couvre rien', () => {
    const scope = referenceScope();
    const rejected = scope.links.map((link) =>
      link.criterionId === 'crit_AC-1'
        ? { ...link, rejectedAt: '2026-11-10T08:00:00.000Z', rejectReason: 'mauvais test' }
        : link,
    );
    const coverage = computeCoverage({
      ...scope,
      links: rejected,
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    });
    expect(coverage.holes).toBe(2);
    expect(coverage.proven).toBe(1);
  });
});

describe('trame — §8.4 et §22 les absences ne sont pas des trous', () => {
  it('§8.4 — un critère infalsifiable n’est ni trou ni couverture', () => {
    const coverage = reference();
    expect(coverage.unfalsifiableCount).toBe(1);
    expect(coverage.holes).toBe(1);
  });

  it('§24.15 — un droit manquant est reporté comme angle mort, jamais comme trou', () => {
    const scope = referenceScope();
    const blindSpots = [
      { absence: 'no-right' as const, objectType: 'test-execution', detail: 'droit manquant' },
    ];
    const coverage = computeCoverage({
      ...scope,
    blindSpots,
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
    });
    expect(coverage.blindSpots).toHaveLength(1);
    expect(coverage.blindSpots[0].absence).toBe('no-right');
    expect(coverage.holes).toBe(1);
  });
});

describe('trame — §24.16 un projet sans aucun critère', () => {
  it('§24.16 — aucun critère écrit n’est pas « 0 % »', () => {
    const coverage = computeCoverage({
      criteria: [],
      verifications: [],
      links: [],
      scope: 'PROJ-VIDE',
      scopeType: 'project',
      computedAt: AT,
    });
    expect(coverage.criteriaTotal).toBe(0);
    expect(coverage.holes).toBe(0);
    expect(hasNoCriterion(coverage)).toBe(true);
    expect(percent(0, 0)).toEqual({ percent: 0, count: 0, total: 0 });
    expect(FR['msg.no-criterion-written']).toContain('pas 0 %');
  });

  it('§24.16 — un projet qui a des critères n’est pas le cas vide', () => {
    expect(hasNoCriterion(reference())).toBe(false);
  });
});

describe('trame — §22 on refuse de conclure sous l’effectif minimal', () => {
  it('§22 — sous l’effectif minimal, l’app refuse de conclure', () => {
    expect(MIN_SAMPLE_FOR_CONCLUSION).toBe(5);
    expect(sufficient(4)).toBe(false);
    expect(sufficient(5)).toBe(true);
    expect(conclusion(4)).toBe('not-enough-history');
    expect(conclusion(5)).toBe('conclusive');
  });

  it('§22 — un pourcentage porte toujours son effectif', () => {
    const share = percent(3, 12);
    expect(share).toEqual({ percent: 25, count: 3, total: 12 });
  });
});
