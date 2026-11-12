/**
 * Contract of the entry points (§16, §17): the fourteen MCP tools and the four
 * internal actions are all registered, an unknown key is refused, and the
 * eleven screens all answer. A stub answers `{ notImplemented }` — the shape is
 * what this test freezes, so a lot cannot rename a tool without breaking it.
 */
import { describe, expect, it } from 'vitest';
import {
  ACTION_KEYS,
  INTERNAL_ACTION_KEYS,
  MCP_TOOL_KEYS,
  runAction,
} from '../../src/handlers/dispatch.js';
import { SCREEN_KEYS } from '../../src/handlers/resolver.js';
import { buildScenario } from '../helpers/index.js';

/** The fourteen tools of §16, in the order of the table. */
const EXPECTED_TOOLS = [
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
];

const EXPECTED_SCREENS = [
  'weave-map',
  'criterion-detail',
  'holes',
  'perforations',
  'dangling',
  'bulletin',
  'certificate',
  'validation-queue',
  'zone-risks',
  'visibility',
  'timeline',
];

describe('entry points', () => {
  it('expose exactly the fourteen MCP tools of §16', () => {
    expect(MCP_TOOL_KEYS).toHaveLength(14);
    expect([...MCP_TOOL_KEYS]).toEqual(EXPECTED_TOOLS);
  });

  it('keeps four internal actions out of Rovo', () => {
    expect([...INTERNAL_ACTION_KEYS]).toEqual([
      'recompute',
      'set-metric-rule',
      'save-witness',
      'publish-certificate',
    ]);
    expect(ACTION_KEYS).toHaveLength(18);
  });

  it('answers on every action key', async () => {
    const { deps } = await buildScenario();
    const actor = { accountId: 'u1', moduleId: 'mcp', fromMcp: true, cloudId: 'c1' };
    for (const key of ACTION_KEYS) {
      const out = (await runAction(key, {}, deps, actor)) as { notImplemented?: string };
      expect(out.notImplemented, key).toBe(key);
    }
  });

  it('refuses an unknown action instead of guessing', async () => {
    const { deps } = await buildScenario();
    const actor = { accountId: 'u1', moduleId: 'mcp', fromMcp: true, cloudId: 'c1' };
    await expect(runAction('delete-everything', {}, deps, actor)).rejects.toThrow(
      /unknown action/,
    );
  });

  it('lists the eleven screens of §17 in order', () => {
    expect([...SCREEN_KEYS]).toEqual(EXPECTED_SCREENS);
  });
});
