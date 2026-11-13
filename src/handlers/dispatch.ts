/**
 * Action / MCP tool registry (frozen). The fourteen tools of §16 are exposed
 * through `rovo:mcp` and through Forge `action` modules; four internal actions
 * serve the screens and the triggers and are **not** exposed to Rovo.
 *
 * One key = one file = one lot (docs/CONTRACTS.md §3). Every tool answers with
 * figures and their denominators, quotes the criterion and its origin, and says
 * "not enough history" when the sample is small (§16, §22).
 *
 * No tool returns criterion content outside the requested scope, and none
 * accepts a person's name as a filter (§16).
 */
import type { ActionRun, Deps, ActorContext } from '../ports';
import { run as getCoverage } from '../actions/get-coverage';
import { run as listHoles } from '../actions/list-holes';
import { run as listPerforations } from '../actions/list-perforations';
import { run as listDangling } from '../actions/list-dangling';
import { run as getCriterion } from '../actions/get-criterion';
import { run as proposeTest } from '../actions/propose-test';
import { run as proposeReformulation } from '../actions/propose-reformulation';
import { run as confirmLink } from '../actions/confirm-link';
import { run as rejectLink } from '../actions/reject-link';
import { run as getBulletin } from '../actions/get-bulletin';
import { run as getCertificate } from '../actions/get-certificate';
import { run as listUnverifiable } from '../actions/list-unverifiable';
import { run as getZonesRisk } from '../actions/get-zones-risk';
import { run as getCoverageTimeline } from '../actions/get-coverage-timeline';
import { run as recompute } from '../actions/recompute';
import { run as setMetricRule } from '../actions/set-metric-rule';
import { run as saveWitness } from '../actions/save-witness';
import { run as publishCertificate } from '../actions/publish-certificate';

/** The fourteen tools of §16, exposed by `rovo:mcp` and as Forge actions. */
export const MCP_TOOL_KEYS = [
  'get-coverage',
  'list-holes',
  'list-perforations',
  'list-dangling',
  'get-criterion',
  'propose-test',
  'propose-reformulation',
  'confirm-link',
  'reject-link',
  'get-bulletin',
  'get-certificate',
  'list-unverifiable',
  'get-zones-risk',
  'get-coverage-timeline',
] as const;

/** Internal actions: screens, triggers and the nightly recomputation. */
export const INTERNAL_ACTION_KEYS = [
  'recompute',
  'set-metric-rule',
  'save-witness',
  'publish-certificate',
] as const;

export type ActionKey = (typeof MCP_TOOL_KEYS)[number] | (typeof INTERNAL_ACTION_KEYS)[number];

export const ACTION_KEYS: readonly ActionKey[] = [...MCP_TOOL_KEYS, ...INTERNAL_ACTION_KEYS];

const ACTIONS: Record<ActionKey, ActionRun> = {
  'get-coverage': getCoverage,
  'list-holes': listHoles,
  'list-perforations': listPerforations,
  'list-dangling': listDangling,
  'get-criterion': getCriterion,
  'propose-test': proposeTest,
  'propose-reformulation': proposeReformulation,
  'confirm-link': confirmLink,
  'reject-link': rejectLink,
  'get-bulletin': getBulletin,
  'get-certificate': getCertificate,
  'list-unverifiable': listUnverifiable,
  'get-zones-risk': getZonesRisk,
  'get-coverage-timeline': getCoverageTimeline,
  recompute,
  'set-metric-rule': setMetricRule,
  'save-witness': saveWitness,
  'publish-certificate': publishCertificate,
};

/** Runs one action by key; an unknown key is refused, never guessed. */
export async function runAction(
  key: string,
  payload: Record<string, unknown>,
  deps: Deps,
  actor: ActorContext,
): Promise<unknown> {
  const action = ACTIONS[key as ActionKey];
  if (!action) throw new Error(`unknown action: ${key}`);
  return action(deps, payload, actor);
}
