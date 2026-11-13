/**
 * Conversion **pure** des objets du graphe en actes de vérification
 * (`GraphObject → Verification`), et lecture des nœuds bruts du graphe.
 *
 * Trois règles du cahier des charges sont appliquées ici, pas ailleurs :
 * - §7 — la forme de l'acte vient du type d'objet ; la force vient de
 *   `DEFAULT_STRENGTH_BY_FORM` (src/defaults.ts), jamais d'une valeur écrite
 *   en dur dans ce fichier ;
 * - §7 / §22 — un objet **sans date ou sans nom** est écarté et journalisé :
 *   on n'invente jamais un acte de vérification ;
 * - §18 — une preuve est **référencée**, jamais recopiée.
 *
 * Module **pur** : ni réseau, ni horloge, ni Forge. Les tests s'exécutent
 * sans rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { GraphObject } from '../ports';
import type { Strength, Verification, VerificationForm } from '../types';
import { DEFAULT_STRENGTH_BY_FORM } from '../defaults';
import { normalizeStatus } from './common';

/**
 * Ce qui est journalisé quand un objet est écarté. L'appel (src/ingest/graph.ts)
 * passe l'avertissement `deps`-style ; ici on ne fait que le décrire.
 */
export type GraphReport = (message: string, meta?: unknown) => void;

/** Les options de la conversion : quoi journaliser, et c'est tout. */
export interface GraphMappingOptions {
  /** Journal des objets écartés ; absent = aucun journal. */
  readonly report?: GraphReport;
}

/**
 * La forme d'acte d'un type d'objet du graphe (§7).
 *
 * - `test-execution` / `test-run` : un test automatisé **exécuté** ⇒ forme 1,
 *   force **machine** (la seule force qui prouve, §4) ;
 * - `deployment` : une preuve de déploiement ⇒ forme 6, force déclarée ;
 * - `pull-request` : une revue de code ⇒ forme 4, force déclarée (une revue ne
 *   prouve pas un comportement) ;
 * - `work-item`, `commit`, `test-plan`, `test-status` : **ne sont pas** des
 *   actes de vérification. Le `test-status` est joint à son exécution, le
 *   `work-item` est le ticket porteur : les compter serait gonfler la
 *   couverture (§5, §22).
 */
const FORM_BY_GRAPH_TYPE: Readonly<Record<string, VerificationForm>> = {
  'test-execution': 'automated-test',
  'test-run': 'automated-test',
  deployment: 'deployment',
  'pull-request': 'code-review',
};

/** La forme d'acte d'un type d'objet ; `undefined` si ce type n'est pas un acte. */
export function formOf(objectType: string): VerificationForm | undefined {
  return FORM_BY_GRAPH_TYPE[objectType];
}

/** Un identifiant d'acte stable : la même exécution donne toujours le même acte. */
function actId(objectType: string, id: string): string {
  const slug = `${objectType}_${id}`.replace(/[^A-Za-z0-9_-]+/g, '_');
  return `ver_${slug}`;
}

/** Le premier texte non vide parmi plusieurs noms de champs possibles. */
function firstText(source: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

/**
 * Convertit un objet du graphe en acte de vérification, ou `null` :
 * - `null` quand le type d'objet n'est pas un acte (rien à journaliser) ;
 * - `null` + journal quand l'objet n'a **pas de nom** ou **pas de date** :
 *   un acte sans date ne peut pas servir à détecter une perforation (§8.2) et
 *   un acte sans nom n'est pas identifiable (§18).
 */
export function toVerification(
  object: GraphObject,
  options: GraphMappingOptions = {},
): Verification | null {
  const form = formOf(object.objectType);
  if (!form) return null;
  const raw = object.raw ?? {};
  const name = object.name?.trim() ?? '';
  if (name.length === 0) {
    options.report?.('acte écarté : nom manquant', { id: object.id, type: object.objectType });
    return null;
  }
  const executedAt = object.at?.trim() ?? '';
  if (executedAt.length === 0) {
    options.report?.('acte écarté : date d’exécution manquante', {
      id: object.id,
      type: object.objectType,
    });
    return null;
  }
  const status = normalizeStatus(object.status);
  const strength: Strength = DEFAULT_STRENGTH_BY_FORM[form];
  const ticketKey = firstText(raw, ['ticketKey', 'workItemKey', 'key']);
  const artifactRef = firstText(raw, ['artifactRef', 'url', 'link']);
  const authorRef = firstText(raw, ['authorRef', 'authorId']);
  return {
    id: actId(object.objectType, object.id),
    form,
    sourceSystem: 'teamwork-graph',
    sourceRef: `${object.objectType}/${object.id}`,
    issueId: object.workItemId,
    ticketKey,
    name,
    executedAt,
    status,
    strength,
    artifactRef,
    authorRef,
    disabledAt: status === 'ignored' ? executedAt : undefined,
    zone: object.zone ?? object.repository,
  };
}

/**
 * Convertit une liste d'objets du graphe : les objets écartés disparaissent,
 * les autres sont des actes. La liste renvoyée ne contient jamais d'acte
 * inventé.
 */
export function toVerifications(
  objects: readonly GraphObject[],
  options: GraphMappingOptions = {},
): Verification[] {
  const acts: Verification[] = [];
  for (const object of objects) {
    const act = toVerification(object, options);
    if (act) acts.push(act);
  }
  return acts;
}

/* ------------------------------------------------- lecture des nœuds bruts */

/** Un nœud brut du graphe : la forme est ouverte, la lecture est tolérante. */
type RawNode = Record<string, unknown>;

/** Le premier texte non vide d'un objet imbriqué (`node.workItem.id`). */
function nestedText(node: RawNode, parent: string, key: string): string | undefined {
  const holder = node[parent];
  if (!holder || typeof holder !== 'object') return undefined;
  const value = (holder as RawNode)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** Convertit un nœud brut en `GraphObject` (lecture tolérante, jamais d'erreur). */
export function fromGraphNode(node: unknown, objectType: string): GraphObject | null {
  if (!node || typeof node !== 'object') return null;
  const raw = node as RawNode;
  const id = firstText(raw, ['id', 'key', 'identifier']);
  if (!id) return null;
  return {
    objectType,
    id,
    name: firstText(raw, ['name', 'title', 'summary', 'displayName']),
    status: firstText(raw, ['status', 'statusName', 'state', 'result']),
    at: firstText(raw, [
      'at',
      'date',
      'executedAt',
      'completedAt',
      'mergedAt',
      'deployedAt',
      'createdAt',
      'updatedAt',
    ]),
    workItemId: firstText(raw, ['workItemId']) ?? nestedText(raw, 'workItem', 'id'),
    testPlanId: firstText(raw, ['testPlanId']) ?? nestedText(raw, 'testPlan', 'id'),
    repository: firstText(raw, ['repository', 'repositoryName', 'repo']),
    zone: firstText(raw, ['zone', 'service']) ?? nestedText(raw, 'softwareService', 'name'),
    raw,
  };
}

/** Convertit une liste de nœuds bruts en objets du graphe. */
export function fromGraphNodes(nodes: readonly unknown[], objectType: string): GraphObject[] {
  const objects: GraphObject[] = [];
  for (const node of nodes) {
    const object = fromGraphNode(node, objectType);
    if (object) objects.push(object);
  }
  return objects;
}
