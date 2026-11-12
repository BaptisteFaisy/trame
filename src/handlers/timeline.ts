import type { Deps } from '../ports.js';

/** Historique de trame : les témoins successifs d'un périmètre (§17).
 *
 * Une époque qui change de pratique n'est pas comparable (§20) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'timeline' };
}
