/**
 * La trame — le calcul de couverture, en pur (§8.1).
 *
 * Une couverture est **toujours décomposée sur trois axes qui ne se fusionnent
 * jamais** (§8.1, §22) :
 *
 *  - la **force** : machine / attestée / déclarée ;
 *  - le **type de liaison** : déclarée / confirmée / dérivée ;
 *  - la **fraîcheur** : à jour / périmée.
 *
 * Règles d'honnêteté appliquées ici (§22) :
 *
 *  - le dénominateur compte les critères **vérifiables** seulement ; un critère
 *    infalsifiable (§8.4) n'est ni un trou ni une couverture : il est compté à
 *    part (`unfalsifiableCount`) ;
 *  - la couverture **provisoire** (liaison dérivée au-dessus du seuil) vit sur
 *    sa propre ligne et n'entre jamais dans la couverture déclarée (§9.2) ;
 *  - un lien rejeté, un acte désactivé ou un fil détendu **retire** la
 *    couverture : le chiffre peut donc baisser (§8.3, §24.5) ;
 *  - les angles morts de l'app (`no-right`, `no-data`) sont reportés tels
 *    quels, jamais convertis en trous du projet (§22, §24.15) ;
 *  - **aucun pourcentage** ici : ce sont des effectifs. Les pourcentages se
 *    calculent au moment de l'affichage (`percent.ts`, §12.4).
 *
 * Le module est pur : aucun `@forge/*`, aucune horloge — la date vient de
 * l'entrée (`computedAt`).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type {
  BlindSpot,
  Coverage,
  Criterion,
  Dangling,
  Link,
  LinkKind,
  Perforation,
  ScopeType,
  Strength,
  Verification,
} from '../types.js';
import { DERIVED_LINK_THRESHOLD, STRENGTH_RANK } from '../defaults.js';

/* ------------------------------------------------------------------ entrée */

/** Tout ce qu'il faut pour calculer une trame — et rien de plus. */
export interface CoverageInput {
  criteria: readonly Criterion[];
  verifications: readonly Verification[];
  links: readonly Link[];
  /** Perforations déjà détectées : elles sont comptées, pas recalculées. */
  perforations?: readonly Perforation[];
  /** Fils détendus : un fil ouvert retire la couverture de son acte. */
  dangling?: readonly Dangling[];
  /** Absences reçues : reportées telles quelles, jamais des trous (§22). */
  blindSpots?: readonly BlindSpot[];
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
}

/* ----------------------------------------------------------------- interne */

/** Un maillon retenu : la rencontre vivante d'un critère et d'un acte. */
interface Mesh {
  criterion: Criterion;
  link: Link;
  verification: Verification;
}

/** L'état de couverture d'un critère, décomposé sur les trois axes. */
interface CriterionCover {
  /** La force la plus forte qui couvre le critère. */
  strength: Strength;
  /** Le type de liaison le plus sûr qui couvre le critère. */
  linkKind: LinkKind;
  /** Le critère n'a pas changé depuis le tissage (§8.2). */
  fresh: boolean;
  /** Une preuve forte (machine ou attestée) couvre le critère. */
  strong: boolean;
  /** La liaison est déclarée ou confirmée, jamais dérivée. */
  declared: boolean;
}

/** Les trois axes et les deux lignes de couverture (§8.1). */
interface Axes {
  byStrength: { machine: number; attested: number; declared: number };
  byLink: { declared: number; confirmed: number; derived: number };
  byFreshness: { current: number; stale: number };
  coveredDeclared: number;
  coveredProvisional: number;
  proven: number;
}

/** Les liaisons se classent : une confirmée vaut plus qu'une dérivée. */
const LINK_RANK: Record<LinkKind, number> = { confirmed: 3, declared: 2, derived: 1 };

/* ------------------------------------------------------------------ calcul */

/**
 * Calcule la trame d'un périmètre (§8.1).
 *
 * L'unité de compte est le **critère** (le fil de chaîne) : une maille ne
 * couvre qu'un critère, un critère couvert par trois actes reste couvert une
 * fois. Le dénominateur est donc toujours comparable au numérateur.
 */
export function computeCoverage(input: CoverageInput): Coverage {
  const criteria = aliveCriteria(input.criteria);
  const falsifiable = criteria.filter((criterion) => criterion.falsifiable);
  const meshes = collectMeshes(input, falsifiable);
  const covered = coveredCovers(falsifiable, meshes);
  const axes = countAxes(covered);
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    criteriaTotal: falsifiable.length,
    criteriaFalsifiable: falsifiable.length,
    unfalsifiableCount: criteria.length - falsifiable.length,
    byStrength: axes.byStrength,
    byLink: axes.byLink,
    byFreshness: axes.byFreshness,
    coveredDeclared: axes.coveredDeclared,
    coveredProvisional: axes.coveredProvisional,
    holes: falsifiable.length - covered.length,
    dangling: input.dangling?.length ?? 0,
    perforations: input.perforations?.length ?? 0,
    proven: axes.proven,
    blindSpots: [...(input.blindSpots ?? [])],
  };
}

