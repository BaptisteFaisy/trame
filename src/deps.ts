/**
 * Dependency graph: the single place where the Forge runtime is built.
 *
 * Handlers receive `Deps` and never import `@forge/*` themselves — that is what
 * makes every judgement testable with the fakes of `tests/helpers/fakes.ts`.
 * Frozen file (docs/CONTRACTS.md §3): a lot implements an adapter, it does not
 * rewire this file.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type {
  BitbucketGateway,
  Clock,
  ConfluenceGateway,
  GraphGateway,
  IdGenerator,
  JiraGateway,
  JobQueue,
  LlmGateway,
  Logger,
  PipelineGateway,
  SecretScanner,
  Settings,
  TrameStore,
} from './ports';
import type { Deps } from './ports';
import { DEFAULT_SETTINGS } from './defaults';
import type { SqlClient } from './db/sql-client';
import { createForgeSqlClient } from './db/sql-client';
import { createStore } from './db/repo';
import { createJiraGateway } from './ingest/jira';
import { createGraphGateway } from './ingest/graph';
import { createBitbucketGateway } from './ingest/bitbucket';
import { createConfluenceGateway } from './ingest/confluence';
import { createPipelineGateway } from './ingest/pipeline';
import { createLlmGateway } from './ingest/llm';
import { createSecretScanner } from './domain/secrets';

/** Real clock: every timestamp of the app goes through it. */
export const systemClock: Clock = { now: () => new Date().toISOString() };

/** Real identifiers: prefix + date + spin, readable in the logs. */
export function createSystemIds(): IdGenerator {
  let counter = 0;
  return {
    next(prefix: string) {
      counter += 1;
      const stamp = Date.now().toString(36);
      const spin = counter.toString(36).padStart(3, '0');
      return `${prefix}_${stamp}${spin}`;
    },
  };
}

/** Prefixed logger, to find the app in the Forge logs. */
export function createLogger(): Logger {
  const line = (message: string) => `[trame] ${message}`;
  return {
    log(level, message, meta) {
      if (level === 'error') console.error(line(message), meta ?? '');
      else if (level === 'warn') console.warn(line(message), meta ?? '');
      else console.log(line(message), meta ?? '');
    },
  };
}

/** Builds the real graph; `queue` comes from the caller (Forge module). */
export function createAppDeps(queue: JobQueue, sql?: SqlClient, settings?: Settings): Deps {
  const client = sql ?? createForgeSqlClient();
  const clock = systemClock;
  const log = createLogger();
  const store: TrameStore = createStore(client);
  return {
    clock,
    ids: createSystemIds(),
    log,
    queue,
    store,
    jira: createJiraGateway(clock) as JiraGateway,
    graph: createGraphGateway(log) as GraphGateway,
    bitbucket: createBitbucketGateway(log) as BitbucketGateway,
    confluence: createConfluenceGateway(log) as ConfluenceGateway,
    pipeline: createPipelineGateway(clock) as PipelineGateway,
    llm: createLlmGateway(store, clock) as LlmGateway,
    secrets: createSecretScanner() as SecretScanner,
    settings: settings ?? DEFAULT_SETTINGS,
  };
}
