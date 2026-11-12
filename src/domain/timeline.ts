/**
 * L'historique de la trame (§12.4, §17, §19).
 *
 * Chaque recalcul pose une mesure datée (`putCoverage` n'a pas de clé : la table
 * `coverage_snapshot` est un journal). L'historique le relit du **plus récent au
 * plus ancien**, borné par `limit` — une courbe qui monte sans jamais descendre
 * serait une courbe truquée, et le journal sert justement à montrer les baisses
 * (§8.3 : la couverture redescend quand un test meurt).
 *
 * Le domaine ne parle jamais au dépôt autrement que par le port `TrameStore`.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type { Coverage, ScopeType } from '../types.js';

/** Le tri du port : du plus récent au plus ancien (dates ISO 8601). */
function newestFirst(rows: readonly Coverage[]): Coverage[] {
  return [...rows].sort((left, right) => right.computedAt.localeCompare(left.computedAt));
}

/** L'historique d'un périmètre, du plus récent au plus ancien, borné. */
export async function coverageTimeline(
  deps: Deps,
  scope: string,
  scopeType: ScopeType,
  limit: number,
): Promise<Coverage[]> {
  if (limit <= 0) return [];
  const rows = await deps.store.listCoverageTimeline(scope, scopeType, limit);
  return newestFirst(rows).slice(0, limit);
}
