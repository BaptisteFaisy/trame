/**
 * Écran : le registre des perforations (§12.2). Un critère modifié après sa
 * vérification, avec les deux dates et l'écart.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import { scopeFrom, languageFrom, loadScope } from './screen.js';
import { computeCoverage } from '../domain/coverage.js';
import { detectDangling } from '../domain/dangling.js';
import { detectPerforations } from '../domain/perforations.js';
import { buildPerforations } from '../viewmodel/perforations.js';

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
  return buildPerforations({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: now, perforations, coverage, total: perforations.length });
}