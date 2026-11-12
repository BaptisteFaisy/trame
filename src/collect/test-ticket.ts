/**
 * Origine 5 (§6) — ticket de test dédié (sous-tâche « Test »).
 *
 * Contenu : le titre (et le résultat consigné) d'une sous-tâche de type Test
 * rattachée au ticket porteur ; `rawText` = titre, `issueId`/`ticketKey` =
 * ceux du ticket parent.
 *
 * Numérotation stable (L1) : `AC-n` par ordre de création des sous-tâches
 * Test (l'identifiant Jira de la sous-tâche entre dans `stableKey`, donc une
 * sous-tâche supprimée ne renumérote pas les autres).
 *
 * Limite connue (§6) : vocabulaire **libre**, rien n'est imposé au rédacteur —
 * le titre peut être vague (« test recette ») ; dans ce cas le critère est
 * détecté mais marqué non-faisable (§8.4), jamais complété d'office.
 *
 * Souche L0 : la vraie analyse arrive au lot L1.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types.js';

export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
