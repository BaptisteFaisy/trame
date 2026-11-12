import type { Deps } from '../ports.js';

/** Bulletin de trame daté, posé à côté de son témoin (§12.4).
 *
 * Deux chiffres ne sont comparés que si périmètres et époques coïncident — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'bulletin' };
}
