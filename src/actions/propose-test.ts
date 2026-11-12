import type { ActorContext, Deps } from '../ports.js';
import { draftTest, enqueueProposal } from '../domain/proposals.js';
import { readPersonFilter } from './common.js';
import { loadCriterion, envelope } from './common.js';

/**
 * Brouillon de cas de test proposé pour un trou, jamais appliqué (§12.6).
 *
 * Le brouillon **cite** le critère qu'il couvrirait, dit la forme de
 * vérification attendue et le composant suggéré. Rien n'est créé dans le code,
 * rien n'est appliqué au critère : la proposition part dans la file de
 * validation et attend une décision humaine (§22 réversibilité).
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
  const proposal = await enqueueProposal(deps, draftTest(criterion));
  const draft = proposal.payload.kind === 'test-draft' ? proposal.payload : null;
  return {
    ...envelope({ scope: criterion.ticketKey, scopeType: 'ticket' }, proposal.createdAt),
    proposal: {
      id: proposal.id,
      type: proposal.type,
      state: proposal.state,
      createdAt: proposal.createdAt,
      title: draft?.title,
      body: draft?.body,
      expectedForm: draft?.expectedForm,
      zone: draft?.zone,
    },
    criterion: {
      ticketKey: criterion.ticketKey,
      criterionKey: criterion.criterionKey,
      text: criterion.text,
      origin: criterion.origin,
    },
    applied: false,
    awaitingHumanDecision: true,
    messages: ['msg.not-applied'],
  };
}