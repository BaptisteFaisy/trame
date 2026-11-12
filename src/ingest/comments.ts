/**
 * Les commentaires Jira comme actes de vérification — §7 formes 3, 5 et 7.
 *
 * La **logique est pure** et vit dans `src/ingest/comments-mapping.ts` ; ce
 * fichier ne fait que la lecture. Deux façons de lire, au choix de l'appelant :
 * - `jiraCommentTransport(jira)` : on réutilise le port Jira de l'app
 *   (src/ingest/jira.ts) — aucune seconde requête REST n'est faite ;
 * - `forgeCommentTransport(clock)` : lecture directe par `@forge/api`, pour
 *   qui n'a pas de port Jira sous la main.
 *
 * Discipline (§18) : une lecture ne lève jamais. Un droit manquant ou un
 * ticket illisible donnent le vide (`[]`) et un avertissement journalisé ; un
 * commentaire **sans date** est écarté — on n'invente jamais une date (§18).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import api, { route } from '@forge/api';
import type { Clock, IssueComment, JiraGateway, Logger } from '../ports.js';
import type { Deps, Scope } from '../ports.js';
import type { Verification } from '../types.js';
import { consoleLogger, depsWarning, safe } from './common.js';
import { adfToText } from './jira.js';
import { toVerifications } from './comments-mapping.js';

/** La lecture des commentaires d'un ticket — injectable. */
export type CommentTransport = (issueId: string) => Promise<IssueComment[]>;

/** Un commentaire brut de l'API Jira. */
interface RawComment {
  id?: string;
  body?: unknown;
  created?: string;
  author?: { accountId?: string };
}

/** La page de commentaires renvoyée par l'API. */
interface RawCommentPage {
  comments?: RawComment[];
}

/**
 * La lecture par le port Jira de l'app : aucune requête supplémentaire, le
 * même garde-fou « ne lève jamais » que `src/ingest/jira.ts`.
 */
export function jiraCommentTransport(jira: JiraGateway): CommentTransport {
  return (issueId: string) => jira.comments(issueId);
}

/**
 * La lecture directe par `@forge/api`. Un commentaire non daté par l'API est
 * daté de l'instant de réception : mieux qu'une date inventée, et c'est dit
 * (§18 — la date vient du `Clock` injecté, jamais de `Date.now()`).
 */
export function forgeCommentTransport(clock: Clock): CommentTransport {
  return async (issueId: string) => {
    const response = await api.asApp().requestJira(route`rest/api/3/issue/${issueId}/comment`);
    const page = (await response.json()) as RawCommentPage;
    return (page.comments ?? []).map((comment) => ({
      id: comment.id ?? '',
      issueId,
      body: adfToText(comment.body),
      createdAt: comment.created ?? clock.now(),
      authorRef: comment.author?.accountId,
    }));
  };
}

/** Ce que l'appelant obtient : les actes de vérification d'un ticket. */
export interface CommentsSource {
  /** Les actes tirés des commentaires d'un ticket. */
  actsOf(issueId: string, ticketKey?: string): Promise<Verification[]>;
}

/** Les options de la source : le journal et la clé de ticket par défaut. */
export interface CommentsSourceOptions {
  readonly log?: Logger;
  readonly defaultTicketKey?: string;
}

/** Fabrique la source ; le transport est injectable (tests hors réseau). */
export function createCommentsSource(
  transport: CommentTransport,
  options: CommentsSourceOptions = {},
): CommentsSource {
  const warn = depsWarning(options.log ?? consoleLogger, 'comments');
  return {
    async actsOf(issueId: string, ticketKey?: string): Promise<Verification[]> {
      const comments = await safe(warn, `comments(${issueId})`, () => transport(issueId), []);
      return toVerifications(comments, {
        ticketKey: ticketKey ?? options.defaultTicketKey,
        report: warn,
      });
    },
  };
}

/**
 * Les actes d'un périmètre, signature de lot (docs/CONTRACTS.md §3) : une
 * source d'actes = une fonction `collect`.
 *
 * Seuls les commentaires d'un **ticket** portent des actes : un sprint ou un
 * projet n'a pas de commentaires, il a des tickets — les lire serait le
 * travail du résolveur de périmètre, pas celui-ci.
 */
export async function collect(deps: Deps, scope: Scope): Promise<Verification[]> {
  if (scope.scopeType !== 'ticket') return [];
  const warn = depsWarning(deps.log, 'comments');
  const comments = await deps.jira.comments(scope.scope);
  return toVerifications(comments, { ticketKey: scope.scope, report: warn });
}
