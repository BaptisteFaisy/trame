import type { ActorContext, Deps } from '../ports.js';

/** Zones à risque et défauts passés, entrées du métré (§11).
 *
 * Entrées : scope — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'get-zones-risk' };
}
