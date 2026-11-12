import type { ActorContext, Deps } from '../ports.js';

/** Action interne : met en file un recalcul par tranches (consumer, 900 s, §18).
 *
 * Entrées : scope, scopeType, mode — lot L10.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'recompute' };
}
