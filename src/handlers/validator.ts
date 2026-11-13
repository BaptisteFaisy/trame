/**
 * `jira:workflowValidator` — porte de non-régression optionnelle (TR-30).
 *
 * Elle signale les trous et les perforations au moment de la clôture, et
 * n'interdit JAMAIS : la mesure ne modifie pas le travail (§5, §14). Le
 * verdict porte `blocking: false` tant que l'équipe n'a pas signé
 * explicitement l'option.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import { computeCoverage } from '../domain/coverage';
import { detectPerforations } from '../domain/perforations';

/** Ce que Forge passe à un validateur de transition. */
export interface ValidatorInput {
  issueKey: string;
  configuration: Record<string, unknown>;
  transition: { fromStatus: string; toStatus: string };
}

/** Verdict : il alerte, il n'interdit jamais (§5, TR-30). */
export interface WeaveVerdict {
  valid: boolean;
  message: string;
  holes: number;
  perforations: number;
  blocking: boolean;
}

/** Lit la trame d'un ticket : ses critères, ses liaisons, ses actes. */
async function readWeave(deps: Deps, issueKey: string) {
  const scope = { scopeType: 'ticket' as const, scope: issueKey };
  const criteria = await deps.store.listCriteria(scope);
  const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
  const verifications = await deps.store.listVerifications(scope);
  const versions = (
    await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))
  ).flat();
  return { criteria, links, verifications, versions };
}

/** Le verdict : des trous et des perforations, et rien d'autre. */
export function createValidator(
  deps: Deps,
): (input: ValidatorInput) => Promise<WeaveVerdict> {
  return async (input: ValidatorInput): Promise<WeaveVerdict> => {
    const now = deps.clock.now();
    const { criteria, links, verifications, versions } = await readWeave(deps, input.issueKey);
    if (criteria.length === 0) {
      return {
        valid: true,
        message: 'no-criterion-written',
        holes: 0,
        perforations: 0,
        blocking: false,
      };
    }
    const perforations = detectPerforations({ criteria, versions, links, verifications, now });
    const coverage = computeCoverage({
      criteria,
      verifications,
      links,
      perforations,
      scope: input.issueKey,
      scopeType: 'ticket',
      computedAt: now,
    });
    const message =
      coverage.holes > 0
        ? `${coverage.holes} hole(s) — covered by ${coverage.coveredDeclared} declared act(s)`
        : coverage.perforations > 0
          ? `${coverage.perforations} perforation(s) to re-verify`
          : 'weave-complete';
    return {
      valid: true,
      message,
      holes: coverage.holes,
      perforations: coverage.perforations,
      blocking: false,
    };
  };
}
