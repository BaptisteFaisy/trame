/**
 * Origine 6 (§6) — pièce jointe (recette, cahier de tests).
 *
 * Contenu : **rien de décodé**. L'app pointe la pièce jointe (`input.
 * attachmentRef`) et enregistre la référence déclarée ; elle ne lit ni PDF,
 * ni Excel, ni image. Un cahier de tests en pièce jointe existe dans la trame
 * comme référence, pas comme texte.
 *
 * Numérotation stable (L1) : le `stableKey` est la référence de la pièce
 * jointe elle-même — pas de `AC-n` reconstruit, puisqu'aucun item n'est lu.
 *
 * Limite connue (§6) : « l'app pointe, elle ne décode pas ». Aucun critère
 * textuel ne sort d'ici ; la couverture issue d'une pièce jointe reste une
 * déclaration référencée (§7 forme 3), jamais une extraction.
 *
 * Souche L0 : restera volontairement mince en L1.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types.js';

export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
