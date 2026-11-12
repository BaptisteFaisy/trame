import type { ActorContext, Deps } from '../ports.js';

/** Bulletin de trame daté, comparable au témoin précédent (§12.4).
 *
 * Entrées : scope — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'get-bulletin' };
}
