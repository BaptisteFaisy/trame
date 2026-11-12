import type { Deps, RecomputeMessage } from '../ports.js';

/**
 * Consumer `trame-recompute` (§18) : jusqu'à 900 s, par tranches avec curseur.
 *
 * Souche : le lot L10 y déroulera une tranche (mode `criteria`,
 * `verifications`, `links` ou `measures`), enregistrera le curseur, et
 * republiera le message tant qu'il reste du périmètre — un projet de 50 000
 * tickets ne se recalcule pas en une fonction (§21).
 */
export async function onRecomputeMessage(message: RecomputeMessage, deps: Deps): Promise<void> {
  deps.log.log('info', 'consumer : tranche de recalcul', {
    scope: message.scope,
    mode: message.mode,
  });
}
