/**
 * Les requêtes du Teamwork Graph (§10, §18, §21).
 *
 * **Pourquoi des constantes documentées et pas des chaînes au fil de l'eau** :
 * le Cypher brut est refusé aux nouvelles applications (§21) ; on utilise donc
 * soit une requête **prête à l'emploi** (GraphQL), soit une requête
 * **persistée** dont l'identifiant est écrit ici, une fois, avec ce qu'elle
 * lit, le droit qu'elle exige et ce qui se passe quand ce droit manque.
 *
 * La règle de lecture du §18 vaut pour toutes ces requêtes :
 * > un droit manquant **vide le résultat sans erreur**.
 *
 * Aucune de ces requêtes ne lève : le transport (src/ingest/graph.ts) traduit
 * un 403 en « pas de droit » et le résultat est vide, avec une absence
 * déclarée (§22). Le graphe ne sert donc jamais à inventer un trou : il sert
 * à dire ce que Trame a réellement vu.
 *
 * Module **pur** : aucune constante n'est exécutée ici, aucune n'est
 * exécutable sans le transport — les tests n'ont donc jamais besoin du réseau.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ScopeRef } from '../types.js';

/** La façon dont les variables de la requête sont construites. */
export type GraphVariables = (scope: ScopeRef, since?: string) => Record<string, unknown>;

/**
 * Une requête du graphe, décrite pour être revue et pour être persistée.
 *
 * `mode` :
 * - `persisted-cypher` — la requête est **persistée** par l'équipe ; l'identifiant
 *   de la requête persistée est dans `query`, le Cypher à persister est dans
 *   `cypher` (le Cypher brut ne part jamais sur le réseau, §21) ;
 * - `graphql` — une requête **prête à l'emploi** de l'API GraphQL.
 */
export interface GraphQuerySpec {
  /** Le type d'objet lu par cette requête (§10). */
  readonly objectType: string;
  readonly mode: 'persisted-cypher' | 'graphql';
  /** Nom de l'opération GraphQL (débogage, traces). */
  readonly operationName: string;
  /** Corps GraphQL, ou identifiant de la requête persistée. */
  readonly query: string;
  /** Le Cypher à faire persister — documenté, jamais envoyé tel quel (§21). */
  readonly cypher: string;
  /** Le champ de la réponse qui porte les nœuds (`testExecutions.nodes`). */
  readonly resultField: string;
  /** Les droits (`graph:…`) que la lecture exige. */
  readonly requiredScopes: readonly string[];
  /** Ce que la requête lit — une phrase, pour le relecteur. */
  readonly reads: string;
  /** Ce qui se passe quand un des droits manque : résultat vide, sans erreur. */
  readonly onMissingRight: string;
  /** Construction des variables (périmètre, curseur `since`). */
  readonly variables: GraphVariables;
}

/**
 * Identifiants des requêtes persistées (§21).
 *
 * Le Cypher brut est refusé aux nouvelles applications : chaque requête doit
 * être **persistée** par l'équipe, puis son identifiant inscrit ici. Les
 * placeholders ci-dessous sont donc volontairement invalides : tant qu'ils ne
 * sont pas remplacés, la lecture échoue proprement (résultat vide + absence
 * déclarée) au lieu de lire un objet par accident.
 */
export const PERSISTED_QUERY_IDS = {
  'test-execution': 'ari:cloud:ecosystem::graph/replace-me-test-execution',
  'test-run': 'ari:cloud:ecosystem::graph/replace-me-test-run',
  'work-item': 'ari:cloud:ecosystem::graph/replace-me-work-item',
  commit: 'ari:cloud:ecosystem::graph/replace-me-commit',
  'pull-request': 'ari:cloud:ecosystem::graph/replace-me-pull-request',
  deployment: 'ari:cloud:ecosystem::graph/replace-me-deployment',
} as const;

/** Nombre d'objets lus au plus par page : une lecture n'est jamais ouverte. */
export const GRAPH_PAGE_SIZE = 50;

/* ------------------------------------------------------------------ requêtes */

/**
 * `test-execution` d'un périmètre, avec leur `test-status` et leur date.
 *
 * - **lit** : les exécutions de test du périmètre (`scope.scope`), leur statut
 *   (`test-status` joint dans la même requête), la date d'exécution, le
 *   `work-item` lié et le dépôt/la zone ;
 * - **exige** : `graph:test-execution` (droit de lecture des exécutions) et
 *   `graph:test-status` (droit de lecture des statuts) ;
 * - **droit manquant** : résultat **vide, sans erreur** — la sonde (§18) le
 *   déclare `no-right` et aucun trou n'est attribué à ce motif (§24.15).
 */
