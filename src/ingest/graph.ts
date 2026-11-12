/**
 * Adaptateur Teamwork Graph — lecture réelle, transport injectable (§10, §18).
 *
 * Ce que fait cet adaptateur, et rien d'autre :
 * - il **exécute** la requête documentée du type d'objet demandé
 *   (src/ingest/graph-queries.ts : Cypher persisté ou requête prête à l'emploi,
 *   le Cypher brut est refusé aux nouvelles applications, §21) ;
 * - il **convertit** les nœuds bruts en objets du graphe, puis en actes de
 *   vérification (src/ingest/graph-mapping.ts) ;
 * - il **ne lève jamais** : un droit manquant ou une réponse illisible donne un
 *   résultat vide **et** une absence déclarée (§18, §22).
 *
 * La sonde (`probe`) distingue honnêtement deux cas qui se ressemblent :
 * - `no-right` — le droit manque : Trame **n'a pas regardé** ;
 * - `no-data` — le droit existe, il n'y a rien à lire.
 * Sans cette distinction, l'app afficherait des trous là où elle n'a simplement
 * pas regardé (§18, §23, §24.15).
 *
 * Le transport est **injectable** (comme `src/ingest/jira.ts` le fait déjà) :
 * les tests n'ont jamais besoin du réseau, et le format exact du Cypher
 * persisté — un point à valider du §21 — se règle dans un seul endroit.
 *
 * Signature exigée par src/deps.ts : `createGraphGateway(log)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import api from '@forge/api';
import type { Deps, GraphGateway, GraphObject, Logger, Scope } from '../ports.js';
import type { ScopeRef, Verification, VisibilityProbe } from '../types.js';
import { absentProbe, depsWarning, safe } from './common.js';
import { fromGraphNodes, toVerifications } from './graph-mapping.js';
import { graphQueryFor, probeCaseFor } from './graph-queries.js';
import type { GraphQuerySpec } from './graph-queries.js';

/** Détail de repli quand le transport n'est pas disponible. */
export const GRAPH_TRANSPORT_UNAVAILABLE = 'transport Teamwork Graph indisponible';

/** Ce que le transport rend au lecteur : des objets, ou la raison du vide. */
export type GraphTransportOutcome =
  | { readonly ok: true; readonly objects: readonly GraphObject[] }
  | {
      readonly ok: false;
      readonly reason: 'no-right' | 'unreadable';
      readonly detail: string;
    };

/** Ce que le transport doit savoir pour exécuter une requête. */
export interface GraphTransportRequest {
  readonly spec: GraphQuerySpec;
  readonly scope: ScopeRef;
  readonly since?: string;
}

/** Le transport : injectable, pour que les tests n'aient jamais le réseau. */
export type GraphTransport = (request: GraphTransportRequest) => Promise<GraphTransportOutcome>;

/** La forme d'une réponse GraphQL du graphe, lue avec indulgence. */
interface GraphPayload {
  data?: Record<string, { nodes?: unknown[] }>;
  errors?: { message?: string }[];
}

/** Un 401/403 est un droit manquant ; le reste est une réponse illisible. */
function classifyStatus(status: number): 'no-right' | 'unreadable' {
  return status === 401 || status === 403 ? 'no-right' : 'unreadable';
}

/** Une erreur GraphQL qui parle de permission vaut un droit manquant. */
function permissionError(payload: GraphPayload): string | undefined {
  for (const error of payload.errors ?? []) {
    const message = error.message ?? '';
    if (/permission|forbidden|not authorized|unauthoriz/i.test(message)) return message;
  }
  return undefined;
}

/** Les nœuds du champ attendu (`data.testExecutions.nodes`). */
function nodesOf(payload: GraphPayload, field: string): unknown[] {
  return payload.data?.[field]?.nodes ?? [];
}

/**
 * Le transport Forge : la lecture se fait **au nom d'un utilisateur** (§18) —
 * c'est l'utilisateur qui a les droits, pas l'app.
 */
