/**
 * The certificate is the opposable page: it says what was verified, at which
 * strength, on which date — and, explicitly, what was not covered (§12.5).
 */
import { describe, expect, it } from 'vitest';
import {
  buildCertificate,
  certificateLines,
  certificateToMarkdown,
  notCovered,
  unfalsifiable,
} from '../../src/domain/certificate.js';
import type { Coverage } from '../../src/types.js';
import { makeCriterion, makeLink, makeVerification } from '../helpers/index.js';

const AT = '2026-11-12T09:00:00.000Z';

const COVERAGE: Coverage = {
  scope: 'TRAME',
  scopeType: 'project',
  computedAt: AT,
  criteriaTotal: 3,
  criteriaFalsifiable: 2,
  unfalsifiableCount: 1,
  byStrength: { machine: 1, attested: 0, declared: 0 },
  byLink: { declared: 1, confirmed: 0, derived: 0 },
  byFreshness: { current: 1, stale: 0 },
  coveredDeclared: 1,
  coveredProvisional: 0,
  holes: 1,
  dangling: 0,
  perforations: 0,
  proven: 1,
  blindSpots: [],
};

function fixture() {
  const covered = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
  const hole = makeCriterion({ criterionKey: 'AC-2', ticketKey: 'TRAME-1' });
  const vague = makeCriterion({
    criterionKey: 'AC-3',
    ticketKey: 'TRAME-1',
    falsifiable: false,
    unfalsifiableReason: '« rapide » n’est pas mesurable',
  });
  const act = makeVerification({ id: 'ver_1', ticketKey: 'TRAME-1' });
  const disabled = makeVerification({ id: 'ver_2', ticketKey: 'TRAME-1', disabledAt: AT });
  const link = makeLink({ id: 'link_1', criterionId: covered.id, verificationId: act.id });
  const deadLink = makeLink({ id: 'link_2', criterionId: hole.id, verificationId: disabled.id });
  return { covered, hole, vague, act, disabled, link, deadLink };
}

describe('le certificat de trame', () => {
  it('§24.14 déclare explicitement ce qui n’est pas couvert', () => {
    const f = fixture();
    const certificate = buildCertificate({
      scope: 'TRAME',
      scopeType: 'project',
      issuedAt: AT,
      coverage: COVERAGE,
      criteria: [f.covered, f.hole, f.vague],
      verifications: [f.act, f.disabled],
      links: [f.link, f.deadLink],
    });
    expect(certificate.notCovered.map((criterion) => criterion.criterionKey)).toEqual(['AC-2']);
    expect(certificate.unfalsifiable.map((criterion) => criterion.criterionKey)).toEqual(['AC-3']);
    expect(certificate.verifications).toHaveLength(1);
    expect(certificate.verifications[0]?.strength).toBe('machine');
  });

  it('un acte désactivé ne compte pas comme couverture', () => {
    const f = fixture();
    expect(notCovered([f.hole], [f.disabled], [f.deadLink])).toHaveLength(1);
    expect(certificateLines([f.hole], [f.disabled], [f.deadLink])).toHaveLength(0);
  });

  it('la page dit le périmètre, la date et les trois axes', () => {
    const f = fixture();
    const certificate = buildCertificate({
      scope: 'TRAME',
      scopeType: 'project',
      issuedAt: AT,
      coverage: COVERAGE,
      criteria: [f.covered, f.hole, f.vague],
      verifications: [f.act],
      links: [f.link],
    });
    const page = certificateToMarkdown(certificate);
    expect(page).toContain('# Certificat de trame — TRAME');
    expect(page).toContain(AT);
    expect(page).toContain('Ce qui n’est PAS couvert');
    expect(page).toContain('machine');
    expect(page).toContain('AC-2');
  });

  it('les critères infalsifiables ne sont ni trous ni couverture', () => {
    const f = fixture();
    expect(unfalsifiable([f.covered, f.vague])).toHaveLength(1);
  });
});
