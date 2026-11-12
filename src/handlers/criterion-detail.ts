import type { Deps } from '../ports.js';

/** Fiche critère sur le ticket : couverture, forces, perforations (§17).
 *
 * Réponse en moins de 2 s depuis le cache (§22) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'criterion-detail' };
}
