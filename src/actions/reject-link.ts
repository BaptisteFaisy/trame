import type { ActorContext, Deps } from '../ports';
import { decideLink } from './link-decision';
import { readPersonFilter, say } from './common';

/**
 * Liaison refusée : la suggestion suivante du même type s'affaiblit (§9.4).
 *
 * Un refus **avec raison** est écrit dans le store (`rejectedAt` +
 * `rejectReason`) et affaiblit les jetons partagés entre le critère et
 * l'acte : la prochaine suggestion du même chemin part de ces poids (§24.9).
 * Sans raison, l'app refuse de décider — un refus qui n'explique rien
 * n'apprend rien.
 *
 * Entrées : criterionId, verificationRef, reason — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const result = await decideLink(deps, payload, 'reject');
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
      rejectedAt: decision.link.rejectedAt,
      rejectReason: decision.link.rejectReason,
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