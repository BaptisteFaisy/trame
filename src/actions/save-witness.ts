import type { ActorContext, Deps } from '../ports.js';

/** Action interne : conserve l'état daté d'une trame (§4, §12.4).
 *
 * Entrées : scope, period — lot L10.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'save-witness' };
}
