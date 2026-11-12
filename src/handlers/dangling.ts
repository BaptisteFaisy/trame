import type { Deps } from '../ports.js';

/** File des fils détendus : raison et impact chiffré sur la couverture (§12.3).
 *
 * La couverture affichée baisse quand un test meurt (§8.3) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'dangling' };
}
