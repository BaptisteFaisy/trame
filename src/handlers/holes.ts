import type { Deps } from '../ports.js';

/** Explorateur des trous, classés par le métré, calcul affiché (§17).
 *
 * Chaque trou montre les termes qui l'ont classé (§22) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'holes' };
}
