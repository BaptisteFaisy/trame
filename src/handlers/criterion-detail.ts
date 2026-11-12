/**
 * Écran : la fiche critère (§12.6 / TR-14). Couverture, forces, perforation et
 * proposition de test pour un critère — rien d'autre.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import { languageFrom, findCriterion, noCriterion } from './screen.js';
import { computeCoverage } from '../domain/coverage.js';
import { buildCriterionDetail } from '../viewmodel/criterion-detail.js';

export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown> {
  const language = languageFrom(payload);
  const ticketKey = String(payload['ticketKey'] ?? '');
  const criterionId = String(payload['criterionId'] ?? '');
  const criterion = await findCriterion(deps, ticketKey, criterionId);
  if (!criterion) return noCriterion(language, ticketKey, 'ticket');
  const scope = { scopeType: 'ticket' as const, scope: criterion.ticketKey };
  const now = deps.clock.now();
  const criteria = await deps.store.listCriteria(scope);
  const links = await deps.store.listLinks(criterion.id);
  const verifications = await deps.store.listVerifications(scope);
  const allLinks = (await Promise.all(criteria.map((row) => deps.store.listLinks(row.id)))).flat();
  const perforations = (await deps.store.listPerforations(scope)).filter((row) => row.criterionId === criterion.id);
  const proposals = (await deps.store.listProposals('open')).filter((row) => row.criterionId === criterion.id);
  const coverage = computeCoverage({ criteria, verifications, links: allLinks, scope: criteria[0]?.ticketKey ?? ticketKey, scopeType: 'ticket', computedAt: now });
  return buildCriterionDetail({
    language,
    scope: criterion.ticketKey,
    scopeType: 'ticket',
    computedAt: now,
    criterion,
    links,
    verifications,
    perforations,
    proposals,
    coverage,
  });
}