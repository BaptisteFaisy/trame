/**
 * Les données partagées des tests d'actions (§16).
 *
 * Deux jeux de données, jamais dupliqués :
 *
 *  - le **scénario TRAME-1** (`tests/helpers/scenario.ts`) : un ticket qui
 *    porte tous les jugements de l'app ;
 *  - le **projet de démonstration** (`src/sample/demo-project.ts`) : les six
 *    tickets que les jugés verront, avec leurs perforations, leurs tests
 *    désactivés et leurs liaisons dérivées.
 *
 * Les cas particuliers (une force, une zone à risque, un droit manquant) se
 * construisent avec les fabriques du scénario : pas de littéral d'objet
 * recopié dans les tests (docs/CONTRACTS.md §1.2).
 */
import type { Criterion, Link, Verification } from '../../src/types.js';
import { buildDemoProject, DEMO_SPRINT } from '../../src/sample/demo-project.js';
import type { FakeStore } from '../helpers/index.js';
import { makeCriterion, makeLink, makeVerification } from '../helpers/index.js';

/** Le ticket de démonstration qui porte les quatre strengths (§24.2). */
export const DEMO_TICKET = 'TRAME-102';

/** Le sprint de démonstration : le seul périmètre qui ne mêle pas TRAME-1. */
export const DEMO_SCOPE = { scopeType: 'sprint' as const, scope: DEMO_SPRINT };

/** L'acteur : un appel MCP, jamais une attestation (§5). */
export const ACTOR = { accountId: 'u1', moduleId: 'mcp', fromMcp: true, cloudId: 'c1' };

/** Le projet de démonstration, versé dans un store. */
export async function seedDemoProject(store: FakeStore): Promise<void> {
  const demo = buildDemoProject();
  for (const criterion of demo.criteria) await store.putCriterion(criterion);
  for (const verification of demo.verifications) await store.putVerification(verification);
  for (const link of demo.links) await store.putLink(link);
  for (const risk of demo.zones) await store.putZoneRisk(risk);
}

/** Un critère dans son propre périmètre : il n'empiète pas sur TRAME-1. */
export function criterionIn(ticket: string, over: Partial<Criterion> = {}): Criterion {
  return makeCriterion({
    id: over.id ?? `crit_${ticket}_${over.criterionKey ?? 'AC-1'}`,
    ticketKey: ticket,
    issueId: `issue-${ticket}`,
    scopeRefs: [
      { scopeType: 'ticket', scope: ticket },
      { scopeType: 'project', scope: ticket },
    ],
    ...over,
  });
}

/** Un acte de vérification dans le même périmètre. */
export function verificationIn(ticket: string, over: Partial<Verification> = {}): Verification {
  return makeVerification({
    id: over.id ?? `ver_${ticket}_${over.name ?? 'act'}`,
    ticketKey: ticket,
    issueId: `issue-${ticket}`,
    ...over,
  });
}

/** Une maille entre un critère et un acte. */
export function linkIn(
  criterion: Criterion,
  verification: Verification,
  over: Partial<Link> = {},
): Link {
  return makeLink({
    id: over.id ?? `link_${criterion.id}_${verification.id}`,
    criterionId: criterion.id,
    verificationId: verification.id,
    criterionHashAtLink: criterion.textHash,
    ...over,
  });
}
