/**
 * Écran : le bulletin de trame (§12.4). Chargé par le resolver, il lit le
 * périmètre, le témoin précédent et les registres, puis rend le vue-modèle.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import { scopeFrom, languageFrom, loadScope } from './screen';
import { computeCoverage } from '../domain/coverage';
import { detectDangling } from '../domain/dangling';
import { detectPerforations } from '../domain/perforations';
import { previousWitness } from '../domain/witness';
import { buildBulletinView } from '../viewmodel/bulletin';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload);
  const language = languageFrom(payload);
  if (!scope) return { scope: payload['scope'] ?? '', scopeType: payload['scopeType'] ?? 'project', language, message: 'no-criterion-written' };
  const now = deps.clock.now();
  const data = await loadScope(deps, scope);
  if (data.criteria.length === 0) return { scope: scope.scope, scopeType: scope.scopeType, language, message: 'no-criterion-written' };
  const perforations = detectPerforations({ ...data, now });
  const dangling = detectDangling({ ...data, now });
  const coverage = computeCoverage({ criteria: data.criteria, verifications: data.verifications, links: data.links, perforations, dangling, scope: scope.scope, scopeType: scope.scopeType, computedAt: now });
  const previous = await previousWitness(deps, scope.scope, scope.scopeType);
  const holes = await deps.store.listHoles(scope, 10);
  return buildBulletinView({
    language,
    scope: scope.scope,
    scopeType: scope.scopeType,
    computedAt: now,
    coverage,
    previous,
    perforations: perforations.length,
    dangling: dangling.length,
    addedDuringSprint: data.criteria.filter((criterion) => criterion.createdAt > (previous?.computedAt ?? '1970-01-01T00:00:00.000Z')).length,
    holes,
  });
}