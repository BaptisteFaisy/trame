import type { ActorContext, Deps } from '../ports';
import type { Coverage, Criterion, Hole, Witness } from '../types';
import { buildBulletin } from '../domain/bulletin';
import { findHoles } from '../domain/holes';
import { conclusion, percent } from '../domain/percent';
import { comparableTo, previousWitness } from '../domain/witness';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
} from './common';

/** La comparaison avec le témoin précédent : deux chiffres, même périmètre. */
interface Comparison {
  previousComputedAt: string;
  previousCoveredDeclared: number;
  previousProven: number;
  coveredDeclaredDelta: number;
  provenDelta: number;
  /** `not-enough-history` : sous l'effectif minimal, l'app refuse de conclure. */
  conclusion: string;
  comparable: boolean;
}

/**
 * Compare le bulletin courant au témoin précédent.
 *
 * Deux chiffres ne se comparent que si leurs périmètres **et** leurs époques
 * coïncident (§22) : sinon la comparaison est refusée, elle n'est pas
 * approximée.
 */
function compareTo(previous: Witness | null, coverage: Coverage): Comparison | null {
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

/** Les critères écrits depuis le témoin précédent : ce que le sprint a ajouté. */
function addedSince(previous: Witness | null, criteria: readonly Criterion[]): Criterion[] {
  if (!previous) return [];
  const since = previous.coverage.computedAt;
  return criteria.filter((criterion) => criterion.createdAt > since);
}

/** Les trous prioritaires du périmètre, classés par le métré (§11). */
function holesOf(
  criteria: readonly Criterion[],
  links: Parameters<typeof findHoles>[0]['links'],
  verifications: Parameters<typeof findHoles>[0]['verifications'],
  dangling: Parameters<typeof findHoles>[0]['dangling'],
  zoneRisks: Parameters<typeof findHoles>[0]['zoneRisks'],
  scope: string,
): Hole[] {
  return findHoles({
    criteria,
    links,
    verifications,
    dangling,
    zoneRisks,
    recurrenceByCriterion: {},
    scope,
  });
}

/**
 * Bulletin de trame daté, comparable au témoin précédent (§12.4).
 *
 * C'est ce que lit une revue de sprint : la couverture avec ses trois axes
 * (jamais fusionnés), les perforations, les fils détendus, la part de
 * critères infalsifiables, les trous prioritaires — et la comparaison au
 * témoin du sprint précédent, refusée si les périmètres ne coïncident pas
 * (§24.13).
 *
 * Entrées : scope — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = readScope(payload);
  if (!read.ok) return read.refusal;
  const data = await loadScope(deps, read.request);
  const coverage = await coverageOf(deps, data);
  const figures = figuresOf(coverage);
  const previous = await previousWitness(deps, read.request.scope, read.request.scopeType);
  const holes = holesOf(
    data.criteria,
    data.links,
    data.verifications,
    data.dangling,
    data.zoneRisks,
    read.request.scope,
  );
  const bulletin = buildBulletin({
    scope: read.request.scope,
    scopeType: read.request.scopeType,
    computedAt: coverage.computedAt,
    coverage,
    previous,
    perforations: data.perforations.length,
    dangling: data.dangling.length,
    criteriaAddedDuringSprint: addedSince(previous, data.criteria),
    holes,
  });
  return {
    ...envelope(read.request, coverage.computedAt),
    bulletin,
    figures: {
      ...figures,
      perforations: percent(data.perforations.length, data.criteria.length),
      dangling: percent(data.dangling.length, data.verifications.length),
    },
    comparison: compareTo(previous, coverage),
    previousWitnessAt: previous?.coverage.computedAt ?? null,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.dated-scope']),
  };
}
