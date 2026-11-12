/**
 * `get-criterion` — la fiche d'un critère (§16).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/get-criterion.js';
import { run as confirmLink } from '../../src/actions/confirm-link.js';
import { buildDemoProject } from '../../src/sample/demo-project.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface LinkLine {
  kind: string;
  path: string;
  confidence: number;
  confirmedAt?: string;
  fresh: boolean;
}

interface PerforationLine {
  changedAt: string;
  verifiedAt: string;
  ageDays: number;
  klass: string;
}

interface CriterionResponse {
  criterion: { text: string; origin: string; criterionKey: string; kind: string };
  links: LinkLine[];
  linkCount: number;
  strengths: string[];
  fresh: boolean;
  perforations: PerforationLine[];
  error?: string;
}

describe('get-criterion — §16 la fiche cite le critère et sa source', () => {
  it('cite le critère, son origine et les forces qui le couvrent (scénario TRAME-1)', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-1' },
      ACTOR,
    )) as CriterionResponse;
    expect(out.error).toBeUndefined();
    expect(out.criterion.criterionKey).toBe('AC-1');
    expect(out.criterion.text).toContain('tissage');
    expect(out.criterion.origin).toBe('acceptance-field');
    expect(out.strengths).toContain('machine');
    expect(out.linkCount).toBeGreaterThan(0);
  });

  it('§24.4 — la fiche montre les deux dates de la perforation', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-1', criterionId: 'AC-4' },
      ACTOR,
    )) as CriterionResponse;
    expect(out.perforations).toHaveLength(1);
    expect(out.perforations[0].changedAt).toBeTruthy();
    expect(out.perforations[0].verifiedAt).toBeTruthy();
    expect(out.perforations[0].klass).toBe('fresh');
  });
});

describe('get-criterion — §24.8 une liaison dérivée confirmée devient déclarée', () => {
  it('§24.8 — la liaison confirmée apparaît dans l’historique du critère', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const demo = buildDemoProject();
    const verification = demo.verifications.find((row) => row.name === 'TRAME-102.testShouldReportPerforation');
    if (!verification) throw new Error('acte de démonstration introuvable');
    await confirmLink(
      deps,
      { criterionId: 'crit_TRAME-102_AC-3', verificationRef: verification.id },
      ACTOR,
    );
    const out = (await run(
      deps,
      { ticketKey: 'TRAME-102', criterionId: 'AC-3' },
      ACTOR,
    )) as CriterionResponse;
    const confirmed = out.links.find((link) => link.kind === 'confirmed');
    expect(confirmed).toBeTruthy();
    expect(confirmed!.confirmedAt).toBe('2026-11-12T09:00:00.000Z');
  });
});
