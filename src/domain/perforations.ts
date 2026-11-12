/**
 * Les perforations (§8.2) — la maille existe, mais elle ne tient plus.
 *
 * Un critère est perforé quand son empreinte a changé **après** la
 * vérification qui le couvrait. La référence n'est pas le texte courant : c'est
 * l'empreinte enregistrée **au moment du tissage** (`link.criterionHashAtLink`).
 * C'est tout le coût du jugement (§8.2) : sans elle, on ne peut pas dire que le
 * texte a changé *après* la vérification, seulement qu'il a changé.
 *
 * Graffiti (§8.2, seuils figés dans `src/defaults.ts`) :
 *  - `fresh` : le critère a changé il y a moins de 7 jours — il est en cours
 *    d'itération, à regarder ;
 *  - `dry` : plus de 30 jours, et le critère n'a jamais été re-vérifié depuis ;
 *  - `multiple` : le critère a changé au moins 3 fois, jamais re-vérifié.
 *
 * Deux dates sont toujours portées (§22 explicabilité) : `changedAt` (le dernier
 * changement) et `verifiedAt` (la vérification qui tenait la maille).
 *
 * La date courante vient de l'entrée (`now`), jamais de l'horloge système : le
 * domaine est pur et rejouable.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import {
  DERIVED_LINK_THRESHOLD,
  PERFORATION_DRY_DAYS,
  PERFORATION_FRESH_DAYS,
  PERFORATION_MULTIPLE_CHANGES,
} from '../defaults.js';
import type {
  Criterion,
  CriterionVersion,
  Link,
  Perforation,
  PerforationClass,
  Verification,
} from '../types.js';

/** Ce que le jugement a besoin de lire — rien de plus. */
export interface PerforationInput {
  criteria: readonly Criterion[];
  versions: readonly CriterionVersion[];
  links: readonly Link[];
  verifications: readonly Verification[];
  /** La date courante du calcul : jamais de l'horloge système. */
  now: string;
}

/** Les faits qui décident du classement (§8.2). */
export interface PerforationFacts {
  /** Âge du dernier changement : `now` − `changedAt`. */
  ageDays: number;
  /** Nombre de modifications du critère depuis sa création. */
  changeCount: number;
  /** Vrai si le critère a été re-vérifié depuis son dernier changement. */
  reverified: boolean;
}

const MS_PER_DAY = 86_400_000;

/** Jours entiers entre deux horodatages ISO (de `from` à `to`). */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / MS_PER_DAY));
}

/** Âge en jours d'un changement, mesuré depuis `now` (§8.2). */
export function ageInDays(at: string, now: string): number {
  return daysBetween(at, now);
}

/**
 * Le graffiti de la perforation (§8.2).
 *
 * Ordre de lecture : le nombre de changements l'emporte (un critère qui
 * bouge trois fois sans re-vérification est plus inquiétant qu'un critère
 * simplement vieux), puis la fraîcheur, puis l'ancienneté. Une perforation qui
 * n'est ni multiple ni sèche garde la classe par défaut : le registre
 * l'affiche, sans graffiti alarmant.
 */
export function classifyPerforation(facts: PerforationFacts): PerforationClass {
  if (!facts.reverified && facts.changeCount >= PERFORATION_MULTIPLE_CHANGES) return 'multiple';
  if (facts.ageDays < PERFORATION_FRESH_DAYS) return 'fresh';
  if (!facts.reverified && facts.ageDays > PERFORATION_DRY_DAYS) return 'dry';
  return 'fresh';
}

/**
 * Les perforations d'un périmètre, classées et datées.
 *
 * Une perforation par maille : le couple (critère, acte de vérification) dont
 * l'empreinte tissée ne correspond plus au texte du critère (§8.2). Les mailles
 * les plus anciennes d'abord — c'est l'ordre d'action du registre (§12.2).
 */
export function detectPerforations(input: PerforationInput): Perforation[] {
  const verifications = new Map(input.verifications.map((one) => [one.id, one]));
  const versions = groupByCriterion(input.versions);
  const perforations: Perforation[] = [];
  for (const criterion of input.criteria) {
    // Un critère supprimé disparaît du périmètre (§23) : c'est le fil détendu
    // qui prend le relais, pas la perforation.
    if (criterion.deletedAt !== undefined) continue;
    const meshes = meshesOf(criterion.id, input.links);
    if (meshes.length === 0) continue;
    const lastVerifiedAt = lastVerificationAt(meshes, verifications);
    for (const mesh of meshes) {
      const perforation = judgeMesh(
        criterion,
        mesh,
        verifications.get(mesh.verificationId),
        versions.get(criterion.id) ?? [],
        lastVerifiedAt,
        input.now,
      );
      if (perforation !== null) perforations.push(perforation);
    }
  }
  return perforations.sort(oldestChangeFirst);
}

/**
 * Une liaison n'est une **maille** que si elle désigne vraiment quelque chose
 * (§9.2) : une liaison déclarée ou confirmée toujours ; une liaison dérivée
 * seulement au-dessus du seuil de couverture provisoire — en dessous, c'est
 * une proposition dans la file de travail, pas une maille. Une proposition ne
 * se perce pas et ne retire pas de couverture.
 */
export function isMesh(link: Link): boolean {
  if (link.kind === 'declared' || link.kind === 'confirmed') return true;
  return link.confidence >= DERIVED_LINK_THRESHOLD;
}

