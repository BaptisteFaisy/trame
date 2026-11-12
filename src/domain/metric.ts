/**
 * Le métré — la priorité d'un trou (§11).
 *
 * Trois entrées, **toutes vérifiables**, rien d'autre :
 *
 *  1. `kind` — le poids du type de critère (`KIND_WEIGHTS` : sécurité 1,
 *     non-régression 0,9, cas limite 0,7, fonctionnel 0,5, performance 0,4,
 *     documentation/expérience 0,2) ;
 *  2. `zone-risk` — le score observé de la zone du dépôt : 0 si la zone est
 *     inconnue, et le terme explique alors « zone sans antécédent » ;
 *  3. `recurrence` — 1 si ce critère (ou un critère frère) a déjà été trouvé
 *     faux après livraison, 0 sinon.
 *
 * Le score final est une **combinaison pondérée bornée dans [0, 1]** : chaque
 * terme contribue `valeur × poids`, et le total est normalisé par la somme des
 * poids (moyenne pondérée). Un poids nul — une équipe qui décide de ne pas
 * regarder la zone — fait disparaître l'entrée du classement, jamais du
 * calcul affiché.
 *
 * **Un score sans ses termes est refusé** : `scoreHole` renvoie toujours le
 * score *et* les trois termes qui l'ont produit (y compris leurs poids et
 * leurs raisons en français). C'est ce qui rend le classement explicable
 * (§22) : la Priorité affichée montre son calcul, jamais un chiffre nu.
 *
 * Les poids sont une décision, pas une vérité (§11) : ils viennent de
 * l'entrée `weights` (une `MetricRule` d'équipe), jamais d'une constante
 * cachée ici. Aucune notion de personne n'entre dans le calcul (§5, §22).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CriterionKind, MetricRule, PriorityTerm, ZoneRisk } from '../types.js';
import { KIND_WEIGHTS, RECURRENCE_WEIGHT, ZONE_RISK_WEIGHT } from '../defaults.js';

/* ------------------------------------------------------------------ entrée */

/** Tout ce qu'il faut pour classer un trou — et rien de plus. */
export interface ScoreInput {
  /** Le type du critère : la première entrée du métré (§11). */
  kind: CriterionKind;
  /** Le risque observé de la zone du dépôt ; absent = zone inconnue. */
  zoneRisk?: ZoneRisk;
  /** Nombre d'échappements passés de ce critère ou d'un critère frère. */
  recurrence: number;
  /** Les poids de l'équipe (`MetricRule`) : une décision, pas une vérité. */
  weights: MetricRule['weights'];
}

/** Les trois termes du métré : le score ne sort jamais sans eux. */
export type MetricTerms = [PriorityTerm, PriorityTerm, PriorityTerm];

/** Un score accompagné de ses termes — jamais un score seul. */
export interface ScoredHole {
  score: number;
  terms: MetricTerms;
}

/* ---------------------------------------------------------------- interne */

/** Comment le type de critère est nommé dans l'explication (français). */
const KIND_LABELS: Record<CriterionKind, string> = {
  security: 'critère de sécurité',
  'non-regression': 'critère de non-régression',
  'edge-case': 'cas limite',
  functional: 'critère fonctionnel',
  performance: 'critère de performance',
  documentation: 'critère de documentation',
  experience: "critère d'expérience",
};

/** Comment chaque terme est nommé dans l'explication (français). */
const TERM_LABELS: Record<PriorityTerm['name'], string> = {
  kind: 'type de critère',
  'zone-risk': 'zone à risque',
  recurrence: 'récurrence',
};

/** Comment la valeur de chaque terme est nommée (c'est le calcul affiché). */
const VALUE_LABELS: Record<PriorityTerm['name'], string> = {
  kind: 'valeur',
  'zone-risk': 'score observé',
  recurrence: 'valeur',
};

/** Un poids valide : fini et positif ou nul. */
function safeWeight(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) return fallback;
  return value;
}

/** Une valeur dans [0, 1] : le score ne sort jamais du cadre. */
function clamp01(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value > 1 ? 1 : value;
}

