/**
 * Langue du site : anglais par défaut (langue de la soumission), français sur
 * demande (§22). Le choix est mémorisé dans le navigateur.
 *
 * Les libellés du DOMAINE (force, chemin de tissage, absences) ne sont pas
 * traduits ici : ils viennent de `src/i18n`, la table qui connaît le
 * vocabulaire du produit. Le site ne fait que les emprunter.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { EN } from './en.js';
import type { SiteKey } from './en.js';
import { FR } from './fr.js';

export type Lang = 'en' | 'fr';

export const LANGS: readonly Lang[] = ['en', 'fr'];

const STRINGS: Record<Lang, Record<SiteKey, string>> = { en: EN, fr: FR };

const STORAGE_KEY = 'trame-site-lang';

/** Le texte du site dans la langue demandée. */
export function t(lang: Lang, key: SiteKey): string {
  return STRINGS[lang][key] ?? EN[key] ?? key;
}

/** Les deux langues, pour la bascule de l'en-tête. */
export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'fr' : 'en';
}

/** La langue enregistrée, sinon celle du navigateur, sinon l'anglais. */
export function initialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') return stored;
    return window.navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

/** Mémorise le choix de langue. */
export function rememberLang(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* navigation privée : le choix reste valable pour la session */
  }
}

export { EN, FR };
export type { SiteKey };