/** Les mailles d'un critère : les liaisons non rejetées qui le couvrent. */
function meshesOf(criterionId: string, links: readonly Link[]): Link[] {
  return links.filter(
    (link) =>
      link.criterionId === criterionId && link.rejectedAt === undefined && isMesh(link),
  );
}

/** Les versions d'un critère, groupées par critère. */
function groupByCriterion(
  versions: readonly CriterionVersion[],
): Map<string, CriterionVersion[]> {
  const grouped = new Map<string, CriterionVersion[]>();
  for (const version of versions) {
    const list = grouped.get(version.criterionId) ?? [];
    list.push(version);
    grouped.set(version.criterionId, list);
  }
  return grouped;
}

/** La date de la dernière vérification qui couvrait le critère. */
function lastVerificationAt(
  meshes: readonly Link[],
  verifications: Map<string, Verification>,
): string | null {
  let latest: string | null = null;
  for (const mesh of meshes) {
    const verification = verifications.get(mesh.verificationId);
    if (verification === undefined) continue;
    if (latest === null || verification.executedAt > latest) latest = verification.executedAt;
  }
  return latest;
}

/**
 * Juge une maille : la perforation, ou `null` si elle tient encore.
 *
 * - l'empreinte tissée et l'empreinte courante diffèrent **et** le critère a
 *   changé après la vérification : la maille est percée ;
 * - l'empreinte est identique mais la version a changé (§23) : le texte est
 *   revenu à l'identique, la perforation est « refermée » (`reopened`) ;
 * - sinon la maille tient : aucune perforation.
 */
function judgeMesh(
  criterion: Criterion,
  mesh: Link,
  verification: Verification | undefined,
  versions: readonly CriterionVersion[],
  lastVerifiedAt: string | null,
  now: string,
): Perforation | null {
  if (verification === undefined) return null;
  if (criterion.textHash === mesh.criterionHashAtLink) {
    return reopenedPerforation(criterion, mesh, verification, versions, now);
  }
  if (criterion.changedAt <= verification.executedAt) return null;
  const reverified = lastVerifiedAt !== null && lastVerifiedAt > criterion.changedAt;
  const ageDays = ageInDays(criterion.changedAt, now);
  return {
    id: `perf_${mesh.id}`,
    criterionId: criterion.id,
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    verificationId: verification.id,
    criterionVersionNo: criterion.version,
    changedAt: criterion.changedAt,
    verifiedAt: verification.executedAt,
    ageDays,
    klass: classifyPerforation({ ageDays, changeCount: countChanges(criterion, versions), reverified }),
    state: reverified ? 'reverified' : 'open',
  };
}

/**
 * La perforation « refermée » (§23) : le texte est revenu à l'identique de la
 * version vérifiée — l'empreinte est identique, mais la version a changé.
 * L'app garde l'historique et le signale au lieu de l'effacer.
 */
function reopenedPerforation(
  criterion: Criterion,
  mesh: Link,
  verification: Verification,
  versions: readonly CriterionVersion[],
  now: string,
): Perforation | null {
  const breach = breachAfterRestore(versions, mesh.criterionHashAtLink, criterion.version);
  if (breach === null) return null;
  const ageDays = ageInDays(breach.changedAt, now);
  return {
    id: `perf_${mesh.id}`,
    criterionId: criterion.id,
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    verificationId: verification.id,
    criterionVersionNo: criterion.version,
    changedAt: breach.changedAt,
    verifiedAt: verification.executedAt,
    ageDays,
    klass: classifyPerforation({
      ageDays,
      changeCount: countChanges(criterion, versions),
      reverified: false,
    }),
    state: 'reopened',
  };
}

/**
 * Le changement qui avait percé la maille avant que le texte ne revienne à
 * l'identique de la version vérifiée. `null` si le texte n'a jamais bougé.
 */
function breachAfterRestore(
  versions: readonly CriterionVersion[],
  verifiedHash: string,
  currentVersion: number,
): CriterionVersion | null {
  const carriers = versions
    .filter((version) => version.textHash === verifiedHash && version.versionNo < currentVersion)
    .sort((left, right) => left.versionNo - right.versionNo);
  if (carriers.length === 0) return null;
  const carrier = carriers[0];
  const breaches = versions.filter(
    (version) =>
      version.textHash !== verifiedHash &&
      version.versionNo > carrier.versionNo &&
      version.versionNo < currentVersion,
  );
  if (breaches.length === 0) return null;
  return breaches.reduce((latest, version) =>
    version.versionNo > latest.versionNo ? version : latest,
  );
}

/**
 * Nombre de modifications du critère : les versions `edited` et `restored` de
 * son historique, ou son numéro de version quand l'historique n'est pas lu.
 */
export function countChanges(
  criterion: Criterion,
  versions: readonly CriterionVersion[],
): number {
  const counted = versions.filter(
    (version) => version.changeKind === 'edited' || version.changeKind === 'restored',
  ).length;
  return Math.max(counted, Math.max(0, criterion.version - 1));
}

/** Les plus anciennes perforations d'abord : c'est l'ordre d'action du registre. */
function oldestChangeFirst(left: Perforation, right: Perforation): number {
  return left.changedAt.localeCompare(right.changedAt) || left.id.localeCompare(right.id);
}
