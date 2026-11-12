/**
 * The weave map view-model (§17) : every state is double-coded by a pattern
 * and a word, and the size of a hole follows the métré.
 */
import { describe, expect, it } from 'vitest';
import { buildWeaveMap, holeSize, isDeclaration } from '../../src/viewmodel/weave-map.js';
import { makeCriterion, makeLink, makeVerification } from '../helpers/index.js';

const AT = '2026-11-12T09:00:00.000Z';

describe('la carte de trame', () => {
  it('§24.1 montre les fils, les passages et les trous', () => {
    const covered = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const hole = makeCriterion({ criterionKey: 'AC-2', ticketKey: 'TRAME-1' });
    const act = makeVerification({ id: 'ver_1', ticketKey: 'TRAME-1' });
    const map = buildWeaveMap({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      language: 'fr',
      criteria: [covered, hole],
      verifications: [act],
      links: [makeLink({ id: 'link_1', criterionId: covered.id, verificationId: 'ver_1' })],
      holes: [{ criterionId: hole.id, criterionKey: 'AC-2', priorityScore: 0.9 }],
    });
    expect(map.threads).toHaveLength(2);
    expect(map.passes).toHaveLength(1);
    expect(map.meshes).toHaveLength(1);
    expect(map.holes).toHaveLength(1);
    expect(map.holes[0]?.size).toBe(3);
  });

  it('§24.2 une déclaration est un fil fin : elle ne prouve rien', () => {
    const map = buildWeaveMap({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      language: 'en',
      criteria: [makeCriterion({ criterionKey: 'AC-1' })],
      verifications: [makeVerification({ id: 'v', form: 'declaration', strength: 'declared' })],
      links: [],
    });
    expect(map.passes[0]?.declaration).toBe(true);
    expect(map.passes[0]?.strength).toBe('declared');
  });

  it('§24.4 une perforation recolore le fil', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const map = buildWeaveMap({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      language: 'fr',
      criteria: [criterion],
      verifications: [],
      links: [],
      perforations: [
        {
          id: 'p1',
          criterionId: criterion.id,
          verificationId: 'v',
          ticketKey: 'TRAME-1',
          criterionKey: 'AC-1',
          criterionVersionNo: 2,
          changedAt: AT,
          verifiedAt: '2026-10-01T00:00:00.000Z',
          ageDays: 42,
          klass: 'dry',
          state: 'open',
        },
      ],
    });
    expect(map.threads[0]?.perforated).toBe(true);
  });

  it('§24.7 une maille dérivée est pointillée, jamais pleine', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const map = buildWeaveMap({
      scope: 'TRAME-1',
      scopeType: 'ticket',
      computedAt: AT,
      language: 'fr',
      criteria: [criterion],
      verifications: [makeVerification({ id: 'v' })],
      links: [makeLink({ id: 'lk', criterionId: criterion.id, verificationId: 'v', kind: 'derived', confidence: 0.91 })],
    });
    expect(map.meshes[0]?.provisional).toBe(true);
  });

  it('la taille d’un trou suit la priorité du métré', () => {
    expect(holeSize(0.9)).toBe(3);
    expect(holeSize(0.5)).toBe(2);
    expect(holeSize(0.1)).toBe(1);
    expect(isDeclaration('declared')).toBe(true);
    expect(isDeclaration('machine')).toBe(false);
  });
});