/**
 * `get-zones-risk` — les zones à risque, entrées du métré (§11).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/get-zones-risk.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface ZoneLine {
  zone: string;
  defectCount: number;
  openIncidentCount: number;
  score: number;
  metricTerm: { because: string; weight: number; value: number };
}

interface ZonesResponse {
  zones: ZoneLine[];
  count: number;
  zoneRiskWeight: number;
  error?: string;
}

describe('get-zones-risk — §11 les zones et leurs défauts observés', () => {
  it('§11 — les zones sont listées avec leurs défauts, jamais un score deviné', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project' },
      ACTOR,
    )) as ZonesResponse;
    expect(out.error).toBeUndefined();
    expect(out.count).toBe(2);
    const weave = out.zones.find((zone) => zone.zone === 'src/104');
    expect(weave).toBeTruthy();
    expect(weave!.defectCount).toBe(3);
    expect(weave!.openIncidentCount).toBe(1);
    expect(weave!.metricTerm.because).toContain('déjà cassée');
  });

  it('§11 — le poids de la zone est une décision, toujours affichée', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'TRAME', scopeType: 'project' },
      ACTOR,
    )) as ZonesResponse;
    expect(out.zoneRiskWeight).toBe(0.6);
  });

  it('§11 — une zone sans antécédent n’apparaît pas', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as ZonesResponse;
    expect(out.count).toBe(0);
  });
});