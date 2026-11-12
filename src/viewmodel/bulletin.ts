/**
 * Vue-modèle du bulletin de trame (§12.4).
 *
 * Le bulletin est **daté** et **comparable au témoin précédent** : la
 * couverture par force et par fraîcheur, les perforations, les fils détendus,
 * la part d'infalsifiables, la part de critères ajoutés, et la liste des trous
 * prioritaires (§24.13).
 *
 * Deux chiffres ne se comparent que si leurs périmètres **et** leurs époques
 * coïncident (§22) : sinon la comparaison est refusée, pas approximée. Sous
 * l'effectif minimal, l'app refuse de conclure (`src/domain/percent.ts`).
 *
 * Pur : il reçoit la trame, le témoin et les compteurs, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index.js';
import { t } from '../i18n/index.js';
import type { Coverage, Hole, ScopeType, Witness } from '../types.js';
import { comparableTo } from '../domain/witness.js';
import { conclusion } from '../domain/percent.js';
import { coverageView, figure, holeLine } from './common.js';
import type { AxisLine, CoverageView, Figure, HoleLine } from './common.js';
import { text } from './labels.js';

/* ------------------------------------------------------------------ entrée */

export interface BulletinInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  coverage: Coverage;
  /** Le témoin précédent : la comparaison (§24.13). */
  previous?: Witness | null;
  /** Les perforations du périmètre. */
  perforations: number;
  /** Les fils détendus du périmètre. */
  dangling: number;
  /** Les critères écrits pendant le sprint. */
  addedDuringSprint: number;
  /** Les trous, tels que le métré les a classés. */
  holes: readonly Hole[];
}

/* ------------------------------------------------------------------ sortie */

/** La comparaison au témoin précédent : datée, scopée, ou refusée. */
export interface BulletinComparison {
  /** La date du témoin précédent. */
  previousComputedAt: string;
  previousCoveredDeclared: number;
  previousProven: number;
  /** L'écart de couverture déclarée, en effectif. */
  coveredDeclaredDelta: number;
  /** L'écart de critères prouvés, en effectif. */
  provenDelta: number;
  /** `not-enough-history` : sous l'effectif minimal, l'app refuse de conclure. */
  conclusion: string;
  /** Vrai si les deux chiffres portent le même périmètre. */
  comparable: boolean;
}

export interface WeaveBulletin {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  /** La couverture, décomposée : les trois axes ne sont jamais fusionnés. */
  coverage: CoverageView;
  byStrength: AxisLine[];
  byFreshness: AxisLine[];
  perforations: Figure;
  dangling: Figure;
  unfalsifiable: Figure;
  added: Figure;
  topHoles: HoleLine[];
  comparison: BulletinComparison | null;
  messages: string[];
}

/** La comparaison au témoin précédent, ou `null` s'il n'y en a pas encore. */
function compareTo(previous: Witness | null, coverage: Coverage): BulletinComparison | null {
  if (!previous) return null;
  const comparable = comparableTo(previous, coverage);
  const verdict = conclusion(previous.coverage.criteriaTotal);
  return {
    previousComputedAt: previous.coverage.computedAt,
    previousCoveredDeclared: previous.coverage.coveredDeclared,
    previousProven: previous.coverage.proven,
    coveredDeclaredDelta: coverage.coveredDeclared - previous.coverage.coveredDeclared,
    provenDelta: coverage.proven - previous.coverage.proven,
    conclusion: comparable ? verdict : 'not-comparable',
    comparable,
  };
}

/** Les messages du bulletin : ce qu'il faut savoir avant de lire les chiffres. */
function bulletinMessages(lang: Lang, coverage: CoverageView): string[] {
  const messages = [t(lang, 'msg.dated-scope')];
  if (coverage.noCriterionWritten) messages.push(t(lang, 'msg.no-criterion-written'));
  if (coverage.conclusion === 'not-enough-history') messages.push(t(lang, 'msg.not-enough-history'));
  return messages;
}

/** Bâtit le bulletin. */
export function buildBulletinView(input: BulletinInput): WeaveBulletin {
  const lang = input.language;
  const coverage = coverageView(lang, input.coverage);
  const written = input.coverage.criteriaTotal + input.coverage.unfalsifiableCount;
  const byStrength = coverage.byStrength;
  const byFreshness = coverage.byFreshness;
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    coverage,
    byStrength,
    byFreshness,
    perforations: figure(text(lang, 'perforations'), input.perforations, written),
    dangling: figure(text(lang, 'dangling'), input.dangling, input.coverage.criteriaTotal),
    unfalsifiable: figure(text(lang, 'unfalsifiable'), input.coverage.unfalsifiableCount, written),
    added: figure(text(lang, 'added'), input.addedDuringSprint, written),
    topHoles: input.holes.map((hole) => holeLine(lang, hole)),
    comparison: compareTo(input.previous ?? null, input.coverage),
    messages: bulletinMessages(lang, coverage),
  };
}
