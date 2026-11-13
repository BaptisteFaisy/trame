/**
 * Écran : ce que l'app voit, ce qu'elle ne voit pas (§18, §22). Les quatre
 * absences distinguées — un angle mort n'est jamais un trou du projet.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import { scopeFrom, languageFrom } from './screen';
import { GRAPH_OBJECT_TYPES } from '../ports';
import { buildVisibility } from '../viewmodel/visibility';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload) ?? { scopeType: 'project' as const, scope: String(payload['scope'] ?? 'TRAME') };
  const language = languageFrom(payload);
  const probes = [] as Awaited<ReturnType<Deps['graph']['probe']>>[];
  for (const objectType of GRAPH_OBJECT_TYPES) probes.push(await deps.graph.probe(objectType));
  return buildVisibility({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: deps.clock.now(), probes });
}