/**
 * Origine 4 (§6) — page Confluence (checklist).
 *
 * Contenu : cases à cocher et petits tableaux d'une page liée au ticket
 * (`input.pageId`, texte brut dans `input.rawText` fourni par l'adaptateur
 * Confluence).
 *
 * Numérotation stable (L1) : ordre des cases dans la page, `AC-n` reconstruit
 * à chaque lecture ; `pageId` entre dans le `stableKey` pour distinguer deux
 * pages qui porteraient le même texte.
 *
 * Limite connue (§6) : la page vit **hors du ticket**, donc le lien est
 * indirect — la fraîcheur de la page n'est pas celle du ticket, et l'écran
 * doit dire d'où vient le critère (§22 honnêteté).
 *
 * Souche L0 : la vraie analyse arrive au lot L1.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types.js';

export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
