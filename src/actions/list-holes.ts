import type { ActorContext, Deps } from '../ports.js';
import type { Criterion, Hole } from '../types.js';
import { findHoles } from '../domain/holes.js';
import { explainScore } from '../domain/metric.js';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readLimit,
  readPersonFilter,
  readScope,
  readText,
  refusal,
} from './common.js';
import type { Refusal } from './common.js';

/** Le seuil de priorité demandé : un score, ou rien. */
type PriorityRead = { ok: true; minimum: number } | { ok: false; refusal: Refusal };

/**
 * Le seuil de priorité : un nombre entre 0 et 1.
 *
 * Un filtre textuel (« high », « urgent ») serait une gradation inventée par
 * l'app : le seul seuil honnête est le score du métré, que le lecteur peut
 * recalculer (§11, §22).
 */
function readPriority(value: unknown): PriorityRead {
  if (value === undefined || value === null || value === '') return { ok: true, minimum: 0 };
  const parsed = typeof value === 'number' ? value : Number.parseFloat(readText(value));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return {
      ok: false,
      refusal: refusal(
        'priorité illisible',
        'priority est un score entre 0 et 1 — le score du trou, pas une gradation inventée',
      ),
    };
  }
  return { ok: true, minimum: parsed };
}

/** Le critère du trou, cité avec sa source (§16). */
function criterionOf(hole: Hole, criteria: readonly Criterion[]): Criterion | undefined {
  return criteria.find((row) => row.id === hole.criterionId);
}

/** Un trou, avec son calcul affiché (§24.11). */
function holeLine(hole: Hole, criteria: readonly Criterion[]): Record<string, unknown> {
  const criterion = criterionOf(hole, criteria);
  const line: Record<string, unknown> = {
    id: hole.id,
    ticketKey: hole.ticketKey,
    criterionKey: hole.criterionKey,
    kind: hole.kind,
    priorityScore: hole.priorityScore,
    priorityTerms: hole.priorityTerms,
    priorityExplanation: explainScore(hole.priorityTerms),
    state: hole.state,
  };
  if (hole.zone) line.zone = hole.zone;
  if (criterion) {
    line.criterion = {
      text: criterion.text,
      origin: criterion.origin,
      textHash: criterion.textHash,
      version: criterion.version,
    };
  }
  return line;
}

/**
 * Trous classés par le métré, avec le critère et la zone (§16).
 *
 * Un trou est un **critère vérifiable sans maille vivante** : le classement
 * vient du métré, et chaque trou affiche le calcul qui l'a classé (§24.11).
 * Un critère infalsifiable n'est jamais un trou (§8.4) : il est compté à part
 * par `list-unverifiable`.
 *
 * Entrées : scope, priority?, limit — lot L8.
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
  const priority = readPriority(payload.priority);
  if (!priority.ok) return priority.refusal;
  const data = await loadScope(deps, read.request);
  const coverage = await coverageOf(deps, data);
  const figures = figuresOf(coverage);
  const holes = findHoles({
    criteria: data.criteria,
    links: data.links,
    verifications: data.verifications,
    dangling: data.dangling,
    zoneRisks: data.zoneRisks,
    recurrenceByCriterion: {},
    rule: data.rule ?? undefined,
    scope: read.request.scope,
  });
  const limit = readLimit(payload.limit, 20, 100);
  const kept = holes
    .filter((hole) => hole.priorityScore >= priority.minimum)
    .slice(0, limit);
  return {
    ...envelope(read.request, coverage.computedAt),
    holes: kept.map((hole) => holeLine(hole, data.criteria)),
    count: kept.length,
    total: holes.length,
    limit,
    minimumPriority: priority.minimum,
    figures,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.hole-priority']),
  };
}
