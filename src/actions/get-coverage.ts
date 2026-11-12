import type { ActorContext, Deps } from '../ports.js';

/** Couverture par force, par liaison et par fraîcheur, avec effectifs (§16).
 *
 * Entrées : scope (ticket/sprint/projet/version), mode? — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'get-coverage' };
}
