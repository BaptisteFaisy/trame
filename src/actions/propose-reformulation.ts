import type { ActorContext, Deps } from '../ports';
import { draftReformulation, enqueueProposal } from '../domain/proposals';
import { falsifiabilityOf } from '../domain/falsifiability';
import { envelope, loadCriterion, readPersonFilter } from './common';

/**
 * Reformulation vérifiable d'un critère infalsifiable (§12.6).
 *
 * La reformulation **propose**, elle n'applique pas : elle part dans la file
 * de validation et attend une décision humaine (§22 réversibilité). Elle porte
 * le texte d'origine (`before`), le texte proposé (`after`) et la mesure qui
 * rend le critère tranchable.
 *
 * Un critère déjà falsifiable n'a pas besoin de reformulation : l'app le dit,
 * au lieu d'inventer une reformulation que personne n'a demandée.
 *
 * Entrées : ticketKey, criterionId — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = await loadCriterion(deps, payload);
  if (!read.ok) return read.refusal;
  const { criterion } = read.target;
  const verdict = falsifiabilityOf(criterion.text);
  if (verdict.falsifiable) {
    return {
      ...envelope({ scope: criterion.ticketKey, scopeType: 'ticket' }, deps.clock.now()),
      proposed: false,
      reason: 'le critère est déjà vérifiable : aucune reformulation nécessaire',
      criterion: { ticketKey: criterion.ticketKey, criterionKey: criterion.criterionKey, text: criterion.text },
      applied: false,
      awaitingHumanDecision: false,
    };
  }
  const reason = criterion.unfalsifiableReason ?? verdict.reason ?? 'critère infalsifiable';
  const proposal = await enqueueProposal(deps, draftReformulation(criterion, reason));
  const draft = proposal.payload.kind === 'reformulation' ? proposal.payload : null;
  return {
    ...envelope({ scope: criterion.ticketKey, scopeType: 'ticket' }, proposal.createdAt),
    proposal: {
      id: proposal.id,
      type: proposal.type,
      state: proposal.state,
      createdAt: proposal.createdAt,
      before: draft?.before,
      after: draft?.after,
      measure: draft?.measure,
    },
    criterion: {
      ticketKey: criterion.ticketKey,
      criterionKey: criterion.criterionKey,
      text: criterion.text,
      origin: criterion.origin,
      unfalsifiableReason: reason,
    },
    applied: false,
    awaitingHumanDecision: true,
    messages: ['msg.not-applied'],
  };
}