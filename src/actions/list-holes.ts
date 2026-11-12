import type { ActorContext, Deps } from '../ports.js';

/** Trous classés par le métré, avec le critère et la zone (§16).
 *
 * Entrées : scope, priority?, limit — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'list-holes' };
}
