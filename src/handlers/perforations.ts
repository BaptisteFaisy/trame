import type { Deps } from '../ports.js';

/** Registre des perforations : critère, version, deux dates, écart (§12.2).
 *
 * Classement fraîche / sèche / multiple (§8.2) — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'perforations' };
}
