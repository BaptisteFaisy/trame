import type { ActorContext, Deps } from '../ports';
import type { Dangling } from '../types';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
} from './common';

/** Un fil détendu : l'acte mort, la raison, et ce qu'il retire (§8.3). */
function danglingLine(thread: Dangling): Record<string, unknown> {
  return {
    id: thread.id,
    verificationId: thread.verificationId,
    verificationName: thread.verificationName,
    reason: thread.reason,
    impact: thread.impact,
    detectedAt: thread.detectedAt,
    state: thread.state,
  };
}

/**
 * Actes de vérification qui ne couvrent plus rien, avec la raison (§16).
 *
 * Un fil détendu donne un confort vide : la maille existe encore dans les
 * données, mais elle ne prouve plus rien. Ces fils sont **retirés de la
 * couverture** (§8.3) : c'est ce qui rend la mesure honnête, une couverture
 * peut baisser.
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
  const removed = data.dangling.reduce((sum, thread) => sum + thread.impact, 0);
  return {
    ...envelope(read.request, coverage.computedAt),
    dangling: data.dangling.map(danglingLine),
    count: data.dangling.length,
    /** Le nombre de mailles retirées : c'est ce qui fait baisser la couverture. */
    coverageRemoved: removed,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, removed > 0 ? ['msg.coverage-lowered'] : []),
  };
}
