import type { ActorContext, Deps } from '../ports.js';

/** Retricotage : une liaison dérivée confirmée devient déclarée (§9.4).
 *
 * Entrées : criterionId, verificationRef, kind — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'confirm-link' };
}
