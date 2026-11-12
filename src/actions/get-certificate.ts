import type { ActorContext, Deps } from '../ports.js';

/** Contenu du certificat de trame, destiné à Confluence (§12.5).
 *
 * Entrées : scope — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'get-certificate' };
}
