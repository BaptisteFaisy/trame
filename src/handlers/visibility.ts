import type { Deps } from '../ports.js';

/** Écran de couverture : ce que l'app voit, ce qu'elle ne voit pas (§17).
 *
 * Pas de droit != pas de données != pas de test != pas de critère (§22) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'visibility' };
}
