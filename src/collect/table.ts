/**
 * Origine 3 (§6) — tableau de critères (colonnes).
 *
 * Contenu : `input.table` (`CriterionTable` : `columns` puis `rows`). Chaque
 * colonne porte un critère, chaque ligne un cas de test qui l'exerce.
 *
 * Numérotation stable (L1) : `AC-n` = indice de la colonne (l'ordre des
 * colonnes est la structure du tableau) ; les lignes ne numérotent pas le
 * critère, elles documentent ses cas. `stableKey` ancre colonne + ticket.
 *
 * Limite connue (§6) : mise en forme variable, colonnes vides — une colonne
 * sans nom exploitable ne produit pas de critère ; le tableau est signalé
 * comme partiellement lu plutôt que complété au hasard.
 *
 * Souche L0 : la vraie analyse arrive au lot L1.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types.js';

export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
