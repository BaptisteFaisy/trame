import type { ActorContext, Deps } from '../ports.js';

/** Actes de vérification qui ne couvrent plus rien, avec la raison (§16).
 *
 * Entrées : scope — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'list-dangling' };
}
