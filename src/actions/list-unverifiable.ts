import type { ActorContext, Deps } from '../ports.js';

/** Critères infalsifiables et reformulations proposées (§8.4).
 *
 * Entrées : scope — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'list-unverifiable' };
}
