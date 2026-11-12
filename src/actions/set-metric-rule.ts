import type { ActorContext, Deps } from '../ports.js';
import type { CriterionKind, MetricRule } from '../types.js';
import { DEFAULT_SETTINGS } from '../defaults.js';
import { readPersonFilter, readScope, refusal } from './common.js';
import type { Refusal } from './common.js';

/** Les sept types de critère : les poids que l'équipe peut choisir (§11). */
const KINDS: readonly CriterionKind[] = [
  'security',
  'non-regression',
  'edge-case',
  'functional',
  'performance',
  'experience',
  'documentation',
];

/** Les poids lus : une décision d'équipe, ou un refus s'ils sont illisibles. */
type WeightsRead = { ok: true; weights: MetricRule['weights'] } | { ok: false; refusal: Refusal };

/** Un poids valide : fini et positif ou nul ; sinon `null`. */
function weightOf(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Les poids que l'équipe choisit, fondus sur ceux déjà en place.
 *
 * Un poids manquant garde sa valeur actuelle : l'app n'invente pas un poids
 * que l'équipe n'a pas choisi (§11). Un poids refusé interrompt la lecture —
 * un métré avec un poids absurde ne serait pas explicable (§22).
 */
function readWeights(payload: Record<string, unknown>, base: MetricRule['weights']): WeightsRead {
  const raw = payload.weights;
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, refusal: refusal('poids manquants', 'weights est un objet { kind, zoneRisk, recurrence }') };
  }
  const over = raw as Record<string, unknown>;
  const kind = { ...base.kind };
  if (typeof over.kind === 'object' && over.kind !== null) {
    for (const key of KINDS) {
      const value = (over.kind as Record<string, unknown>)[key];
      if (value === undefined) continue;
      const parsed = weightOf(value);
      if (parsed === null) {
        return { ok: false, refusal: refusal('poids illisible', `kind.${key} doit être un nombre positif ou nul`) };
      }
      kind[key] = parsed;
    }
  }
  const zoneRisk =
    over.zoneRisk === undefined ? base.zoneRisk : weightOf(over.zoneRisk);
  const recurrence =
    over.recurrence === undefined ? base.recurrence : weightOf(over.recurrence);
  if (zoneRisk === null || recurrence === null) {
    return { ok: false, refusal: refusal('poids illisible', 'zoneRisk et recurrence sont des nombres positifs ou nuls') };
  }
  return { ok: true, weights: { kind, zoneRisk, recurrence } };
}

/**
 * Action interne : les poids du métré d'une équipe, une décision (§11).
 *
 * Les poids ne sont pas une vérité, ils sont un choix : l'équipe les pose, et
 * le classement des trous suit ces poids — chaque trou affiche ses termes,
 * donc le calcul reste explicable (§22).
 *
 * Entrées : scope, weights — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = readScope(payload);
  if (!read.ok) return read.refusal;
  const current = await deps.store.getMetricRule(read.request.scope);
  const base = current?.weights ?? DEFAULT_SETTINGS.metricWeights;
  const weights = readWeights(payload, base);
  if (!weights.ok) return weights.refusal;
  const rule: MetricRule = {
    id: deps.ids.next('rule'),
    scope: read.request.scope,
    weights: weights.weights,
    updatedAt: deps.clock.now(),
    updatedByRef: actor.accountId,
  };
  await deps.store.putMetricRule(rule);
  return {
    scope: read.request.scope,
    scopeType: read.request.scopeType,
    computedAt: rule.updatedAt,
    weights: rule.weights,
    message: 'poids du métré enregistrés : une décision d’équipe, pas une vérité (§11)',
  };
}