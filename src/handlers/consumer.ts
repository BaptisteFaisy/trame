/**
 * Consumer `trame-recompute` (§18).
 *
 * Les recalculs longs passent par ici : jusqu'à 900 s, par tranches, avec un
 * curseur. Un projet de 50 000 tickets ne se recalcule pas en une fonction
 * (§21) — chaque tranche traite une portion, enregistre où elle s'est arrêtée,
 * et republie le message tant qu'il reste du périmètre.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps, RecomputeMessage } from '../ports';
import type { ScopeRef } from '../types';
import { collect as collectGraph } from '../ingest/graph';
import { weave } from '../domain/links';
import { recomputeScope } from './scheduled';

/** Combien de tickets une tranche de critères traite. */
export const SLICE_SIZE = 25;

/** La tranche « critères » : on relit les tickets modifiés depuis le curseur. */
export async function sliceCriteria(
  deps: Deps,
  message: RecomputeMessage,
): Promise<boolean> {
  const cursor = await deps.store.getCursor(message.scope, 'criteria');
  const since = cursor?.lastModifiedAt ?? '1970-01-01T00:00:00.000Z';
  const issues = await deps.jira.listIssuesSince(message.scope, since, SLICE_SIZE);
  const { storeCriteria } = await import('./events');
  for (const issue of issues) {
    const { materialsOf } = await import('./events');
    await storeCriteria(deps, issue, materialsOf(issue));
  }
  const last = issues[issues.length - 1];
  await deps.store.putCursor({
    scope: message.scope,
    mode: 'criteria',
    lastIssueId: last?.id,
    lastModifiedAt: last?.updatedAt,
    runAt: deps.clock.now(),
  });
  return issues.length >= SLICE_SIZE;
}

/** La tranche « actes de vérification » : ce que le graphe sait du périmètre. */
export async function sliceVerifications(
  deps: Deps,
  message: RecomputeMessage,
): Promise<void> {
  const acts = await collectGraph(deps, {
    scopeType: message.scopeType,
    scope: message.scope,
  });
  for (const act of acts) await deps.store.putVerification(act);
}

/** La tranche « liaisons » : le tissage du périmètre (§9). */
export async function sliceLinks(
  deps: Deps,
  message: RecomputeMessage,
): Promise<void> {
  const scope: ScopeRef = { scopeType: message.scopeType, scope: message.scope };
  const criteria = await deps.store.listCriteria(scope);
  const verifications = await deps.store.listVerifications(scope);
  const declared = await deps.jira.declaredLinks(message.scope);
  const links = weave({ criteria, verifications, declared, establishedAt: deps.clock.now() });
  for (const link of links) await deps.store.putLink(link);
}

/** La tranche « mesures » : couverture, trous, bulletin, témoin (§8, §12.4). */
export async function sliceMeasures(
  deps: Deps,
  message: RecomputeMessage,
): Promise<void> {
  await recomputeScope(deps, { scopeType: message.scopeType, scope: message.scope });
}

/**
 * Le message utile d'une charge utile de consumer.
 *
 * Forge enveloppe le corps poussé dans `body` (`{ body: <message> }`) ; les
 * tests et les rappels passent le message nu. Lire le mauvais niveau donne
 * `mode inconnu` et un message perdu en silence (incident du 13/11/2026 : le
 * recalcul ne tournait jamais).
 */
export function messageOf(payload: Record<string, unknown>): RecomputeMessage {
  const body = payload['body'];
  const source =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : payload;
  return source as unknown as RecomputeMessage;
}

/** Le consumer : une tranche, puis on se remet en file s'il reste du travail. */
export async function onRecomputeMessage(message: RecomputeMessage, deps: Deps): Promise<void> {
  let more = false;
  switch (message.mode) {
    case 'criteria':
      more = await sliceCriteria(deps, message);
      break;
    case 'verifications':
      await sliceVerifications(deps, message);
      break;
    case 'links':
      await sliceLinks(deps, message);
      break;
    case 'measures':
      await sliceMeasures(deps, message);
      break;
    default:
      deps.log.log('warn', 'consumer : mode inconnu', { mode: message.mode });
      return;
  }
  deps.log.log('info', 'consumer : tranche traitée', {
    scope: message.scope,
    mode: message.mode,
    more,
  });
  if (more) {
    await deps.queue.publish({
      scope: message.scope,
      scopeType: message.scopeType,
      mode: message.mode,
      cursor: message.cursor,
    });
  }
}
