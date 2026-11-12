import type { Deps } from '../ports.js';

/** Carte de trame : fils de chaîne, passages de trame, mailles (§17).
 *
 * Un trou laisse voir le fond, sa taille suit la priorité du métré — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'weave-map' };
}
