/**
 * Origine 2 (§6) — description du ticket (liste à puces, cases à cocher).
 *
 * Contenu : markdown/ADF déjà converti en texte brut par l'adaptateur Jira ;
 * les critères y sont des items de liste (`-`, `*`, `* [ ]`) ou des paragraphes
 * isolés, souvent mélangés à du contexte.
 *
 * Numérotation stable (L1) : parcours ligne à ligne (`lineNumber`), chaque
 * item de liste devient `AC-n` dans l'ordre d'apparition ; la numérotation
 * est **reconstruite** à chaque extraction, ce qui rend le critère reconnaissable
 * d'un run à l'autre tant que la description n'est pas réordonnée.
 *
 * Limite connue (§6) : la description mélange souvent critères et notes —
 * l'extraction devra être prudente (heuristiques + LLM classé au budget, §18)
 * et un doute reste un doute : pas de critère inventé.
 *
 * Souche L0 : la vraie analyse arrive au lot L1.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types.js';

export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
