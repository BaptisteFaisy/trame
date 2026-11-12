import type { ActorContext, Deps } from '../ports.js';

/** Critères modifiés après leur vérification, dates et écart (§16).
 *
 * Entrées : scope, age? — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'list-perforations' };
}
