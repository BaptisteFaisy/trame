/**
 * Le bulletin de trame (§12.4).
 *
 * C'est ce que lit une revue de sprint ou une release : la couverture (avec ses
 * trois axes, jamais fusionnés), le nombre de perforations et de fils détendus,
 * la part de critères infalsifiables, la part de critères ajoutés pendant le
 * sprint, et la liste des trous prioritaires. Daté, et comparable au témoin
 * précédent (§24.13).
 *
 * Le bulletin **ne recalcule rien** : il assemble la couverture produite par
 * `coverage.ts` et les compteurs qu'on lui donne. C'est le seul endroit où un
 * pourcentage apparaît — et il porte toujours son effectif (§22).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Bulletin, Coverage, Criterion, Hole, ScopeType, Witness } from '../types.js';
import { percent } from './percent.js';

/** Combien de trous prioritaires le bulletin affiche (§12.4). */
export const TOP_HOLES_LIMIT = 10;

/** Ce qu'il faut pour bâtir un bulletin. */
export interface BulletinInput {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  /** La trame calculée par `computeCoverage` — axes inclus. */
  coverage: Coverage;
  /** Le témoin précédent, pour comparer deux sprints (§4, §24.13). */
  previous?: Witness | null;
  /** Perforations du périmètre ; défaut : celles de la couverture. */
  perforations?: number;
  /** Fils détendus du périmètre ; défaut : ceux de la couverture. */
  dangling?: number;
  /** Critères écrits pendant le sprint : le dénominateur est la trame entière. */
  criteriaAddedDuringSprint?: readonly Criterion[];
  /** Les trous, tels que le métré les a produits (§11). */
  holes?: readonly Hole[];
}

/**
 * Bâtit le bulletin : une trame datée, comparable au témoin précédent.
 * Aucune part n'est calculée sur un périmètre vide : un périmètre sans critère
 * écrit affiche ses mots à lui, pas « 0 % » (`hasNoCriterion`, §24.16).
 */
export function buildBulletin(input: BulletinInput): Bulletin {
  const coverage = input.coverage;
  const written = coverage.criteriaTotal + coverage.unfalsifiableCount;
  const bulletin: Bulletin = {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    coverage,
    perforations: input.perforations ?? coverage.perforations,
    dangling: input.dangling ?? coverage.dangling,
    unfalsifiableShare: percent(coverage.unfalsifiableCount, written),
    addedDuringSprint: percent(input.criteriaAddedDuringSprint?.length ?? 0, written),
    topHoles: topHoles(input.holes ?? [], TOP_HOLES_LIMIT),
  };
  if (input.previous) bulletin.previous = input.previous;
  return bulletin;
}

/**
 * Les trous prioritaires, du plus prioritaire au moins prioritaire (§11).
 * Le tri est stable : deux trous de même score gardent l'ordre du ticket.
 */
export function topHoles(holes: readonly Hole[], limit: number = TOP_HOLES_LIMIT): Hole[] {
  return [...holes]
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, Math.max(0, limit));
}
