/**
 * Screen handler of the weave map (§17) : loads the scope, computes what the
 * registries know, and returns the view-model that the UI renders.
 *
 * Forge passes `payload` with the scope and the language; without a scope, the
 * screen shows the first known scope of the app — never an invented one.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type { Deps } from '../ports.js';
import type { ScopeRef } from '../types.js';
import { detectDangling } from '../domain/dangling.js';
import { detectPerforations } from '../domain/perforations.js';
import { findHoles } from '../domain/holes.js';
import { buildWeaveMap } from '../viewmodel/weave-map.js';
import { pickLang } from '../i18n/index.js';

/** Reads a scope from the payload; no scope means nothing to weave. */
function scopeOf(_deps: Deps, payload: Record<string, unknown>): ScopeRef | null {
  const scope = String(payload['scope'] ?? '');
  if (!scope) return null;
  const scopeType = String(payload['scopeType'] ?? '');
  const types = ['ticket', 'sprint', 'project', 'version'] as const;
  const matched = types.find((type) => type === scopeType);
  return { scopeType: matched ?? 'project', scope };
}

/** Loads and shapes the weave map of a scope. */
export async function render(
  deps: Deps,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const scope = await scopeOf(deps, payload);
  const language = pickLang(String(payload['language'] ?? payload['locale'] ?? ''));
  if (!scope) {
    return {
      scope: payload['scope'] ?? '',
      scopeType: payload['scopeType'] ?? 'project',
      language,
      message: 'no-criterion-written',
      threads: [],
      passes: [],
      meshes: [],
      holes: [],
    };
  }
  const now = deps.clock.now();
  const criteria = await deps.store.listCriteria(scope);
  const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
  const verifications = await deps.store.listVerifications(scope);
  const versions = (
    await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))
  ).flat();
  const perforations = detectPerforations({ criteria, versions, links, verifications, now });
  const dangling = detectDangling({ verifications, links, criteria, now });
  const zoneRisks = await deps.store.listZoneRisks(scope.scope);
  const holes = findHoles({
    criteria,
    links,
    verifications,
    dangling,
    zoneRisks,
    recurrenceByCriterion: {},
    scope: scope.scope,
  });
  return buildWeaveMap({
    scope: scope.scope,
    scopeType: scope.scopeType,
    computedAt: now,
    language,
    criteria,
    verifications,
    links,
    perforations,
    dangling,
    holes: holes.map((hole) => ({
      criterionId: hole.criterionId,
      criterionKey: hole.criterionKey,
      priorityScore: hole.priorityScore,
    })),
  });
}