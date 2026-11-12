import type { Deps } from '../ports.js';

/** Zones à risque : les entrées observables du métré (§11).
 *
 * Défauts passés, incidents ouverts, dernier défaut — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'zone-risks' };
}
