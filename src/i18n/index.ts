/**
 * Dictionaries and lookup (§22: English and French, WCAG AA — every state is
 * double-coded by a pattern **and** a word, never by colour alone).
 *
 * `EN` is the source of truth for the key set; `FR` is typed against it, so
 * parity is checked by the compiler and by `tests/i18n/dictionary.test.ts`.
 */
import { EN } from './en';
import type { MessageKey } from './en';
import { FR } from './fr';
import type {
  AbsenceKind,
  CriterionKind,
  CriterionOrigin,
  DanglingReason,
  LinkKind,
  LinkPath,
  PerforationClass,
  Strength,
  VerificationForm,
} from '../types';
import { SCREEN_KEYS } from '../handlers/resolver';
import type { ScreenKey } from '../handlers/resolver';

export type Lang = 'en' | 'fr';

export const LANGS: readonly Lang[] = ['en', 'fr'];

const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { en: EN, fr: FR };

/** Label groups: `<group>.<value>` is a key of the dictionaries. */
export type LabelGroup =
  | 'screen'
  | 'axis'
  | 'strength'
  | 'link'
  | 'freshness'
  | 'path'
  | 'kind'
  | 'origin'
  | 'form'
  | 'perforation'
  | 'dangling'
  | 'absence';

/** Groups whose values are a domain enumeration, checked at compile time. */
export type EnumValueOf<G extends LabelGroup> = G extends 'screen'
  ? ScreenKey
  : G extends 'strength'
    ? Strength
    : G extends 'link'
      ? LinkKind
      : G extends 'path'
        ? LinkPath
        : G extends 'kind'
          ? CriterionKind
          : G extends 'origin'
            ? CriterionOrigin
            : G extends 'form'
              ? VerificationForm
              : G extends 'perforation'
                ? PerforationClass
                : G extends 'dangling'
                  ? DanglingReason
                  : G extends 'absence'
                    ? AbsenceKind
                    : string;

/** `fr-FR`, `fr`, `en-US`… → a supported language, English by default. */
export function pickLang(preferred?: string): Lang {
  const code = (preferred ?? '').toLowerCase();
  return code.startsWith('fr') ? 'fr' : 'en';
}

/** Interpolates `{name}` placeholders; falls back to the key when absent. */
export function t(lang: Lang, key: MessageKey, params?: Record<string, string | number>): string {
  const template = DICTIONARIES[lang][key] ?? EN[key] ?? String(key);
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Label of a domain value: `label(lang, 'kind', 'security')`. */
export function label<G extends LabelGroup>(lang: Lang, group: G, value: EnumValueOf<G>): string {
  const key = `${group}.${String(value)}` as MessageKey;
  return DICTIONARIES[lang][key] ?? EN[key] ?? key;
}

/** Every key of a group, for the registers and the coverage screen. */
export function keysOf(lang: Lang, prefix: string): string[] {
  const table = DICTIONARIES[lang];
  return (Object.keys(table) as MessageKey[])
    .filter((key) => key.startsWith(`${prefix}.`))
    .map((key) => table[key]);
}

/** Screen labels in display order (§17). */
export function screenLabels(lang: Lang): { key: ScreenKey; label: string }[] {
  return SCREEN_KEYS.map((key) => ({ key, label: label(lang, 'screen', key) }));
}

export { EN, FR };
export type { MessageKey };
