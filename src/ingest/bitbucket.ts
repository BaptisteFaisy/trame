/**
 * Adaptateur Bitbucket — lecture réelle, transport injectable (§7, §10).
 *
 * Bitbucket ne dit pas « voici les tests » : il dit « voici les fichiers du
 * dépôt », « voici les builds », « voici les pull requests ». L'adaptateur
 * lit ces trois familles et les convertit :
 * - les **fichiers de test** du dépôt : leur chemin donne la zone, leur nom
 *   donne la clé de ticket (`PROJ-12.`) et les `AC-n` cités (§10, §24.17) ;
 * - les **builds** : leur état dit si la CI tourne encore — un build arrêté
 *   est un fil détendu (§8.3) ;
 * - les **pull requests** : leurs mentions de critères et de tickets.
 *
 * Discipline (§18) : **aucune méthode ne lève**. Un droit manquant, un dépôt
 * introuvable ou une réponse illisible donnent le vide (`[]`) et un
 * avertissement journalisé ; la sonde `probe` distingue alors « pas de droit »
 * de « pas de données » — un dépôt illisible n'est jamais rapporté comme un
 * dépôt sans test (§22, §23).
 *
 * Le transport est **injectable** (comme `src/ingest/jira.ts` le fait déjà) :
 * les tests n'ont jamais le réseau.
 *
 * Signature exigée par src/deps.ts : `createBitbucketGateway(log)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import api, { assumeTrustedRoute } from '@forge/api';
import type { BitbucketGateway, BuildRef, Logger, PullMention, TestFile } from '../ports.js';
import type { VisibilityProbe } from '../types.js';
import { absentProbe, depsWarning, safe } from './common.js';
import { toBuildRef, toPullMention, toTestFile } from './bitbucket-mapping.js';

/** Détail de repli quand le transport n'est pas disponible. */
export const BITBUCKET_TRANSPORT_UNAVAILABLE = 'transport Bitbucket indisponible';

/** Le nombre d'éléments lus par page : une lecture n'est jamais ouverte. */
export const BITBUCKET_PAGE_SIZE = 100;

/** Ce que le transport rend : la charge utile, ou la raison du vide. */
export type BitbucketTransportOutcome =
  | { readonly ok: true; readonly body: unknown }
  | {
      readonly ok: false;
      readonly reason: 'no-right' | 'not-found' | 'unreadable';
      readonly detail: string;
    };

/** Ce que le transport doit savoir pour exécuter une lecture. */
export interface BitbucketTransportRequest {
  /** Le chemin de l'API (`/repositories/ws/repo/pipelines/?…`). */
  readonly path: string;
}

/** Le transport : injectable, pour que les tests n'aient jamais le réseau. */
export type BitbucketTransport = (
  request: BitbucketTransportRequest,
) => Promise<BitbucketTransportOutcome>;

/** La forme d'une réponse paginée de Bitbucket Cloud. */
interface BitbucketPage {
  values?: unknown[];
}

/** Les éléments d'une réponse paginée (jamais une erreur). */
function valuesOf(body: unknown): unknown[] {
  if (!body || typeof body !== 'object') return [];
  const page = body as BitbucketPage;
  return Array.isArray(page.values) ? page.values : [];
}

/** Un 401/403 est un droit manquant ; un 404, un dépôt introuvable. */
function classifyStatus(status: number): BitbucketTransportOutcome {
  if (status === 401 || status === 403) {
    return { ok: false, reason: 'no-right', detail: `HTTP ${status} — droit Bitbucket manquant` };
  }
  if (status === 404) {
    return { ok: false, reason: 'not-found', detail: `HTTP ${status} — dépôt introuvable` };
  }
  return { ok: false, reason: 'unreadable', detail: `HTTP ${status} — réponse illisible` };
}

/** Un chemin d'API acceptable : pas de traversée, pas de caractère exotique. */
const SAFE_PATH = /^\/[A-Za-z0-9_./-]*(\?[A-Za-z0-9_=&.-]*)?$/;

/** Le chemin d'un dépôt lisible : `workspace/repo`, rien d'autre. */
const REPOSITORY = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

/** Les deux segments d'un dépôt, ou `null` si la référence est inexploitable. */
function repositoryParts(repository: string): { workspace: string; repo: string } | null {
  const match = REPOSITORY.exec(repository.trim());
  if (!match) return null;
  return { workspace: match[1], repo: match[2] };
}

/**
 * Le transport Forge : la lecture se fait au nom d'un utilisateur (les droits
 * du dépôt sont ceux de l'utilisateur, §18).
 */
export const forgeBitbucketTransport: BitbucketTransport = async (request) => {
  if (!SAFE_PATH.test(request.path) || request.path.includes('..')) {
    return { ok: false, reason: 'unreadable', detail: 'chemin Bitbucket refusé' };
  }
  const response = await api.asUser().requestBitbucket(assumeTrustedRoute(`/2.0${request.path}`));
  if (!response.ok) return classifyStatus(response.status);
  return { ok: true, body: await response.json() };
};