export const TEST_EXECUTIONS_QUERY: GraphQuerySpec = {
  objectType: 'test-execution',
  mode: 'persisted-cypher',
  operationName: 'TrameTestExecutions',
  query: PERSISTED_QUERY_IDS['test-execution'],
  cypher:
    'MATCH (e:TestExecution)-[:HAS_STATUS]->(s:TestStatus) ' +
    'WHERE e.scope = $scope AND ($since IS NULL OR e.executedAt >= $since) ' +
    'RETURN e.id AS id, e.name AS name, s.name AS status, e.executedAt AS at, ' +
    'e.workItemId AS workItemId, e.testPlanId AS testPlanId, ' +
    'e.repository AS repository, e.zone AS zone LIMIT $limit',
  resultField: 'testExecutions',
  requiredScopes: ['graph:test-execution', 'graph:test-status'],
  reads: 'les exécutions de test du périmètre, leur statut et leur date',
  onMissingRight: 'résultat vide, sans erreur — la sonde déclare « pas de droit »',
  variables: (scope, since) => ({
    scope: scope.scope,
    since: since ?? null,
    limit: GRAPH_PAGE_SIZE,
  }),
};

/**
 * `test-run` d'un `test-plan` : le plan donne le périmètre (§10).
 *
 * - **lit** : les exécutions d'un plan de test, leur statut et leur date ;
 * - **exige** : `graph:test-run` (et `graph:test-plan` pour résoudre le plan) ;
 * - **droit manquant** : résultat **vide, sans erreur** ; le périmètre couvert
 *   par ce plan est alors déclaré « non vu », jamais « sans test » (§22).
 */
export const TEST_RUNS_QUERY: GraphQuerySpec = {
  objectType: 'test-run',
  mode: 'persisted-cypher',
  operationName: 'TrameTestRuns',
  query: PERSISTED_QUERY_IDS['test-run'],
  cypher:
    'MATCH (r:TestRun)-[:HAS_STATUS]->(s:TestStatus) ' +
    'WHERE r.testPlanId = $planId AND ($since IS NULL OR r.executedAt >= $since) ' +
    'RETURN r.id AS id, r.name AS name, s.name AS status, r.executedAt AS at, ' +
    'r.workItemId AS workItemId, r.testPlanId AS testPlanId, ' +
    'r.repository AS repository, r.zone AS zone LIMIT $limit',
  resultField: 'testRuns',
  requiredScopes: ['graph:test-run', 'graph:test-plan', 'graph:test-status'],
  reads: 'les exécutions d’un plan de test, leur statut et leur date',
  onMissingRight: 'résultat vide, sans erreur — le périmètre du plan est déclaré « non vu »',
  variables: (scope, since) => ({
    planId: scope.scope,
    since: since ?? null,
    limit: GRAPH_PAGE_SIZE,
  }),
};

/**
 * `work-item` liés : le ticket porteur du critère (§10).
 *
 * - **lit** : les éléments de travail attachés aux exécutions du périmètre,
 *   avec leur clé lisible (`PROJ-12`) ;
 * - **exige** : `graph:work-item` ;
 * - **droit manquant** : résultat **vide, sans erreur** — les actes gardent
 *   alors une référence mais **sans ticket rattaché**, ce qui est dit.
 */
export const WORK_ITEMS_QUERY: GraphQuerySpec = {
  objectType: 'work-item',
  mode: 'persisted-cypher',
  operationName: 'TrameWorkItems',
  query: PERSISTED_QUERY_IDS['work-item'],
  cypher:
    'MATCH (w:WorkItem) WHERE w.scope = $scope ' +
    'RETURN w.id AS id, w.key AS name, w.status AS status, w.updatedAt AS at, ' +
    'w.ticketKey AS ticketKey LIMIT $limit',
  resultField: 'workItems',
  requiredScopes: ['graph:work-item'],
  reads: 'les éléments de travail du périmètre, avec leur clé lisible',
  onMissingRight: 'résultat vide, sans erreur — les actes sont enregistrés sans ticket rattaché',
  variables: (scope, since) => ({
    scope: scope.scope,
    since: since ?? null,
    limit: GRAPH_PAGE_SIZE,
  }),
};

/**
 * `commit` d'un dépôt : l'historique du code, sans preuve (§10).
 *
 * - **lit** : les commits du dépôt, leur auteur (piste d'audit, jamais un
 *   score, §5) et leur date ;
 * - **exige** : `graph:commit` ;
 * - **droit manquant** : résultat **vide, sans erreur**.
 */
export const COMMITS_QUERY: GraphQuerySpec = {
  objectType: 'commit',
  mode: 'persisted-cypher',
  operationName: 'TrameCommits',
  query: PERSISTED_QUERY_IDS.commit,
  cypher:
    'MATCH (c:Commit) WHERE c.repository = $repository ' +
    'AND ($since IS NULL OR c.committedAt >= $since) ' +
    'RETURN c.id AS id, c.summary AS name, c.state AS status, c.committedAt AS at, ' +
    'c.repository AS repository, c.zone AS zone, c.authorId AS authorRef LIMIT $limit',
  resultField: 'commits',
  requiredScopes: ['graph:commit'],
  reads: 'les commits du dépôt, leur date et leur auteur (audit seul)',
  onMissingRight: 'résultat vide, sans erreur',
  variables: (scope, since) => ({
    repository: scope.scope,
    since: since ?? null,
    limit: GRAPH_PAGE_SIZE,
  }),
};

