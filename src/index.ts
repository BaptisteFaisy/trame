/**
 * Forge entry point: wiring only, no business logic.
 *
 * Every module of the manifest (docs/CAHIER-DES-CHARGES.md §18) lands here and
 * goes straight back to its handler, each one owned by one file and one lot
 * (docs/CONTRACTS.md §3):
 *
 *   handler        → the eleven screens of §17 (`jira:globalPage`,
 *                    `jira:projectPage`, `jira:issuePanel`, gadget)
 *   dispatch       → `action` and `rovo:mcp` (the fourteen tools of §16)
 *   ingestResults  → `webtrigger` ci-results (signed bridge from pipelines)
 *   onEvent        → `trigger` avi:jira:updated:issue
 *   onScheduled    → `scheduledTrigger` (nightly: perforations, dangling)
 *   onMessage      → `consumer` trame-recompute (900 s, by slices)
 *   validateWeave  → `jira:workflowValidator` (optional, TR-30)
 *   jql*           → `jira:jqlFunction` holes/perforated/dangling/uncovered
 *
 * Frozen file: a lot never edits it, it implements its own handler.
 * Rules: files < 500 lines, functions < 50 lines.
 */
import Resolver from '@forge/resolver';
import { Queue } from '@forge/events';
import { createAppDeps } from './deps';
import type { Deps, JobQueue, RecomputeMessage } from './ports';
import type { ActorContext } from './ports';
import { registerScreens } from './handlers/resolver';
import { ACTION_KEYS, runAction } from './handlers/dispatch';
import { onJiraEvent } from './handlers/events';
import { onScheduledTick } from './handlers/scheduled';
import { onRecomputeMessage } from './handlers/consumer';
import { handleCiResults } from './handlers/ingest';
import type { CiWebRequest, CiWebResponse } from './handlers/ingest';
import { createValidator } from './handlers/validator';
import type { WeaveVerdict } from './handlers/validator';
import { jqlDangling, jqlHoles, jqlPerforated, jqlUncovered } from './handlers/jql';

/** The queue key must be the one of the `consumer` module in the manifest. */
export const QUEUE_KEY = 'trame-recompute';

/** Minimal adapter from the Forge queue to the `JobQueue` port. */
function createForgeQueue(): JobQueue {
  const queue = new Queue({ key: QUEUE_KEY });
  return {
    async publish(message: RecomputeMessage) {
      await queue.push({ body: message as unknown as Record<string, unknown> });
    },
  };
}

const deps: Deps = createAppDeps(createForgeQueue());

/** What Forge passes to a function: identity and module, never a right. */
export interface ForgeContext {
  principal?: { accountId?: string };
  moduleKey?: string;
  cloudId?: string;
}

function actorContextOf(payload: Record<string, unknown>, context?: ForgeContext): ActorContext {
  const moduleId = context?.moduleKey ?? String(payload['moduleKey'] ?? '');
  const fromMcp = moduleId.startsWith('mcp') || payload['viaMcp'] === true;
  return {
    accountId: context?.principal?.accountId ?? String(payload['accountId'] ?? ''),
    moduleId,
    fromMcp,
    cloudId: context?.cloudId ?? String(payload['cloudId'] ?? ''),
  };
}

/* --------------------------------------------------------------- screens */

const resolver = new Resolver();
registerScreens(resolver, deps);
export const handler = resolver.getDefinitions();

/* ------------------------------------------------- actions and MCP tools */

/**
 * Resolves the action key of a call. Forge gives the module key in the context
 * for an `action` module; the UI and the tests pass it in the payload. A `fn-`
 * prefix (a per-action function key) is stripped. An unknown key is refused
 * loudly, never guessed (§16).
 */
function actionKeyOf(payload: Record<string, unknown>, context?: ForgeContext): string {
  const raw = String(payload['action'] ?? payload['name'] ?? context?.moduleKey ?? '');
  return raw.startsWith('fn-') ? raw.slice(3) : raw;
}

/** A Forge action is an ordinary function `(payload, context)` (§16). */
export async function dispatch(
  payload: Record<string, unknown>,
  context?: ForgeContext,
): Promise<unknown> {
  const key = actionKeyOf(payload, context);
  if (!ACTION_KEYS.includes(key as (typeof ACTION_KEYS)[number])) {
    throw new Error(`unknown action: ${key || '(none)'} — moduleKey=${context?.moduleKey ?? ''}`);
  }
  return runAction(key, payload, deps, actorContextOf(payload, context));
}

export { ACTION_KEYS };

/* --------------------------------------------------- pipeline web trigger */

/** Web trigger request (urlFormat v2): raw body, for the signature. */
export interface ForgeWebRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
  query?: Record<string, string>;
}

export async function ingestResults(request: ForgeWebRequest): Promise<CiWebResponse> {
  const raw: CiWebRequest = {
    method: request.method,
    path: request.path,
    headers: request.headers ?? {},
    body: request.body ?? '',
    query: request.query ?? {},
  };
  return handleCiResults(raw, deps);
}

/* ------------------------------------------- trigger, schedule, consumer */

export async function onEvent(payload: Record<string, unknown>): Promise<void> {
  await onJiraEvent(payload, deps);
}

export async function onScheduled(payload: Record<string, unknown>): Promise<void> {
  await onScheduledTick(payload, deps);
}

export async function onMessage(payload: Record<string, unknown>): Promise<void> {
  await onRecomputeMessage(payload as unknown as RecomputeMessage, deps);
}

/* --------------------------------------------- optional closing gate (TR-30) */

export interface ValidatorPayload {
  issueKey?: string;
  configuration?: Record<string, unknown>;
  transition?: { fromStatus?: string; toStatus?: string };
}

const validator = createValidator(deps);

/** Warns, never blocks: the measure does not change the work (§5, §14). */
export async function validateWeave(payload: ValidatorPayload): Promise<WeaveVerdict> {
  return validator({
    issueKey: payload.issueKey ?? '',
    configuration: payload.configuration ?? {},
    transition: {
      fromStatus: payload.transition?.fromStatus ?? '',
      toStatus: payload.transition?.toStatus ?? '',
    },
  });
}

/* -------------------------------------------------------------- JQL (TR-11) */

export const holes = jqlHoles;
export const perforated = jqlPerforated;
export const dangling = jqlDangling;
export const uncovered = jqlUncovered;
