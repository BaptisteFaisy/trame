import type { Deps } from '../ports.js';

/**
 * JQL functions (§18): `holes()`, `perforated()`, `dangling()`, `uncovered()`.
 *
 * A Forge JQL function receives the candidate issue ids and returns those that
 * match. Stub: lots L7 (holes), L5 (perforations and dangling threads) and L4
 * (coverage) will read the matching registry — never recompute inline (§22: a
 * criterion sheet answers in under 2 s from the cache).
 */
export type JqlFunction = (deps: Deps, issueIds: string[], query?: string) => Promise<string[]>;

/** Registry a JQL function reads; empty while the lot is not written. */
const REGISTRIES = ['holes', 'perforated', 'dangling', 'uncovered'] as const;

type RegistryName = (typeof REGISTRIES)[number];

function matchRegistry(
  deps: Deps,
  issueIds: string[],
  name: RegistryName,
  query?: string,
): string[] {
  deps.log.log('info', `jql:${name} (souche)`, { candidats: issueIds.length, query: query ?? '' });
  return [];
}

export const jqlHoles: JqlFunction = async (deps, issueIds, query) =>
  matchRegistry(deps, issueIds, 'holes', query);

export const jqlPerforated: JqlFunction = async (deps, issueIds, query) =>
  matchRegistry(deps, issueIds, 'perforated', query);

export const jqlDangling: JqlFunction = async (deps, issueIds, query) =>
  matchRegistry(deps, issueIds, 'dangling', query);

export const jqlUncovered: JqlFunction = async (deps, issueIds, query) =>
  matchRegistry(deps, issueIds, 'uncovered', query);
