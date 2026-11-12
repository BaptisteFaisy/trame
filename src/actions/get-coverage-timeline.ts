import type { ActorContext, Deps } from '../ports.js';

/** Historique de la couverture, témoin par témoin (§12.4).
 *
 * Entrées : scope, periods? — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'get-coverage-timeline' };
}
