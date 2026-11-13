/**
 * Écran : la file des fils détendus (§12.3). Les actes qui ne couvrent plus
 * rien, avec la raison et l'impact sur la couverture.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import { scopeFrom, languageFrom, loadScope } from './screen';
import { computeCoverage } from '../domain/coverage';
import { detectDangling } from '../domain/dangling';
import { detectPerforations } from '../domain/perforations';
import { buildDangling } from '../viewmodel/dangling';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload);
  const language = languageFrom(payload);
  if (!scope) return { scope: payload['scope'] ?? '', scopeType: payload['scopeType'] ?? 'project', language, message: 'no-criterion-written' };
  const now = deps.clock.now();
  const data = await loadScope(deps, scope);
  if (data.criteria.length === 0) return { scope: scope.scope, scopeType: scope.scopeType, language, message: 'no-criterion-written' };
  const dangling = detectDangling({ ...data, now });
  const perforations = detectPerforations({ ...data, now });
  const coverage = computeCoverage({ criteria: data.criteria, verifications: data.verifications, links: data.links, perforations, dangling, scope: scope.scope, scopeType: scope.scopeType, computedAt: now });
  return buildDangling({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: now, dangling, coverage, verificationCount: data.verifications.length, total: dangling.length });
}