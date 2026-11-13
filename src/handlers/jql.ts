/**
 * Fonctions JQL (§18) : `holes()`, `perforated()`, `dangling()`, `uncovered()`.
 *
 * Une fonction JQL Forge reçoit les identifiants des tickets candidats et rend
 * ceux qui vérifient la condition. Elles lisent les REGISTRES (couverture,
 * perforations, fils détendus) — jamais un recalcul en ligne : la fiche critère
 * doit répondre en moins de 2 s depuis le cache (§22).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import { computeCoverage } from '../domain/coverage';
import { detectPerforations } from '../domain/perforations';

/** Le nombre de tickets qu'une fonction JQL regarde au plus. */
export const JQL_LIMIT = 100;

export type JqlFunction = (deps: Deps, issueIds: string[], query?: string) => Promise<string[]>;

/** L'état d'un ticket, tel que les registres le disent. */
interface TicketState {
  holes: number;
  perforations: number;
  dangling: number;
  covered: number;
  total: number;
}

/** Lit l'état de chaque ticket candidat depuis les registres. */
async function readStates(
  deps: Deps,
  issueIds: string[],
): Promise<Map<string, TicketState>> {
  const now = deps.clock.now();
  const states = new Map<string, TicketState>();
  for (const issueId of issueIds.slice(0, JQL_LIMIT)) {
    const scope = { scopeType: 'ticket' as const, scope: issueId };
    const criteria = await deps.store.listCriteria(scope);
    if (criteria.length === 0) continue;
    const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
    const verifications = await deps.store.listVerifications(scope);
    const versions = (
      await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))
    ).flat();
    const perforations = detectPerforations({ criteria, versions, links, verifications, now });
    const dangling = await deps.store.listDangling(scope);
    const coverage = computeCoverage({
      criteria,
      verifications,
      links,
      perforations,
      dangling,
      scope: issueId,
      scopeType: 'ticket',
      computedAt: now,
    });
    states.set(issueId, {
      holes: coverage.holes,
      perforations: coverage.perforations,
      dangling: dangling.length,
      covered: coverage.coveredDeclared,
      total: coverage.criteriaFalsifiable,
    });
  }
  return states;
}

/** Les tickets qui vérifient une condition sur leur état. */
async function select(
  deps: Deps,
  issueIds: string[],
  condition: (state: TicketState) => boolean,
): Promise<string[]> {
  const states = await readStates(deps, issueIds);
  return [...states.entries()].filter(([, state]) => condition(state)).map(([key]) => key);
}

/** Les tickets qui ont au moins un critère sans acte de vérification. */
export const jqlHoles: JqlFunction = async (deps, issueIds) =>
  select(deps, issueIds, (state) => state.holes > 0);

/** Les tickets dont un critère a changé après sa vérification. */
export const jqlPerforated: JqlFunction = async (deps, issueIds) =>
  select(deps, issueIds, (state) => state.perforations > 0);

/** Les tickets dont un acte de vérification ne couvre plus rien. */
export const jqlDangling: JqlFunction = async (deps, issueIds) =>
  select(deps, issueIds, (state) => state.dangling > 0);

/** Les tickets dont les critères ne sont pas tous couverts. */
export const jqlUncovered: JqlFunction = async (deps, issueIds) =>
  select(deps, issueIds, (state) => state.covered < state.total);