/** Un critère supprimé sort du périmètre ; son histoire reste (pas ici). */
function aliveCriteria(criteria: readonly Criterion[]): Criterion[] {
  return criteria.filter((criterion) => !criterion.deletedAt);
}

/** Les fils détendus encore ouverts : ce sont eux qui retirent la couverture. */
function openDanglingIds(dangling: readonly Dangling[]): Set<string> {
  const ids = new Set<string>();
  for (const thread of dangling) {
    if (thread.state === 'open') ids.add(thread.verificationId);
  }
  return ids;
}

/** Un lien est retenu s'il n'est ni rejeté, ni porté par un acte mort (§9, §8.3). */
function isUsableLink(
  link: Link,
  verification: Verification,
  danglingIds: ReadonlySet<string>,
): boolean {
  if (link.rejectedAt) return false;
  if (verification.disabledAt) return false;
  if (danglingIds.has(verification.id)) return false;
  if (link.kind === 'derived') return link.confidence >= DERIVED_LINK_THRESHOLD;
  return true;
}

/** Les mailles vivantes : critère vérifiable × lien retenu. */
function collectMeshes(input: CoverageInput, falsifiable: readonly Criterion[]): Mesh[] {
  const criterionById = new Map(falsifiable.map((criterion) => [criterion.id, criterion]));
  const verificationById = new Map(input.verifications.map((row) => [row.id, row]));
  const danglingIds = openDanglingIds(input.dangling ?? []);
  const meshes: Mesh[] = [];
  for (const link of input.links) {
    const criterion = criterionById.get(link.criterionId);
    const verification = verificationById.get(link.verificationId);
    if (!criterion || !verification) continue;
    if (!isUsableLink(link, verification, danglingIds)) continue;
    meshes.push({ criterion, link, verification });
  }
  return meshes;
}

/** Les mailles regroupées par critère couvert. */
function groupByCriterion(meshes: readonly Mesh[]): Map<string, Mesh[]> {
  const grouped = new Map<string, Mesh[]>();
  for (const mesh of meshes) {
    const own = grouped.get(mesh.criterion.id);
    if (own) own.push(mesh);
    else grouped.set(mesh.criterion.id, [mesh]);
  }
  return grouped;
}

/** Un critère couvert : son état sur les trois axes. */
function coverOf(criterion: Criterion, meshes: readonly Mesh[]): CriterionCover {
  const strength = bestStrength(meshes);
  const linkKind = bestLinkKind(meshes);
  return {
    strength,
    linkKind,
    fresh: meshes.some((mesh) => mesh.link.criterionHashAtLink === criterion.textHash),
    strong: strength === 'machine' || strength === 'attested',
    declared: linkKind === 'declared' || linkKind === 'confirmed',
  };
}

/** La force la plus forte qui couvre le critère (machine > attestée > déclarée). */
function bestStrength(meshes: readonly Mesh[]): Strength {
  let best: Strength = 'declared';
  for (const mesh of meshes) {
    if (STRENGTH_RANK[mesh.verification.strength] > STRENGTH_RANK[best]) {
      best = mesh.verification.strength;
    }
  }
  return best;
}

/** Le type de liaison le plus sûr qui couvre le critère. */
function bestLinkKind(meshes: readonly Mesh[]): LinkKind {
  let best: LinkKind = 'derived';
  for (const mesh of meshes) {
    if (LINK_RANK[mesh.link.kind] > LINK_RANK[best]) best = mesh.link.kind;
  }
  return best;
}

/** Les critères couverts, dans l'ordre des critères vérifiables. */
function coveredCovers(
  criteria: readonly Criterion[],
  meshes: readonly Mesh[],
): CriterionCover[] {
  const grouped = groupByCriterion(meshes);
  const covers: CriterionCover[] = [];
  for (const criterion of criteria) {
    const own = grouped.get(criterion.id);
    if (!own || own.length === 0) continue;
    covers.push(coverOf(criterion, own));
  }
  return covers;
}

/**
 * Décompte les trois axes et les deux lignes de couverture.
 * Chaque axe décompose **le même ensemble** de critères couverts : un critère
 * y figure une fois, jamais deux (§24.3).
 */
function countAxes(covered: readonly CriterionCover[]): Axes {
  const axes: Axes = {
    byStrength: { machine: 0, attested: 0, declared: 0 },
    byLink: { declared: 0, confirmed: 0, derived: 0 },
    byFreshness: { current: 0, stale: 0 },
    coveredDeclared: 0,
    coveredProvisional: 0,
    proven: 0,
  };
  for (const cover of covered) {
    axes.byStrength[cover.strength] += 1;
    axes.byLink[cover.linkKind] += 1;
    axes.byFreshness[cover.fresh ? 'current' : 'stale'] += 1;
    if (cover.declared) axes.coveredDeclared += 1;
    else axes.coveredProvisional += 1;
    if (cover.strong && cover.fresh && cover.declared) axes.proven += 1;
  }
  return axes;
}
