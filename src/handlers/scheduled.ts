/**
 * Déclencheur planifié nocturne (§18).
 *
 * Cinq déclencheurs planifiés au plus par app, un seul à 5 minutes : celui-ci
 * ne porte QUE sur les perforations, les fils détendus et le bulletin — jamais
 * sur l'extraction des critères, trop coûteuse pour une fenêtre planifiée.
 *
 * Il parcourt les périmètres connus de l'app et recalcule leurs mesures : le
 * bulletin du matin est à jour avant la décision de release (§12.4).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type { ScopeRef } from '../types.js';
import type { Coverage, ScopeType } from '../types.js';
import { computeCoverage } from '../domain/coverage.js';
import { detectDangling } from '../domain/dangling.js';
import { detectPerforations } from '../domain/perforations.js';
import { findHoles } from '../domain/holes.js';
import { saveWitness } from '../domain/witness.js';

/** Combien de périmètres le passage nocturne traite. */
export const NIGHTLY_SCOPE_LIMIT = 50;

/** Un périmètre brut (« project:TRAME » ou « TRAME-1 ») devient un ScopeRef. */
export function parseScope(raw: string): ScopeRef {
  const at = raw.indexOf(':');
  if (at <= 0) return { scopeType: 'ticket', scope: raw };
  const scopeType = raw.slice(0, at) as ScopeType;
  const scope = raw.slice(at + 1);
  return { scopeType, scope };
}

/** Recalcule les mesures d'un périmètre : couverture, trous, fils détendus. */
export async function recomputeScope(
  deps: Deps,
  scope: ScopeRef,
): Promise<Coverage | null> {
  const now = deps.clock.now();
  const criteria = await deps.store.listCriteria(scope);
  if (criteria.length === 0) return null;
  const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
  const verifications = await deps.store.listVerifications(scope);
  const versions = (
    await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))
  ).flat();
  const perforations = detectPerforations({ criteria, versions, links, verifications, now });
  for (const perforation of perforations) await deps.store.putPerforation(perforation);
  const dangling = detectDangling({ verifications, links, criteria, now });
  for (const thread of dangling) await deps.store.putDangling(thread);
  const coverage = computeCoverage({
    criteria,
    verifications,
    links,
    perforations,
    dangling,
    scope: scope.scope,
    scopeType: scope.scopeType,
    computedAt: now,
  });
  await deps.store.putCoverage(coverage);
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
  for (const hole of holes) await deps.store.putHole(hole);
  await saveWitness(deps, scope.scope, scope.scopeType, scope.scope, coverage);
  return coverage;
}

/** Le passage nocturne : tous les périmètres connus. */
export async function onScheduledTick(
  payload: Record<string, unknown>,
  deps: Deps,
): Promise<void> {
  const scopes = await deps.store.listScopes(NIGHTLY_SCOPE_LIMIT);
  let treated = 0;
  for (const raw of scopes) {
    const scope = parseScope(raw);
    const coverage = await recomputeScope(deps, scope);
    if (coverage) treated += 1;
  }
  deps.log.log('info', 'scheduledTrigger : recalcul nocturne terminé', {
    scopes: scopes.length,
    treated,
    payload: Object.keys(payload).length,
  });
}
