/**
 * Les fils détendus (§8.3) — des actes de vérification qui ne couvrent plus rien.
 *
 * Un fil détendu donne un confort vide : la maille existe encore dans les
 * données, mais elle ne prouve plus rien. Ces fils sont comptés, listés, et
 * **retirés de la couverture** (§8.3) — c'est ce qui rend la mesure honnête :
 * pas de couverture qui ne peut que monter.
 *
 * Raisons (§8.3) :
 *  - `test-disabled` : l'acte est désactivé (`disabledAt`) ou son statut est
 *    `ignored` / `skipped` ;
 *  - `criterion-deleted` : le critère visé a été supprimé ou renuméroté
 *    (`deletedAt` renseigné) ;
 *  - `test-renamed` : l'acte a été renommé — sa référence source ne désigne
 *    plus le nom de l'acte, le lien pointe vers un nom qui n'existe plus ;
 *  - `build-not-running` : le build ne tourne plus (source `pipeline`, statut
 *    inconnu).
 *
 * Chaque fil porte son **impact** : le nombre de mailles qu'il retire. C'est ce
 * chiffre qui fait baisser la couverture affichée (§8.3, §24.5).
 *
 * Périmètre de ce socle : la zone « n'est plus buildée » demande la liste des
 * zones construites (Bitbucket), qui n'est pas dans l'entrée ; on se limite
 * donc aux trois premières raisons et au cas explicite `status: 'unknown'`.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type {
  Criterion,
  Dangling,
  DanglingReason,
  Link,
  Verification,
} from '../types';
import { isMesh } from './perforations';

/** Ce que le jugement a besoin de lire — rien de plus. */
export interface DanglingInput {
  verifications: readonly Verification[];
  links: readonly Link[];
  criteria: readonly Criterion[];
  /** La date de détection : jamais de l'horloge système. */
  now: string;
}

/** Extensions de code : `WeaveTest.java` se compare à `WeaveTest`. */
const CODE_EXTENSIONS = [
  'java',
  'kt',
  'kts',
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'go',
  'rb',
  'cs',
  'php',
  'scala',
  'rs',
  'cpp',
  'feature',
  'spec',
];

/**
 * Les fils détendus d'un périmètre, avec la raison et l'impact.
 *
 * Seuls les actes qui portaient au moins une maille sont concernés : un test
 * qui n'a jamais rien couvert est un test orphelin (§32.1), pas un fil détendu.
 */
export function detectDangling(input: DanglingInput): Dangling[] {
  const criteria = new Map(input.criteria.map((one) => [one.id, one]));
  const verifications = new Map(input.verifications.map((one) => [one.id, one]));
  const dangling: Dangling[] = [];
  for (const [verificationId, meshes] of meshesByVerification(input.links)) {
    const verification = verifications.get(verificationId);
    if (verification === undefined) continue;
    const reason = detectReason(verification, meshes, criteria);
    if (reason === null) continue;
    dangling.push({
      id: `dang_${verification.id}`,
      verificationId: verification.id,
      verificationName: verification.name,
      reason,
      detectedAt: input.now,
      impact: countImpact(reason, meshes, criteria),
      state: 'open',
    });
  }
  return dangling.sort(largestImpactFirst);
}

/** Les mailles de chaque acte : les liaisons non rejetées qui le désignent. */
function meshesByVerification(links: readonly Link[]): Map<string, Link[]> {
  const grouped = new Map<string, Link[]>();
  for (const link of links) {
    // Une liaison rejetée n'est pas une maille, et une proposition (liaison
    // dérivée sous le seuil) ne retire aucune couverture (§9.2).
    if (link.rejectedAt !== undefined || !isMesh(link)) continue;
    const meshes = grouped.get(link.verificationId) ?? [];
    meshes.push(link);
    grouped.set(link.verificationId, meshes);
  }
  return grouped;
}

