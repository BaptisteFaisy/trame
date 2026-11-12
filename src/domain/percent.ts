/**
 * L'affichage honnête des effectifs (§12.4, §22).
 *
 * La trame est mesurée en **effectifs** : `Coverage` ne contient aucun
 * pourcentage (`src/types.ts`). Les pourcentages naissent ici, au moment de
 * l'affichage, et voyagent toujours avec leur numérateur et leur dénominateur —
 * un chiffre sans effectif est un chiffre qu'on ne peut pas vérifier (§22).
 *
 * Deux refus d'honnêteté :
 *
 *  - sous l'effectif minimal (`MIN_SAMPLE_FOR_CONCLUSION`, 5), l'app **refuse de
 *    conclure** : « pas assez d'historique », pas « 33 % de baisse » ;
 *  - un périmètre sans aucun critère écrit n'est pas « 0 % » : c'est un autre
 *    problème (§23, §24.16), que l'écran dit avec ses propres mots.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Coverage, PercentWithCount } from '../types.js';
import { MIN_SAMPLE_FOR_CONCLUSION } from '../defaults.js';

/** Le verdict sur un effectif : on conclut, ou on refuse de conclure. */
export type Conclusion = 'conclusive' | 'not-enough-history';

/** Un chiffre arrondi à une décimale — jamais plus de précision qu'il n'y en a. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Un pourcentage avec son effectif. Un dénominateur nul donne 0 : « aucun
 * critère écrit » ne se dit pas « 0 % » (voir `hasNoCriterion`).
 */
export function percent(count: number, total: number): PercentWithCount {
  return {
    percent: total > 0 ? round1((count / total) * 100) : 0,
    count,
    total,
  };
}

/** Vrai si l'effectif autorise une conclusion (§22). */
export function sufficient(n: number): boolean {
  return n >= MIN_SAMPLE_FOR_CONCLUSION;
}

/** Sous l'effectif minimal : l'app refuse de conclure. */
export function conclusion(n: number): Conclusion {
  return sufficient(n) ? 'conclusive' : 'not-enough-history';
}

/**
 * Vrai quand le périmètre ne contient **aucun critère écrit** : ni critère
 * vérifiable, ni critère infalsifiable. L'écran affiche alors
 * `msg.no-criterion-written` (« aucun critère d'acceptation écrit — pas 0 % »)
 * et ne montre aucune part en pourcentage (§23, §24.16).
 */
export function hasNoCriterion(coverage: Coverage): boolean {
  return coverage.criteriaTotal === 0 && coverage.unfalsifiableCount === 0;
}
