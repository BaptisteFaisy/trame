/**
 * Écran : la file de validation (§12.6). Les liaisons dérivées à confirmer, les
 * tests proposés, les reformulations proposées — rien n'est appliqué.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import { scopeFrom, languageFrom } from './screen.js';
import { buildValidationQueue } from '../viewmodel/validation-queue.js';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload) ?? { scopeType: 'project' as const, scope: String(payload['scope'] ?? 'TRAME') };
  const language = languageFrom(payload);
  const now = deps.clock.now();
  const criteria = await deps.store.listCriteria(scope);
  const derivedLinks = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat()
    .filter((link) => link.kind === 'derived' && !link.rejectedAt && link.confidence >= 0.5)
    .sort((left, right) => right.confidence - left.confidence);
  const proposals = await deps.store.listProposals('open');
  return buildValidationQueue({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: now, derivedLinks, proposals });
}