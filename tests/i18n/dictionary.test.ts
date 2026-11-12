import { describe, expect, it } from 'vitest';
import { EN, FR, LANGS, label, pickLang, screenLabels, t } from '../../src/i18n/index.js';
import { SCREEN_KEYS } from '../../src/handlers/resolver.js';
import type { MessageKey } from '../../src/i18n/en.js';
import type { CriterionKind } from '../../src/types.js';

/** Every value of every domain enumeration must have a label (§22: a state is
 * double-coded by a pattern and a word, never by colour alone). */
const ENUMERATIONS: Record<string, string[]> = {
  strength: ['machine', 'attested', 'declared'],
  link: ['declared', 'derived', 'confirmed'],
  path: ['mention', 'naming-convention', 'similarity', 'declaration'],
  kind: [
    'functional',
    'edge-case',
    'non-regression',
    'security',
    'performance',
    'experience',
    'documentation',
  ],
  origin: [
    'acceptance-field',
    'description',
    'table',
    'confluence-page',
    'test-ticket',
    'attachment',
  ],
  form: [
    'automated-test',
    'manual-case',
    'third-party',
    'code-review',
    'traced-manual',
    'deployment',
    'declaration',
  ],
  perforation: ['fresh', 'dry', 'multiple'],
  dangling: ['test-disabled', 'test-renamed', 'criterion-deleted', 'build-not-running'],
  absence: ['no-right', 'no-data', 'no-test', 'no-criterion'],
};

describe('dictionaries', () => {
  it('have the same keys in English and French', () => {
    const en = (Object.keys(EN) as MessageKey[]).sort();
    const fr = (Object.keys(FR) as MessageKey[]).sort();
    expect(fr).toEqual(en);
  });

  it('label every screen of §17', () => {
    for (const key of SCREEN_KEYS) {
      expect(EN[`screen.${key}` as MessageKey]).toBeTruthy();
      expect(FR[`screen.${key}` as MessageKey]).toBeTruthy();
    }
  });

  it('label every value of the domain enumerations', () => {
    for (const [group, values] of Object.entries(ENUMERATIONS)) {
      for (const value of values) {
        expect(label('fr', group as 'kind', value as CriterionKind)).not.toBe(`${group}.${value}`);
        expect(label('en', group as 'kind', value as CriterionKind)).not.toBe(`${group}.${value}`);
      }
    }
  });

  it('interpolates parameters and falls back to an unknown key', () => {
    expect(t('fr', 'msg.dated-scope')).toContain('daté');
    expect(t('en', 'msg.dated-scope')).toContain('scoped');
    expect(t('en', 'msg.not-applied')).toContain('proposal');
    const unknown = 'msg.inexistant' as MessageKey;
    expect(t('fr', unknown)).toBe('msg.inexistant');
  });

  it('picks a language from a locale', () => {
    expect(pickLang('fr-FR')).toBe('fr');
    expect(pickLang('en-GB')).toBe('en');
    expect(pickLang(undefined)).toBe('en');
    expect(LANGS).toHaveLength(2);
  });

  it('lists the screens in the order of §17', () => {
    const labels = screenLabels('fr');
    expect(labels).toHaveLength(SCREEN_KEYS.length);
    expect(labels[0]?.key).toBe('weave-map');
    expect(labels[0]?.label).toBe('Carte de trame');
  });
});
