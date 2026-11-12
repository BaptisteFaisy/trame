/**
 * Les données de test du métré (§11) — un seul jeu, partagé par les tests
 * du métré, des zones et des trous, pour que les trois jugent la même chose.
 *
 * Le périmètre de référence :
 *
 *  - AC-1 critère de sécurité, zone `src/pay` (zone à risque), sans maille ;
 *  - AC-2 critère fonctionnel, zone `src/web` (zone sans antécédent) ;
 *  - AC-3 critère **infalsifiable** : ni trou, ni couverture (§8.4) ;
 *  - AC-4 critère fonctionnel couvert par un test **désactivé** : trou ;
 *  - AC-5 critère fonctionnel couvert par une liaison **rejetée** : trou ;
 *  - AC-6 critère fonctionnel couvert par un acte dont le fil est **détendu**.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Criterion, Dangling, Link, Verification, ZoneRisk } from '../../src/types.js';
import { DEFAULT_SETTINGS } from '../../src/defaults.js';
import { makeCriterion, makeLink, makeVerification } from '../helpers/index.js';

/** La date de référence : la date vient des données, jamais de l'horloge. */
export const AT = '2026-11-12T09:00:00.000Z';

/** Une date antérieure, en jours, pour dater un défaut. */
export function daysBefore(days: number, from = AT): string {
  const at = new Date(from);
  at.setUTCDate(at.getUTCDate() - days);
  return at.toISOString();
}

/** Les poids du socle : la règle par défaut d'une équipe qui n'a rien réglé. */
export const WEIGHTS = DEFAULT_SETTINGS.metricWeights;

/** Un critère du périmètre de référence. */
export function crit(key: string, over: Partial<Criterion> = {}): Criterion {
  return makeCriterion({ id: `crit_${key}`, criterionKey: key, textHash: `hash_${key}`, ...over });
}

/** Un acte de vérification ; la force suit la forme de l'acte (§7). */
export function act(id: string, over: Partial<Verification> = {}): Verification {
  return makeVerification({ id, ...over });
}

/** Une maille : un critère, un acte, un type de liaison. */
export function mesh(
  criterion: Criterion,
  verification: Verification,
  over: Partial<Link> = {},
): Link {
  return makeLink({
    id: `link_${criterion.criterionKey}_${verification.id}`,
    criterionId: criterion.id,
    verificationId: verification.id,
    criterionHashAtLink: criterion.textHash,
    ...over,
  });
}

/** Un fil détendu : l'acte ne couvre plus rien (§8.3). */
export function dang(verificationId: string, over: Partial<Dangling> = {}): Dangling {
  return {
    id: `dang_${verificationId}`,
    verificationId,
    verificationName: verificationId,
    reason: 'test-disabled',
    detectedAt: AT,
    impact: 1,
    state: 'open',
    ...over,
  };
}

/** Une zone à risque déjà mesurée (`zones.ts`). */
export function risk(zone: string, over: Partial<ZoneRisk> = {}): ZoneRisk {
  return {
    scope: 'TRAME-1',
    zone,
    defectCount: 3,
    lastDefectAt: daysBefore(2),
    openIncidentCount: 0,
    score: 0.5,
    computedAt: AT,
    ...over,
  };
}
