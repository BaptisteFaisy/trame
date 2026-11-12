import type { ActorContext, Deps } from '../ports.js';
import { decideLink } from './link-decision.js';
import { readPersonFilter, say } from './common.js';

/**
 * Liaison confirmée (retricotage, §9.4).
 *
 * Une liaison dérivée confirmée **devient déclarée** : elle apparaît comme
 * `confirmed` dans l'historique du critère, et sa confiance entre dans la
 * couverture déclarée (§24.8). La confirmation renforce les jetons partagés,
 * donc la suggestion suivante du même type.
 *
 * Entrées : criterionId, verificationRef, kind — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const result = await decideLink(deps, payload, 'confirm');
  if (!result.ok) return result.refusal;
  const { decision } = result;
  return {
    scope: decision.criterion.ticketKey,
    scopeType: 'ticket',
    computedAt: deps.clock.now(),
    applied: true,
    awaitingHumanDecision: false,
    link: {
      id: decision.link.id,
      kind: decision.link.kind,
      path: decision.link.path,
      confidence: decision.link.confidence,
      confirmedAt: decision.link.confirmedAt,
    },
    criterion: {
      ticketKey: decision.criterion.ticketKey,
      criterionKey: decision.criterion.criterionKey,
      text: decision.criterion.text,
    },
    verification: {
      id: decision.verification.id,
      name: decision.verification.name,
      strength: decision.verification.strength,
    },
    learned: decision.learned,
    affectedLinks: decision.affected,
    messages: [say(deps, 'msg.dated-scope')],
  };
}