/**
 * `pull-request` d'un dépôt : une revue de code est un acte **déclaré** (§7
 * forme 4), jamais une preuve.
 *
 * - **lit** : les pull requests du dépôt, leur titre, leur description (donc les
 *   mentions `AC-3` et `PROJ-12`) et leur date de fusion ;
 * - **exige** : `graph:pull-request` ;
 * - **droit manquant** : résultat **vide, sans erreur**.
 */
export const PULL_REQUESTS_QUERY: GraphQuerySpec = {
  objectType: 'pull-request',
  mode: 'persisted-cypher',
  operationName: 'TramePullRequests',
  query: PERSISTED_QUERY_IDS['pull-request'],
  cypher:
    'MATCH (p:PullRequest) WHERE p.repository = $repository ' +
    'AND ($since IS NULL OR p.mergedAt >= $since) ' +
    'RETURN p.id AS id, p.title AS name, p.state AS status, p.mergedAt AS at, ' +
    'p.repository AS repository, p.zone AS zone, p.authorId AS authorRef LIMIT $limit',
  resultField: 'pullRequests',
  requiredScopes: ['graph:pull-request'],
  reads: 'les pull requests du dépôt, leur titre, leur description et leur date de fusion',
  onMissingRight: 'résultat vide, sans erreur',
  variables: (scope, since) => ({
    repository: scope.scope,
    since: since ?? null,
    limit: GRAPH_PAGE_SIZE,
  }),
};

/**
 * `deployment` : une preuve de déploiement est un acte **déclaré** (§7
 * forme 6).
 *
 * - **lit** : les déploiements du périmètre, leur version et leur date ;
 * - **exige** : `graph:deployment` ;
 * - **droit manquant** : résultat **vide, sans erreur**.
 */
export const DEPLOYMENTS_QUERY: GraphQuerySpec = {
  objectType: 'deployment',
  mode: 'persisted-cypher',
  operationName: 'TrameDeployments',
  query: PERSISTED_QUERY_IDS.deployment,
  cypher:
    'MATCH (d:Deployment) WHERE d.scope = $scope ' +
    'AND ($since IS NULL OR d.deployedAt >= $since) ' +
    'RETURN d.id AS id, d.version AS name, d.state AS status, d.deployedAt AS at, ' +
    'd.workItemId AS workItemId, d.zone AS zone LIMIT $limit',
  resultField: 'deployments',
  requiredScopes: ['graph:deployment'],
  reads: 'les déploiements du périmètre, leur version et leur date',
  onMissingRight: 'résultat vide, sans erreur',
  variables: (scope, since) => ({
    scope: scope.scope,
    since: since ?? null,
    limit: GRAPH_PAGE_SIZE,
  }),
};

/** Toutes les requêtes, par type d'objet lu. */
export const GRAPH_QUERIES: Readonly<Record<string, GraphQuerySpec>> = {
  'test-execution': TEST_EXECUTIONS_QUERY,
  'test-run': TEST_RUNS_QUERY,
  'work-item': WORK_ITEMS_QUERY,
  commit: COMMITS_QUERY,
  'pull-request': PULL_REQUESTS_QUERY,
  deployment: DEPLOYMENTS_QUERY,
};

/** La requête d'un type d'objet ; `undefined` si Trame ne lit pas ce type. */
export function graphQueryFor(objectType: string): GraphQuerySpec | undefined {
  return GRAPH_QUERIES[objectType];
}

/* --------------------------------------------------------------- cas de sonde */

/**
 * Un cas dont la réponse est **connue** : sans lui, l'app ne peut pas
 * distinguer « pas de droit » de « pas de données » (§18, §22).
 *
 * Le cas est renseigné avec le jeu de démonstration (§26) : un projet semé
 * dont Trame connaît le contenu. Tant qu'un cas n'est pas configuré, la sonde
 * ne suppose rien : elle se contente du verdict du transport (403 ⇒ pas de
 * droit, 200 ⇒ le droit existe) et le dit.
 */
export interface GraphProbeCase {
  /** Le type d'objet sondé. */
  readonly objectType: string;
  /** La référence de l'objet dont la présence est connue (`id`). */
  readonly probeRef: string;
  /** Le périmètre de la sonde. */
  readonly scope: ScopeRef;
  /** Ce que la sonde attend quand le droit existe. */
  readonly expected: 'present' | 'empty';
}

/** Les cas de sonde du jeu de démonstration (§26) — à compléter par l'équipe. */
export const GRAPH_PROBE_CASES: readonly GraphProbeCase[] = [
  {
    objectType: 'test-execution',
    probeRef: '',
    scope: { scopeType: 'project', scope: '' },
    expected: 'present',
  },
];

/** Le cas de sonde d'un type d'objet ; `undefined` s'il n'est pas configuré. */
export function probeCaseFor(objectType: string): GraphProbeCase | undefined {
  return GRAPH_PROBE_CASES.find((probe) => probe.objectType === objectType);
}