/** La raison du fil détendu, ou `null` si l'acte couvre encore quelque chose. */
function detectReason(
  verification: Verification,
  meshes: readonly Link[],
  criteria: Map<string, Criterion>,
): DanglingReason | null {
  if (isDisabled(verification)) return 'test-disabled';
  if (hasDeletedCriterion(meshes, criteria)) return 'criterion-deleted';
  if (isRenamed(verification)) return 'test-renamed';
  if (isBuildNotRunning(verification)) return 'build-not-running';
  return null;
}

/** Un acte désactivé, ignoré ou sauté ne prouve plus rien (§8.3). */
function isDisabled(verification: Verification): boolean {
  return (
    verification.disabledAt !== undefined ||
    verification.status === 'ignored' ||
    verification.status === 'skipped'
  );
}

/** Le critère visé a été supprimé ou renuméroté (§8.3, §23). */
function hasDeletedCriterion(
  meshes: readonly Link[],
  criteria: Map<string, Criterion>,
): boolean {
  return meshes.some((mesh) => isDeleted(criteria.get(mesh.criterionId)));
}

/** Un critère supprimé porte sa date de suppression (§23). */
function isDeleted(criterion: Criterion | undefined): boolean {
  return criterion !== undefined && criterion.deletedAt !== undefined;
}

/**
 * Un acte renommé : sa référence source ne désigne plus son nom (§8.3).
 *
 * La source connaît le nom au moment de l'acte ; l'acte connaît son nom
 * courant. Quand les deux divergent, le lien pointe vers un nom qui n'existe
 * plus. Les identifiants opaques (`test-execution/1234`) ne disent rien du nom
 * : ils ne sont jamais pris pour un renommage.
 */
function isRenamed(verification: Verification): boolean {
  const leaf = sourceLeaf(verification.sourceRef);
  if (leaf === null) return false;
  const base = stripCodeExtension(leaf);
  if (base.length < 3 || !/[a-z]/i.test(base)) return false;
  const name = verification.name;
  if (name.length === 0) return false;
  return !name.includes(base) && !base.includes(name);
}

/** La dernière partie d'une référence source : le nom que la source désigne. */
function sourceLeaf(sourceRef: string): string | null {
  const withoutAnchor = sourceRef.split('#')[0];
  const segments = withoutAnchor.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) return null;
  const leaf = segments[segments.length - 1];
  // Sans point, c'est un identifiant opaque : il ne parle pas du nom.
  return leaf.includes('.') ? leaf : null;
}

/** Retire l'extension de code : `WeaveTest.java` devient `WeaveTest`. */
function stripCodeExtension(leaf: string): string {
  const dot = leaf.lastIndexOf('.');
  if (dot <= 0) return leaf;
  const extension = leaf.slice(dot + 1).toLowerCase();
  return CODE_EXTENSIONS.includes(extension) ? leaf.slice(0, dot) : leaf;
}

/**
 * Le build ne tourne plus : l'acte vient d'une `pipeline` et n'a ni réussi ni
 * échoué, ou son statut est explicitement inconnu (§8.3).
 */
function isBuildNotRunning(verification: Verification): boolean {
  if (
    verification.sourceSystem === 'pipeline' &&
    verification.status !== 'passed' &&
    verification.status !== 'failed'
  ) {
    return true;
  }
  return verification.status === 'unknown';
}

/**
 * Le nombre de mailles que le fil détendu retire de la couverture (§8.3).
 *
 * Un acte mort retire toutes ses mailles ; un critère supprimé ne retire que
 * la sienne — l'acte peut continuer de couvrir les autres.
 */
function countImpact(
  reason: DanglingReason,
  meshes: readonly Link[],
  criteria: Map<string, Criterion>,
): number {
  if (reason !== 'criterion-deleted') return meshes.length;
  return meshes.filter((mesh) => isDeleted(criteria.get(mesh.criterionId))).length;
}

/** Les fils qui font le plus baisser la couverture d'abord. */
function largestImpactFirst(left: Dangling, right: Dangling): number {
  return right.impact - left.impact || left.id.localeCompare(right.id);
}
