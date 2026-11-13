import type { ActorContext, Deps } from '../ports';
import { saveWitness as recordWitness } from '../domain/witness';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
  readText,
} from './common';

/**
 * Action interne : conserve l'état daté d'une trame (§4, §12.4).
 *
 * Un témoin est la mémoire d'un périmètre à cette époque : une fois posé, il
 * ne se recalcule pas, et c'est lui qui rend le bulletin comparable au sprint
 * précédent (§24.13). Le témoin porte exactement la date de la couverture
 * qu'il conserve — jamais celle de l'enregistrement (§22).
 *
 * Entrées : scope, period — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = readScope(payload);
  if (!read.ok) return read.refusal;
  const period = readText(payload.period);
  const data = await loadScope(deps, read.request);
  const coverage = await coverageOf(deps, data);
  const witness = await recordWitness(
    deps,
    read.request.scope,
    read.request.scopeType,
    period,
    coverage,
  );
  const figures = figuresOf(coverage);
  return {
    ...envelope(read.request, coverage.computedAt),
    witness: {
      id: witness.id,
      period: witness.period,
      computedAt: witness.computedAt,
      criteriaTotal: coverage.criteriaTotal,
      coveredDeclared: coverage.coveredDeclared,
      coveredProvisional: coverage.coveredProvisional,
      proven: coverage.proven,
      holes: coverage.holes,
      dangling: coverage.dangling,
      perforations: coverage.perforations,
    },
    figures,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.dated-scope']),
  };
}