/**
 * Écran : l'historique de trame (§17). Les témoins successifs d'un périmètre.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type { Witness } from '../types.js';
import { scopeFrom, languageFrom } from './screen.js';
import { buildTimeline } from '../viewmodel/timeline.js';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload) ?? { scopeType: 'project' as const, scope: String(payload['scope'] ?? 'TRAME') };
  const language = languageFrom(payload);
  const limit = Number(payload['limit'] ?? 20);
  const coverages = await deps.store.listCoverageTimeline(scope.scope, scope.scopeType, limit);
  const witnesses: Witness[] = coverages.map((coverage, index) => ({
    id: `${scope.scope}_${index}`,
    scope: scope.scope,
    scopeType: scope.scopeType,
    period: scope.scope,
    coverage,
    computedAt: coverage.computedAt,
  }));
  return buildTimeline({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: deps.clock.now(), witnesses });
}