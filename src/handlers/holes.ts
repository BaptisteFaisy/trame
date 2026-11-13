/**
 * Écran : l'explorateur des trous (§12.1, §11). Trié par le métré, le calcul
 * de chaque score affiché.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import { scopeFrom, languageFrom } from './screen';
import { buildHoles } from '../viewmodel/holes';
import { computeCoverage } from '../domain/coverage';
import { detectDangling } from '../domain/dangling';
import { detectPerforations } from '../domain/perforations';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload);
  const language = languageFrom(payload);
  if (!scope) return { scope: payload['scope'] ?? '', scopeType: payload['scopeType'] ?? 'project', language, message: 'no-criterion-written' };
  const now = deps.clock.now();
  const criteria = await deps.store.listCriteria(scope);
  if (criteria.length === 0) return { scope: scope.scope, scopeType: scope.scopeType, language, message: 'no-criterion-written' };
  const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
  const verifications = await deps.store.listVerifications(scope);
  const versions = (await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))).flat();
  const perforations = detectPerforations({ criteria, versions, links, verifications, now });
  const dangling = detectDangling({ verifications, links, criteria, now });
  const coverage = computeCoverage({ criteria, verifications, links, perforations, dangling, scope: scope.scope, scopeType: scope.scopeType, computedAt: now });
  const limit = Number(payload['limit'] ?? 50);
  const holes = await deps.store.listHoles(scope, limit);
  return buildHoles({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: now, holes, coverage, total: holes.length });
}