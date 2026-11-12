import type { ActorContext, Deps } from '../ports.js';
import type { Criterion, Perforation } from '../types.js';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
  readText,
  refusal,
} from './common.js';
import type { Refusal } from './common.js';

/** L'âge minimal demandé, en jours. */
type AgeRead = { ok: true; days: number | null } | { ok: false; refusal: Refusal };

/** L'âge demandé : un nombre de jours, ou rien. */
function readAge(value: unknown): AgeRead {
  if (value === undefined || value === null || value === '') return { ok: true, days: null };
  const parsed = typeof value === 'number' ? value : Number.parseFloat(readText(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return {
      ok: false,
      refusal: refusal('âge illisible', 'age est un nombre de jours (0 ou plus)'),
    };
  }
  return { ok: true, days: parsed };
}

/** Le critère perforé, cité avec sa source (§16). */
function criterionOf(
  perforation: Perforation,
  criteria: readonly Criterion[],
): Criterion | undefined {
  return criteria.find((row) => row.id === perforation.criterionId);
}

/** Une perforation : les deux dates et son classement (§8.2, §24.4). */
function perforationLine(
  perforation: Perforation,
  criteria: readonly Criterion[],
): Record<string, unknown> {
  const criterion = criterionOf(perforation, criteria);
  const line: Record<string, unknown> = {
    id: perforation.id,
    ticketKey: perforation.ticketKey,
    criterionKey: perforation.criterionKey,
    verificationId: perforation.verificationId,
    criterionVersionNo: perforation.criterionVersionNo,
    changedAt: perforation.changedAt,
    verifiedAt: perforation.verifiedAt,
    ageDays: perforation.ageDays,
    klass: perforation.klass,
    state: perforation.state,
  };
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
 * Critères modifiés après leur vérification, dates et écart (§16).
 *
 * Une perforation est une maille qui ne tient plus : le critère a changé
 * **après** la vérification qui le couvrait. La réponse porte toujours les
 * deux dates — celle du changement et celle de la vérification — et le
 * classement du graffiti (§8.2).
 *
 * Entrées : scope, age? — lot L8.
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
  const age = readAge(payload.age);
  if (!age.ok) return age.refusal;
  const data = await loadScope(deps, read.request);
  const coverage = await coverageOf(deps, data);
  const figures = figuresOf(coverage);
  const days = age.days;
  const kept =
    days === null
      ? data.perforations
      : data.perforations.filter((row) => row.ageDays >= days);
  return {
    ...envelope(read.request, coverage.computedAt),
    perforations: kept.map((row) => perforationLine(row, data.criteria)),
    count: kept.length,
    total: data.perforations.length,
    minimumAgeDays: days,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.dated-scope']),
  };
}
