import type { ActorContext, Deps } from '../ports.js';
import type { MetricRule, ZoneRisk } from '../types.js';
import { scoreHole } from '../domain/metric.js';
import { DEFAULT_SETTINGS } from '../defaults.js';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
} from './common.js';

/**
 * Une zone à risque, avec le terme de métré qu'elle produit (§11).
 *
 * Le terme est calculé par `metric.ts` — l'app ne réécrit pas l'explication :
 * elle dit la même chose que le trou qui portera cette zone.
 */
function zoneLine(risk: ZoneRisk, weights: MetricRule['weights']): Record<string, unknown> {
  const scored = scoreHole({ kind: 'functional', zoneRisk: risk, recurrence: 0, weights });
  const term = scored.terms[1];
  return {
    zone: risk.zone,
    defectCount: risk.defectCount,
    openIncidentCount: risk.openIncidentCount,
    lastDefectAt: risk.lastDefectAt,
    score: risk.score,
    computedAt: risk.computedAt,
    metricTerm: { name: term.name, weight: term.weight, value: term.value, because: term.because },
  };
}

/**
 * Zones à risque et défauts passés, entrées du métré (§11).
 *
 * Le risque d'une zone est **observé** : combien de défauts elle a produits,
 * quand, et combien d'incidents restent ouverts. Le score est normalisé dans
 * [0, 1] et la zone sert de terme au trou qui s'y trouve : le classement
 * remonte ce que la zone a déjà cassé (§24.12).
 *
 * Les zones sans antécédent n'apparaissent pas : pas de ligne, pas de score
 * deviné (§22).
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
  const weights = data.rule?.weights ?? DEFAULT_SETTINGS.metricWeights;
  return {
    ...envelope(read.request, coverage.computedAt),
    zones: data.zoneRisks.map((risk) => zoneLine(risk, weights)),
    count: data.zoneRisks.length,
    /** Le poids que l'équipe donne à la zone : une décision, pas une vérité. */
    zoneRiskWeight: weights.zoneRisk,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.dated-scope']),
  };
}
