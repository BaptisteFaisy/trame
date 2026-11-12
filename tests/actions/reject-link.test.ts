/**
 * `reject-link` — un refus affaiblit la suggestion suivante du même type (§9.4).
 */
import { describe, expect, it } from 'vitest';
import { run as rejectLink } from '../../src/actions/reject-link.js';
import { scoreConfidence } from '../../src/domain/confidence.js';
import { buildDemoProject } from '../../src/sample/demo-project.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface RejectResponse {
  applied: boolean;
  link: { id: string; kind: string; rejectedAt?: string; rejectReason?: string };
  learned: { token: string; weight: number }[];
  affectedLinks: string[];
  error?: string;
}

/** Le critère TRAME-102/AC-3 et son acte dérivé : ils partagent le jeton « trame ». */
function demoPair() {
  const demo = buildDemoProject();
  const criterion = demo.criteria.find(
    (row) => row.ticketKey === 'TRAME-102' && row.criterionKey === 'AC-3',
  );
  const verification = demo.verifications.find(
    (row) => row.name === 'TRAME-102.testShouldReportPerforation',
  );
  if (!criterion || !verification) throw new Error('paire de démonstration introuvable');
  return { criterion, verification };
}

describe('reject-link — §24.9 un refus affaiblit la suggestion suivante', () => {
  it('§24.9 — un refus sans raison est refusé : il n’apprend rien', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const { criterion, verification } = demoPair();
    const out = (await rejectLink(
      deps,
      { criterionId: criterion.id, verificationRef: verification.id },
      ACTOR,
    )) as RejectResponse;
    expect(out.error).toBe('raison manquante');
  });

  it('§24.9 — un refus avec raison affaiblit les jetons partagés', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const { criterion, verification } = demoPair();
    const out = (await rejectLink(
      deps,
      { criterionId: criterion.id, verificationRef: verification.id, reason: 'test hors sujet' },
      ACTOR,
    )) as RejectResponse;
    expect(out.error).toBeUndefined();
    expect(out.applied).toBe(true);
    expect(out.link.rejectedAt).toBe('2026-11-12T09:00:00.000Z');
    expect(out.link.rejectReason).toBe('test hors sujet');
    // Le jeton partagé « tram » (le radical de « trame ») a perdu 0,15 (1 → 0,85).
    const token = out.learned.find((row) => row.token === 'tram');
    expect(token).toBeTruthy();
    expect(token!.weight).toBeCloseTo(0.85, 2);
    // La suggestion suivante du même type porte désormais ces poids.
    expect(out.affectedLinks.length).toBeGreaterThan(0);
  });

  it('§24.9 — la confiance de la suggestion suivante du même type baisse', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const { criterion, verification } = demoPair();
    const before = scoreConfidence(criterion.text, verification.name);
    await rejectLink(
      deps,
      { criterionId: criterion.id, verificationRef: verification.id, reason: 'test hors sujet' },
      ACTOR,
    );
    const after = scoreConfidence(criterion.text, verification.name, { tram: 0.85 });
    expect(after.confidence).toBeLessThan(before.confidence);
  });
});