/**
 * Empreinte stable d'un texte de critère (§6, §8.2, §18).
 *
 * L'empreinte est le cœur discret de l'app :
 * - **perforation (§8.2)** : un critère dont l'empreinte change après avoir
 *   été vérifié est perforé ; un retour à l'empreinte d'origine est une
 *   perforation « refermée » (§23) ;
 * - **cache LLM (§18)** : la similarité et le classement ne sont recalculés
 *   que si l'empreinte a changé — deux textes qui s'empreintent pareil ne
 *   coûtent qu'un seul appel ;
 * - **dédoublonnage (§23)** : `extractAll` compare les empreintes, pas les
 *   textes bruts, pour signaler les doublons sans double-compter.
 *
 * La normalisation rend l'empreinte insensible à ce qui n'est pas du sens :
 * casse, espaces, ponctuation de liste (`-`, `*`, `•`), numérotation (`1.`,
 * `2)`, `3 —`), et équivalences Unicode (NFKC : `ﬁ` = `fi`, `Ａ` = `A`).
 * Elle reste **sensible au sens** : un mot, un chiffre ou une négation de
 * plus change l'empreinte.
 *
 * `node:crypto` est utilisé à dessein : ce n'est pas `@forge/*`, le module
 * reste pur et testable hors runtime (docs/CONTRACTS.md §3).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { createHash } from 'node:crypto';

/** Longueur de l'empreinte tronquée (16 hexa = 64 bits : suffisant ici). */
export const FINGERPRINT_HEX_LENGTH = 16;

/** Marqueur de liste ou de numérotation en début de ligne : `-`, `*`, `1.`, `2)`, `3 —`… */
const LIST_MARKER = /^\s*(?:[-*•·+]|(?:\d{1,3}[.)\]:—-]))\s*/;

/**
 * Normalise un texte avant empreinte : NFKC, minuscules, marqueurs de liste
 * et de numérotation retirés en début de chaque ligne, espaces réduits.
 * Exporté pour les tests ; le reste de l'app passe par `fingerprint`.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .split('\n')
    .map((line) => line.replace(LIST_MARKER, '').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join(' ');
}

/** Empreinte stable d'un texte : sha256 de sa forme normalisée, 16 hexa. */
export function fingerprint(text: string): string {
  const digest = createHash('sha256').update(normalize(text), 'utf8').digest('hex');
  return digest.slice(0, FINGERPRINT_HEX_LENGTH);
}

/**
 * Deux textes ont-ils la même empreinte ? Comparaison en temps constant :
 * les empreintes peuvent apparaître dans des journaux partagés.
 */
export function sameFingerprint(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
