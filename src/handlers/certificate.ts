import type { Deps } from '../ports.js';

/** Certificat de trame : ce qui est vérifié, et ce qui ne l'est pas (§12.5).
 *
 * Page opposable, générée dans Confluence — lot L9.
 * Souche : signature gelée (docs/CONTRACTS.md §3), corps à écrire.
 */
export async function render(
  _deps: Deps,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  return { notImplemented: 'certificate' };
}
