/**
 * Écran : les zones à risque (§11). La matière observée qui nourrit le métré.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import { scopeFrom, languageFrom } from './screen.js';
import { buildZoneRisks } from '../viewmodel/zone-risks.js';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const scope = scopeFrom(payload) ?? { scopeType: 'project' as const, scope: String(payload['scope'] ?? 'TRAME') };
  const language = languageFrom(payload);
  const zoneRisks = await deps.store.listZoneRisks(scope.scope);
  return buildZoneRisks({ language, scope: scope.scope, scopeType: scope.scopeType, computedAt: deps.clock.now(), zoneRisks });
}