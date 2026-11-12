import type { ActorContext, Deps } from '../ports.js';

/** Liaison refusée : la suggestion suivante du même type s'affaiblit (§9.4).
 *
 * Entrées : criterionId, verificationRef, reason — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'reject-link' };
}
