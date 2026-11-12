import type { ActorContext, Deps } from '../ports.js';

/** Action interne : les poids du métré d'une équipe, une décision (§11).
 *
 * Entrées : scope, weights — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'set-metric-rule' };
}
