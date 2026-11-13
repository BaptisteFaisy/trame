import type { ActorContext, Deps } from '../ports';
import type { Coverage } from '../types';
import { coverageTimeline } from '../domain/timeline';
import {
  blindSpotsOf,
  envelope,
  readLimit,
  readPersonFilter,
  readScope,
  say,
} from './common';

/** Une mesure datée de l'historique : les effectifs, jamais un pourcentage seul. */
function periodLine(coverage: Coverage): Record<string, unknown> {
  return {
    computedAt: coverage.computedAt,
    criteriaTotal: coverage.criteriaTotal,
    unfalsifiableCount: coverage.unfalsifiableCount,
    coveredDeclared: coverage.coveredDeclared,
    coveredProvisional: coverage.coveredProvisional,
    proven: coverage.proven,
    holes: coverage.holes,
    dangling: coverage.dangling,
    perforations: coverage.perforations,
    byStrength: coverage.byStrength,
    byLink: coverage.byLink,
    byFreshness: coverage.byFreshness,
  };
}

/**
 * Historique de la couverture, témoin par témoin (§16).
 *
 * Le journal des mesures est relu **du plus récent au plus ancien** : une
 * courbe qui ne descendrait jamais serait une courbe truquée. Une couverture
 * peut baisser — quand un acte de vérification meurt (§8.3) ; c'est
 * exactement ce que l'historique montre.
 *
 * Deux mesures ne sont comparables que si leurs périmètres coïncident : la
 * réponse porte le périmètre de chaque mesure (§22).
 *
 * Entrées : scope, periods? — lot L8.
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
  const periods = readLimit(payload.periods, 12, 100);
  const rows = await coverageTimeline(deps, read.request.scope, read.request.scopeType, periods);
  const now = deps.clock.now();
  return {
    ...envelope(read.request, now),
    periods: rows.map(periodLine),
    count: rows.length,
    requestedPeriods: periods,
    blindSpots: await blindSpotsOf(deps),
    messages: [say(deps, 'msg.dated-scope')],
  };
}