/** Quatre décimales : le score est stocké en `DECIMAL(6,4)`. */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** Un nombre en français : la virgule décimale. */
export function formatNumber(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

/* ------------------------------------------------------------------ termes */

/** Le terme « type de critère » : le poids du type, la valeur 1 (il existe). */
function kindTerm(kind: CriterionKind, weights: MetricRule['weights']): PriorityTerm {
  return {
    name: 'kind',
    weight: safeWeight(weights.kind?.[kind], KIND_WEIGHTS[kind]),
    value: 1,
    because: KIND_LABELS[kind],
  };
}

/** Le terme « zone à risque » : le score observé de la zone, 0 si inconnue. */
function zoneTerm(zoneRisk: ZoneRisk | undefined, weight: number): PriorityTerm {
  return {
    name: 'zone-risk',
    weight,
    value: zoneRisk ? clamp01(zoneRisk.score) : 0,
    because: zoneBecause(zoneRisk),
  };
}

/** La raison du terme de zone, en français : les faits, pas le score. */
function zoneBecause(zoneRisk: ZoneRisk | undefined): string {
  if (!zoneRisk) return 'zone sans antécédent';
  const defects = zoneRisk.defectCount;
  const incidents = zoneRisk.openIncidentCount;
  if (defects > 0) {
    const broken = `zone ${zoneRisk.zone} déjà cassée ${defects} fois`;
    if (incidents > 0) return `${broken}, ${incidents} incident(s) ouvert(s)`;
    return broken;
  }
  if (incidents > 0) return `zone ${zoneRisk.zone} : ${incidents} incident(s) ouvert(s)`;
  return 'zone sans antécédent';
}

/** Le terme « récurrence » : 1 si le critère a déjà échappé, 0 sinon. */
function recurrenceTerm(recurrence: number, weight: number): PriorityTerm {
  const escaped = recurrence > 0;
  return {
    name: 'recurrence',
    weight,
    value: escaped ? 1 : 0,
    because: escaped ? escapeBecause(recurrence) : 'aucun antécédent d’échappement',
  };
}

/** La raison du terme de récurrence : combien de fois le critère a échappé. */
function escapeBecause(recurrence: number): string {
  if (recurrence <= 1) return 'critère déjà échappé une fois';
  return `critère déjà échappé ${recurrence} fois`;
}

/* ----------------------------------------------------------------- calcul */

/**
 * Classe un trou (§11) : le score **et** les trois termes qui l'ont produit.
 *
 * Le score est la moyenne pondérée des trois entrées :
 * `Σ(poids × valeur) / Σ(poids)`, donc toujours dans [0, 1].
 */
export function scoreHole(input: ScoreInput): ScoredHole {
  const weights = input.weights;
  const kind = kindTerm(input.kind, weights);
  const zone = zoneTerm(input.zoneRisk, safeWeight(weights.zoneRisk, ZONE_RISK_WEIGHT));
  const recurrence = recurrenceTerm(
    input.recurrence,
    safeWeight(weights.recurrence, RECURRENCE_WEIGHT),
  );
  const terms: MetricTerms = [kind, zone, recurrence];
  return { score: weightedScore(terms), terms };
}

/** La moyenne pondérée des termes : pondérée, bornée, explicable. */
function weightedScore(terms: MetricTerms): number {
  let numerator = 0;
  let denominator = 0;
  for (const term of terms) {
    numerator += term.weight * term.value;
    denominator += term.weight;
  }
  if (denominator <= 0) return 0;
  return round4(clamp01(numerator / denominator));
}

/* ------------------------------------------------------------- explication */

/** La phrase d'un terme, pour l'écran (§22 : le calcul est affiché). */
function termSentence(term: PriorityTerm): string {
  const value = `${VALUE_LABELS[term.name]} ${formatNumber(term.value)}`;
  return `${TERM_LABELS[term.name]} : ${term.because} (poids ${formatNumber(term.weight)}, ${value})`;
}

/**
 * La phrase affichée sous le trou : le métré, en français, terme par terme.
 *
 * La formule est rappelée : le lecteur peut recalculer le score à partir des
 * seuls chiffres affichés (§22 — « le calcul du score est affiché », §24.11).
 *
 * Un score sans ses termes est **refusé** : il n'y a rien à expliquer, et
 * une priorité qui ne s'explique pas n'est pas affichable (§22).
 */
export function explainScore(terms: readonly PriorityTerm[]): string {
  if (terms.length === 0) {
    throw new Error('un score sans ses termes est refusé : rien à expliquer');
  }
  return `${terms.map(termSentence).join(' · ')} — score = Σ(poids × valeur) ÷ Σ(poids)`.trim();
}