export const forgeGraphTransport: GraphTransport = async (request) => {
  const { spec, scope, since } = request;
  const variables = spec.variables(scope, since);
  const response = await api.asUser().requestTeamworkGraph(
    spec.query,
    variables,
    spec.operationName,
  );
  if (!response.ok) {
    return {
      ok: false,
      reason: classifyStatus(response.status),
      detail: `HTTP ${response.status} sur ${spec.objectType}`,
    };
  }
  const payload = (await response.json()) as GraphPayload;
  const denied = permissionError(payload);
  if (denied) return { ok: false, reason: 'no-right', detail: denied };
  return { ok: true, objects: fromGraphNodes(nodesOf(payload, spec.resultField), spec.objectType) };
};

/** Les options de l'adaptateur : le journal et le transport. */
export interface GraphGatewayOptions {
  /** Journal des avertissements ; par défaut celui de `createGraphGateway`. */
  readonly log?: Logger;
  /** Transport injecté (tests) ; par défaut la lecture Forge. */
  readonly transport?: GraphTransport;
}

/**
 * La sonde honnête (§18) : un cas dont la réponse est connue.
 *
 * - le transport dit « pas de droit » → `no-right`, illisible : c'est un angle
 *   mort de Trame, pas un trou du projet ;
 * - le transport répond et la sonde ne trouve rien → `no-data` : le droit
 *   existe, il n'y a rien.
 */
async function probeWith(
  transport: GraphTransport,
  warn: (message: string, meta?: unknown) => void,
  objectType: string,
): Promise<VisibilityProbe> {
  const spec = graphQueryFor(objectType);
  if (!spec) {
    return absentProbe(objectType, `type d’objet non lu par Trame`, 'no-data');
  }
  const probeCase = probeCaseFor(objectType);
  const scope = probeCase?.scope ?? { scopeType: 'project' as const, scope: '' };
  const outcome = await safe(
    warn,
    `probe(${objectType})`,
    () => transport({ spec, scope }),
    { ok: false as const, reason: 'unreadable' as const, detail: GRAPH_TRANSPORT_UNAVAILABLE },
  );
  if (!outcome.ok) {
    return {
      objectType,
      absence: 'no-right',
      probeRef: probeCase?.probeRef ?? '',
      readable: false,
      detail: outcome.detail,
    };
  }
  const found = outcome.objects.length > 0;
  return {
    objectType,
    absence: found ? 'no-test' : 'no-data',
    probeRef: probeCase?.probeRef || outcome.objects[0]?.id || '',
    readable: true,
    detail: found
      ? `${outcome.objects.length} objet(s) lu(s) sur le cas sondé`
      : 'droit présent, aucun objet sur le cas sondé',
  };
}

/** Fabrique l'adaptateur ; le transport est injectable (tests hors réseau). */
export function createGraphGateway(log: Logger, options: GraphGatewayOptions = {}): GraphGateway {
  const warn = depsWarning(options.log ?? log, 'graph');
  const transport = options.transport ?? forgeGraphTransport;

  async function query(objectType: string, scope: ScopeRef, since?: string): Promise<GraphObject[]> {
    const spec = graphQueryFor(objectType);
    if (!spec) {
      warn(`query(${objectType}) : type d’objet non lu par Trame`);
      return [];
    }
    const outcome = await safe(
      warn,
      `query(${objectType})`,
      () => transport({ spec, scope, since }),
      { ok: false as const, reason: 'unreadable' as const, detail: GRAPH_TRANSPORT_UNAVAILABLE },
    );
    if (!outcome.ok) {
      warn(`query(${objectType}) : résultat vide`, outcome.detail);
      return [];
    }
    return [...outcome.objects];
  }

  return {
    query,
    probe: (objectType: string) => probeWith(transport, warn, objectType),
  };
}

/**
 * Les actes de vérification d'un périmètre : la lecture du graphe, puis la
 * conversion pure (src/ingest/graph-mapping.ts). Signature de lot
 * (docs/CONTRACTS.md §3) : une source d'actes = une fonction `collect`.
 *
 * Seuls les `test-execution` sont lus ici : ce sont les exécutions de test,
 * force **machine** (§7 forme 1). Les `test-run` d'un plan de test se lisent
 * par le port, avec l'identifiant du plan.
 */
export async function collect(deps: Deps, scope: Scope): Promise<Verification[]> {
  const warn = depsWarning(deps.log, 'graph');
  const objects = await deps.graph.query('test-execution', {
    scopeType: scope.scopeType,
    scope: scope.scope,
  });
  return toVerifications(objects, { report: warn });
}
