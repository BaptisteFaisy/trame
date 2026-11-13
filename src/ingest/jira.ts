/**
 * Adaptateur Jira sur le runtime Forge (`@forge/api`, requestJira).
 *
 * Discipline (§18) : chaque méthode est bornée et **ne lève jamais** — un
 * droit manquant, un ticket illisible ou un champ absent vide le résultat
 * (`null`, `[]`, `false`) et journalise un avertissement `deps`-style. Le
 * domaine ne voit donc jamais d'exception brute.
 *
 * Minimum viable L0 : `getIssue` lit le ticket (champ d'acceptation
 * personnalisé s'il est configuré, description ADF convertie en texte brut,
 * tableaux laissés vides — l'extraction fine arrive en L1), les listes passent
 * par JQL, `listTestTickets` cherche les sous-tâches de type Test,
 * `declaredLinks` lit les relations de ticket.
 *
 * Signature exigée par src/deps.ts : `createJiraGateway(clock)`. Le transport,
 * le journal et le champ d'acceptation sont des options (2e paramètre) : les
 * tests hors réseau injectent leur transport, deps.ts n'est pas changé.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import api, { route } from '@forge/api';
import type { RequestInit, Route } from '@forge/api';
import type {
  Clock,
  DeclaredRelation,
  IssueComment,
  IssueRef,
  JiraGateway,
  Logger,
} from '../ports';
import { consoleLogger, depsWarning, safe } from './common';

/** Transport Jira injectable (défaut : `api.asApp().requestJira`). */
export type JiraRequest = (url: Route, init?: RequestInit) => Promise<unknown>;

export interface JiraGatewayOptions {
  /** Identifiant du champ personnalisé « critères d'acceptation », s'il existe. */
  acceptanceFieldId?: string;
  log?: Logger;
  request?: JiraRequest;
}

/** Champs strictement nécessaires pour construire `IssueRef` (§6). */
export const ISSUE_FIELDS = [
  'summary',
  'description',
  'status',
  'project',
  'labels',
  'components',
  'sprint',
  'fixVersions',
  'updated',
  'issuetype',
] as const;

/** Borne des listes JQL : jamais de parcours ouvert (§18, volume). */
export const MAX_LIST_RESULTS = 100;

const defaultRequest: JiraRequest = async (url, init) => {
  const response = await api.asApp().requestJira(url, init);
  return response.json();
};

/* ------------------------------------------------------------------ payloads */

interface RawFields {
  summary?: string;
  description?: unknown;
  status?: { name?: string };
  project?: { id?: string; key?: string };
  labels?: string[];
  components?: { name?: string }[];
  sprint?: { name?: string } | string;
  fixVersions?: { name?: string }[];
  updated?: string;
  [key: string]: unknown;
}

interface RawIssue {
  id?: string;
  key?: string;
  fields?: RawFields;
}

interface RawComment {
  id?: string;
  body?: unknown;
  created?: string;
  author?: { accountId?: string };
}

interface RawIssueLink {
  type?: { name?: string; outward?: string };
  inwardIssue?: RawIssue;
  outwardIssue?: RawIssue;
  createdAt?: string;
}

/* ------------------------------------------------------------------- helpers */

/** Description ADF → texte brut minimal (paragraphes et items de liste). */
export function adfToText(adf: unknown): string {
  if (typeof adf === 'string') return adf;
  if (!adf || typeof adf !== 'object') return '';
  const node = adf as { text?: string; content?: unknown[] };
  if (typeof node.text === 'string') return node.text;
  return (node.content ?? []).map(adfToText).filter((part) => part.length > 0).join('\n');
}

function firstString(values: readonly (string | undefined)[]): string | undefined {
  return values.find((value) => typeof value === 'string' && value.length > 0);
}

/** Champ d'acceptation personnalisé : lu seulement s'il est configuré (§21). */
function acceptanceOf(fields: RawFields, fieldId: string | undefined): string | undefined {
  if (!fieldId) return undefined;
  const raw = fields[fieldId];
  if (raw === undefined || raw === null) return undefined;
  return typeof raw === 'string' ? raw : adfToText(raw);
}

/** Payload Jira → `IssueRef` (tables vides en L0 : extraction ADF en L1). */
export function toIssueRef(raw: RawIssue, updatedAt: string, acceptanceFieldId?: string): IssueRef {
  const fields = raw.fields ?? {};
  const sprint = fields.sprint;
  return {
    id: raw.id ?? '',
    key: raw.key ?? '',
    projectId: fields.project?.id ?? fields.project?.key ?? '',
    summary: fields.summary ?? '',
    status: fields.status?.name ?? '',
    acceptanceField: acceptanceOf(fields, acceptanceFieldId),
    description: adfToText(fields.description),
    tables: [],
    labels: fields.labels ?? [],
    components: (fields.components ?? []).map((c) => c.name ?? '').filter((n) => n.length > 0),
    sprint: typeof sprint === 'string' ? firstString([sprint]) : firstString([sprint?.name]),
    fixVersion: firstString((fields.fixVersions ?? []).map((v) => v.name)),
    updatedAt: firstString([fields.updated]) ?? updatedAt,
  };
}

