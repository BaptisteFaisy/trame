/**
 * Helpers communs aux dix écrans (§17) : lire un périmètre et une langue
 * depuis la charge utile, charger les entités, et l'état « aucun critère ».
 *
 * Un écran sans périmètre montre « aucun critère écrit », jamais un faux 0 %
 * (§24.16, §22) : l'absence de regard ne devient pas un trou du projet.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import type { Criterion, Link, ScopeRef, Verification, CriterionVersion } from '../types';
import type { Lang } from '../i18n/index';
import { pickLang } from '../i18n/index';

/** Une langue demandée par la charge utile, sinon celle de l'app. */
export function languageFrom(payload: Record<string, unknown>): Lang {
  return pickLang(String(payload['language'] ?? payload['locale'] ?? payload['lang'] ?? ''));
}

/** Le périmètre demandé ; `null` quand il n'y a rien à mesurer. */
export function scopeFrom(payload: Record<string, unknown>): ScopeRef | null {
  const scope = String(payload['scope'] ?? '');
  if (!scope) return null;
  const scopeType = String(payload['scopeType'] ?? '');
  const types = ['ticket', 'sprint', 'project', 'version'] as const;
  const matched = types.find((type) => type === scopeType);
  return { scopeType: matched ?? 'project', scope };
}

export interface ScopeData {
  criteria: Criterion[];
  links: Link[];
  verifications: Verification[];
  versions: CriterionVersion[];
}

/** Tout ce que les registres savent d'un périmètre. */
export async function loadScope(deps: Deps, scope: ScopeRef): Promise<ScopeData> {
  const criteria = await deps.store.listCriteria(scope);
  const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
  const verifications = await deps.store.listVerifications(scope);
  const versions = (
    await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))
  ).flat();
  return { criteria, links, verifications, versions };
}

/** L'état « aucun critère écrit » d'un périmètre (§24.16). */
export function noCriterion(language: Lang, scope: string, scopeType: ScopeRef['scopeType']): unknown {
  return { scope, scopeType, language, message: 'no-criterion-written', empty: true };
}

/** Le critère demandé (ticket + identifiant), ou `null`. */
export async function findCriterion(
  deps: Deps,
  ticketKey: string,
  criterionId: string,
): Promise<Criterion | null> {
  if (criterionId) {
    const byId = await deps.store.getCriterion(criterionId);
    if (byId) return byId;
  }
  return deps.store.findCriterion(ticketKey, criterionId) ?? null;
}