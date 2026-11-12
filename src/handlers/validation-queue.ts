import type { Deps } from '../ports.js';

/** File de validation : liaisons dérivées, tests et reformulations (§12.6).
 *
 * Rien n'est appliqué sans un acte humain tracé (§9.4) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'validation-queue' };
}
