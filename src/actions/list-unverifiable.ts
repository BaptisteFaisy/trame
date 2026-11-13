import type { ActorContext, Deps } from '../ports';
import type { Criterion } from '../types';
import { proposeReformulation } from '../domain/reformulation';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
} from './common';

/** Un critère infalsifiable, avec la reformulation proposée (§8.4, §24.10). */
function line(criterion: Criterion): Record<string, unknown> {
  const reason = criterion.unfalsifiableReason ?? 'aucune raison notée';
  const reformulation = proposeReformulation(criterion.text, reason);
  return {
    id: criterion.id,
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    text: criterion.text,
    origin: criterion.origin,
    reason,
    proposedReformulation: { after: reformulation.after, measure: reformulation.measure },
  };
}

/**
 * Critères infalsifiables et reformulations proposées (§8.4).
 *
 * Un critère infalsifiable (« l'application doit être rapide ») ne compte
 * **ni comme trou ni comme couverture** : il est compté à part. La réponse
 * propose une reformulation vérifiable, avec la mesure qui la rend
 * tranchable — elle ne l'applique pas : la proposition attend une décision
 * humaine (`propose-reformulation`, §12.6).
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
  const unfalsifiable = data.criteria.filter((criterion) => !criterion.falsifiable);
  return {
    ...envelope(read.request, coverage.computedAt),
    criteria: unfalsifiable.map(line),
    count: unfalsifiable.length,
    total: data.criteria.length,
    figures,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.not-applied']),
  };
}
