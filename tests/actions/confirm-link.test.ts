/**
 * `confirm-link` — le retricotage : une liaison dérivée confirmée (§9.4).
 */
import { describe, expect, it } from 'vitest';
import { run as confirmLink } from '../../src/actions/confirm-link.js';
import { run as getCoverage } from '../../src/actions/get-coverage.js';
import { buildDemoProject } from '../../src/sample/demo-project.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface ConfirmResponse {
  applied: boolean;
  awaitingHumanDecision: boolean;
  link: { id: string; kind: string; path: string; confirmedAt?: string };
  error?: string;
}

/** L'identifiant du critère TRAME-102/AC-3 et de son acte dérivé. */
function demoPair() {
  const demo = buildDemoProject();
  const criterion = demo.criteria.find(
    (row) => row.ticketKey === 'TRAME-102' && row.criterionKey === 'AC-3',
  );
  const verification = demo.verifications.find(
    (row) => row.name === 'TRAME-102.testShouldReportPerforation',
  );
  if (!criterion || !verification) throw new Error('paire de démonstration introuvable');
  return { criterionId: criterion.id, verificationRef: verification.id };
}

describe('confirm-link — §24.8 une liaison dérivée confirmée devient déclarée', () => {
  it('§24.8 — la confirmation change le type de la liaison et date l’acte', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const { criterionId, verificationRef } = demoPair();
    const out = (await confirmLink(
      deps,
      { criterionId, verificationRef },
      ACTOR,
    )) as ConfirmResponse;
    expect(out.error).toBeUndefined();
    expect(out.applied).toBe(true);
    expect(out.link.kind).toBe('confirmed');
    expect(out.link.confirmedAt).toBe('2026-11-12T09:00:00.000Z');
  });

  it('§24.8 — la liaison confirmée entre dans la couverture déclarée', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const { criterionId, verificationRef } = demoPair();
    await confirmLink(deps, { criterionId, verificationRef }, ACTOR);
    const coverage = (await getCoverage(
      deps,
      { scope: 'TRAME-102', scopeType: 'ticket' },
      ACTOR,
    )) as { coverage: { coveredDeclared: number; coveredProvisional: number; byLink: { confirmed: number; derived: number } } };
    expect(coverage.coverage.coveredDeclared).toBe(4);
    expect(coverage.coverage.coveredProvisional).toBe(0);
    expect(coverage.coverage.byLink.confirmed).toBe(1);
    expect(coverage.coverage.byLink.derived).toBe(0);
  });
});