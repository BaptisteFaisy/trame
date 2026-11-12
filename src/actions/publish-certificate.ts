import type { ActorContext, Deps } from '../ports.js';

/** Action interne : génère la page Confluence du certificat (§12.5).
 *
 * Entrées : scope, spaceKey — lot L10.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'publish-certificate' };
}