/** Les options de l'adaptateur : le journal et le transport. */
export interface BitbucketGatewayOptions {
  readonly log?: Logger;
  readonly transport?: BitbucketTransport;
}

/**
 * Les fichiers du dépôt qui ressemblent à des tests.
 *
 * Bitbucket n'a pas d'« inventaire de tests » : la lecture passe donc par
 * l'arborescence des sources, et c'est **ici** que se décide ce qui compte
 * comme fichier de test — une décision tracée, pas une devinette.
 */
const TEST_PATH =
  /(^|\/)(tests?|specs?|__tests__)(\/|$)|\.(spec|test)\.[jt]sx?$|(_test|_spec)\.[jt]s?$|(Test|Tests|Spec)\.[a-z]+$/i;

/** Vrai si le chemin ressemble à un fichier de test. */
export function isTestPath(path: string): boolean {
  return TEST_PATH.test(path);
}

/** Le nom de test porté par un chemin de fichier (sans son extension). */
export function testNameFromPath(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.[a-z]+$/i, '');
}

/** Fabrique l'adaptateur ; le transport est injectable (tests hors réseau). */
export function createBitbucketGateway(
  log: Logger,
  options: BitbucketGatewayOptions = {},
): BitbucketGateway {
  const warn = depsWarning(options.log ?? log, 'bitbucket');
  const transport = options.transport ?? forgeBitbucketTransport;

  async function read(path: string): Promise<BitbucketTransportOutcome> {
    return safe(
      warn,
      `bitbucket(${path})`,
      () => transport({ path }),
      {
        ok: false as const,
        reason: 'unreadable' as const,
        detail: BITBUCKET_TRANSPORT_UNAVAILABLE,
      },
    );
  }

  /** Le chemin d'un dépôt ; `null` si la référence est inexploitable. */
  function repoPath(repository: string, resource: string): string | null {
    const parts = repositoryParts(repository);
    if (!parts) return null;
    return `/repositories/${parts.workspace}/${parts.repo}${resource}`;
  }

  async function listTests(repository: string): Promise<TestFile[]> {
    const path = repoPath(repository, `/src/?pagelen=${BITBUCKET_PAGE_SIZE}&recursive=true`);
    if (!path) {
      warn(`listTests(${repository}) : dépôt inexploitable`);
      return [];
    }
    const outcome = await read(path);
    if (!outcome.ok) {
      warn(`listTests(${repository}) : résultat vide`, outcome.detail);
      return [];
    }
    const files: TestFile[] = [];
    for (const entry of valuesOf(outcome.body)) {
      const entryPath = pathOf(entry);
      if (!entryPath || !isTestPath(entryPath)) continue;
      const test = toTestFile(testNameFromPath(entryPath), entryPath, { report: warn });
      if (test) files.push(test);
    }
    return files;
  }

  async function listBuilds(repository: string, since: string): Promise<BuildRef[]> {
    const path = repoPath(repository, `/pipelines/?pagelen=${BITBUCKET_PAGE_SIZE}&sort=-created_on`);
    if (!path) {
      warn(`listBuilds(${repository}) : dépôt inexploitable`);
      return [];
    }
    const outcome = await read(path);
    if (!outcome.ok) {
      warn(`listBuilds(${repository}) : résultat vide`, outcome.detail);
      return [];
    }
    const builds: BuildRef[] = [];
    for (const entry of valuesOf(outcome.body)) {
      const build = toBuildRef(entry, repository, { report: warn });
      if (build && build.startedAt >= since) builds.push(build);
    }
    return builds;
  }

  async function pullRequestMentions(repository: string, since: string): Promise<PullMention[]> {
    const path = repoPath(
      repository,
      `/pullrequests/?pagelen=${BITBUCKET_PAGE_SIZE}&state=MERGED&sort=-updated_on`,
    );
    if (!path) {
      warn(`pullRequestMentions(${repository}) : dépôt inexploitable`);
      return [];
    }
    const outcome = await read(path);
    if (!outcome.ok) {
      warn(`pullRequestMentions(${repository}) : résultat vide`, outcome.detail);
      return [];
    }
    const mentions: PullMention[] = [];
    for (const entry of valuesOf(outcome.body)) {
      const mention = toPullMention(entry, { report: warn });
      if (mention && (mention.mergedAt ?? '') >= since) mentions.push(mention);
    }
    return mentions;
  }

  async function probe(repository: string): Promise<VisibilityProbe> {
    const path = repoPath(repository, '');
    if (!path) {
      return absentProbe('repository', 'référence de dépôt inexploitable', 'no-data');
    }
    const outcome = await read(path);
    if (!outcome.ok) {
      return absentProbe('repository', outcome.detail, 'no-right');
    }
    return {
      objectType: 'repository',
      absence: 'no-data',
      probeRef: repository,
      readable: true,
      detail: 'dépôt lisible',
    };
  }

  return { listTests, listBuilds, pullRequestMentions, probe };
}

/** Le chemin d'une entrée de l'arborescence (`entry.path`). */
function pathOf(entry: unknown): string | undefined {
  if (!entry || typeof entry !== 'object') return undefined;
  const value = (entry as Record<string, unknown>)['path'];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
