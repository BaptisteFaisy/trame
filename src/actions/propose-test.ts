import type { ActorContext, Deps } from '../ports.js';

/** Brouillon de cas de test proposé pour un trou, jamais appliqué (§12.6).
 *
 * Entrées : ticketKey, criterionId — lot L8.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function run(
  _deps: Deps,
  _payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  return { notImplemented: 'propose-test' };
}