/* ------------------------------------------------------------------- gateway */

/** Fabrique l'adaptateur ; `clock` horodate chaque repli (signature deps.ts). */
export function createJiraGateway(clock: Clock, options: JiraGatewayOptions = {}): JiraGateway {
  const log = options.log ?? consoleLogger;
  const warn = depsWarning(log, 'jira');
  const request = options.request ?? defaultRequest;
  const fieldId = options.acceptanceFieldId;
  const fieldsQuery = [...ISSUE_FIELDS, ...(fieldId ? [fieldId] : [])].join(',');
  const now = () => clock.now();

  const get = (url: Route) => request(url, { method: 'GET' });
  const post = (url: Route, body: unknown) =>
    request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  async function listByJql(jql: string, limit: number): Promise<IssueRef[]> {
    const page = (await post(route`rest/api/3/search`, {
      jql,
      maxResults: limit,
      fields: [...ISSUE_FIELDS, ...(fieldId ? [fieldId] : [])],
    })) as { issues?: RawIssue[] } | null;
    return (page?.issues ?? []).map((raw) => toIssueRef(raw, now(), fieldId));
  }

  return {
    getIssue: (issueIdOrKey) =>
      safe(warn, `getIssue(${issueIdOrKey})`, async () => {
        const raw = (await get(route`rest/api/3/issue/${issueIdOrKey}?fields=${fieldsQuery}`)) as RawIssue | null;
        return raw && raw.id ? toIssueRef(raw, now(), fieldId) : null;
      }, null),
    listIssuesSince: (projectId, since, limit) =>
      safe(warn, 'listIssuesSince', () => listByJql(`project = ${projectId} AND updated >= "${since}" ORDER BY updated ASC`, limit), []),
    listIssuesOfSprint: (projectId, sprint) =>
      safe(warn, 'listIssuesOfSprint', () => listByJql(`project = ${projectId} AND sprint = "${sprint}"`, MAX_LIST_RESULTS), []),
    listIssuesOfVersion: (projectId, version) =>
      safe(warn, 'listIssuesOfVersion', () => listByJql(`project = ${projectId} AND fixVersion = "${version}"`, MAX_LIST_RESULTS), []),
    comments: (issueId) =>
      safe(warn, 'comments', async () => {
        const page = (await get(route`rest/api/3/issue/${issueId}/comment`)) as { comments?: RawComment[] } | null;
        return (page?.comments ?? []).map((c) => ({
          id: c.id ?? '',
          issueId,
          body: adfToText(c.body),
          createdAt: firstString([c.created]) ?? now(),
          authorRef: c.author?.accountId,
        } satisfies IssueComment));
      }, []),
    listTestTickets: (issueId) =>
      safe(warn, 'listTestTickets', () => listByJql(`parent = ${issueId} AND issuetype = Test`, 50), []),
    declaredLinks: (issueId) =>
      safe(warn, 'declaredLinks', async () => {
        const raw = (await get(route`rest/api/3/issue/${issueId}/issuelinks`)) as { issuelinks?: RawIssueLink[] } | null;
        return (raw?.issuelinks ?? []).map((link) => ({
          criterionRef: link.inwardIssue?.key ?? issueId,
          verificationRef: link.outwardIssue?.key ?? '',
          kind: link.type?.outward ?? link.type?.name ?? 'related',
          createdAt: firstString([link.createdAt]) ?? now(),
        } satisfies DeclaredRelation));
      }, []),
    displayName: (accountId) =>
      safe(warn, 'displayName', async () => {
        const user = (await get(route`rest/api/3/user?accountId=${accountId}`)) as { displayName?: string } | null;
        return user?.displayName ?? accountId;
      }, accountId),
    addComment: (issueId, bodyKey, params) =>
      safe(warn, 'addComment', async () => {
        const body = bodyKey.replace(/\{\{(\w+)\}\}/g, (_, name: string) => params?.[name] ?? '');
        await post(route`rest/api/3/issue/${issueId}/comment`, { body });
        return true;
      }, false),
    setIssueProperty: (issueId, key, value) =>
      safe(warn, 'setIssueProperty', async () => {
        await request(route`rest/api/3/issue/${issueId}/properties/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
        return true;
      }, false),
  };
}
