/**
 * Honesty invariants of §22, as executable checks on the frozen defaults and on
 * the shape of the reported objects. A lot that would merge two axes, count a
 * derived link as declared coverage, or expose a per-person figure breaks this
 * file — on purpose.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  DERIVED_LINK_FLOOR,
  DERIVED_LINK_THRESHOLD,
  DEFAULT_STRENGTH_BY_FORM,
  KIND_WEIGHTS,
  MIN_SAMPLE_FOR_CONCLUSION,
  PERFORATION_DRY_DAYS,
  PERFORATION_FRESH_DAYS,
  PERFORATION_MULTIPLE_CHANGES,
  STRENGTH_RANK,
  withOverrides,
} from '../../src/defaults.js';
import type { Coverage } from '../../src/types.js';

const TYPES_SOURCE = readFileSync(new URL('../../src/types.ts', import.meta.url), 'utf8');

/** Body of an exported interface, braces included. */
function interfaceBody(name: string): string {
  const at = TYPES_SOURCE.indexOf(`export interface ${name} `);
  expect(at, `interface ${name} introuvable`).toBeGreaterThan(-1);
  const open = TYPES_SOURCE.indexOf('{', at);
  let depth = 0;
  for (let index = open; index < TYPES_SOURCE.length; index += 1) {
    if (TYPES_SOURCE[index] === '{') depth += 1;
    if (TYPES_SOURCE[index] === '}') depth -= 1;
    if (depth === 0) return TYPES_SOURCE.slice(open, index + 1);
  }
  throw new Error(`accolades mal fermées pour ${name}`);
}

describe('frozen numbers (§8, §9, §11)', () => {
  it('keeps the derived-link threshold at 0.85 and the floor at 0.5', () => {
    expect(DERIVED_LINK_THRESHOLD).toBe(0.85);
    expect(DERIVED_LINK_FLOOR).toBe(0.5);
    expect(DEFAULT_SETTINGS.derivedLinkThreshold).toBe(0.85);
    expect(DEFAULT_SETTINGS.derivedLinkFloor).toBe(0.5);
  });

  it('classifies perforations at 7 days, 30 days and 3 changes', () => {
    expect(PERFORATION_FRESH_DAYS).toBe(7);
    expect(PERFORATION_DRY_DAYS).toBe(30);
    expect(PERFORATION_MULTIPLE_CHANGES).toBe(3);
    expect(DEFAULT_SETTINGS.perforationFreshDays).toBe(7);
    expect(DEFAULT_SETTINGS.perforationDryDays).toBe(30);
    expect(DEFAULT_SETTINGS.perforationMultipleChanges).toBe(3);
  });

  it('refuses to conclude below five criteria', () => {
    expect(MIN_SAMPLE_FOR_CONCLUSION).toBe(5);
  });

  it('ranks machine above attested above declared', () => {
    expect(STRENGTH_RANK.machine).toBeGreaterThan(STRENGTH_RANK.attested);
    expect(STRENGTH_RANK.attested).toBeGreaterThan(STRENGTH_RANK.declared);
  });

  it('gives the seven forms their default strength (§7)', () => {
    expect(DEFAULT_STRENGTH_BY_FORM['automated-test']).toBe('machine');
    expect(DEFAULT_STRENGTH_BY_FORM['manual-case']).toBe('attested');
    expect(DEFAULT_STRENGTH_BY_FORM['third-party']).toBe('attested');
    for (const form of ['code-review', 'traced-manual', 'deployment', 'declaration'] as const) {
      expect(DEFAULT_STRENGTH_BY_FORM[form], form).toBe('declared');
    }
  });

  it('puts security and non-regression first in the métré (§11)', () => {
    expect(KIND_WEIGHTS.security).toBe(1);
    expect(KIND_WEIGHTS['non-regression']).toBe(0.9);
    expect(KIND_WEIGHTS['edge-case']).toBe(0.7);
    expect(KIND_WEIGHTS.functional).toBe(0.5);
    expect(KIND_WEIGHTS.experience).toBeLessThanOrEqual(KIND_WEIGHTS.documentation);
    const values = Object.values(KIND_WEIGHTS);
    expect(Math.max(...values)).toBe(KIND_WEIGHTS.security);
  });

  it('merges team overrides without losing the frozen weights', () => {
    const merged = withOverrides(DEFAULT_SETTINGS, {
      metricWeights: { ...DEFAULT_SETTINGS.metricWeights, zoneRisk: 0.2 },
    });
    expect(merged.metricWeights.zoneRisk).toBe(0.2);
    expect(merged.metricWeights.kind.security).toBe(1);
    expect(merged.derivedLinkThreshold).toBe(0.85);
  });
});

describe('no ranking of people (§5, §22)', () => {
  const FORBIDDEN = /(\bper(Person|User|Author|Team)\b|\branking\b|\bscore.*author)/i;

  it('keeps person fields out of every reported figure', () => {
    for (const name of ['Coverage', 'Bulletin', 'Certificate', 'Hole', 'Perforation', 'Witness']) {
      expect(interfaceBody(name), name).not.toMatch(FORBIDDEN);
      expect(interfaceBody(name), name).not.toMatch(/\bauthorRef\b/);
    }
  });

  it('confines authorRef to the audit trail', () => {
    for (const name of ['Criterion', 'Verification']) {
      expect(interfaceBody(name), name).toMatch(/authorRef\?/);
    }
    // A revision names who changed it, a certificate line who acted: same rule,
    // other field names, and always optional (audit trail, never a ranking).
    expect(interfaceBody('CriterionVersion')).toMatch(/changedByRef\?/);
    expect(interfaceBody('CertificateLine')).toMatch(/actorRef\?/);
  });

  it('carries a denominator on every coverage figure', () => {
    const coverage: Coverage = {
      scope: 'TRAME',
      scopeType: 'project',
      computedAt: new Date(0).toISOString(),
      criteriaTotal: 4,
      criteriaFalsifiable: 3,
      unfalsifiableCount: 1,
      byStrength: { machine: 1, attested: 0, declared: 1 },
      byLink: { declared: 2, confirmed: 0, derived: 1 },
      byFreshness: { current: 1, stale: 1 },
      coveredDeclared: 2,
      coveredProvisional: 1,
      holes: 1,
      dangling: 1,
      perforations: 1,
      proven: 0,
      blindSpots: [],
    };
    expect(coverage.criteriaTotal).toBe(4);
    expect(coverage.coveredProvisional).not.toBe(coverage.coveredDeclared);
    expect(Object.keys(coverage)).toContain('blindSpots');
  });
});
