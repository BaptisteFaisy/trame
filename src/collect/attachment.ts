/**
 * Origine 6 (§6) — pièce jointe (recette, cahier de tests).
 *
 * Contenu : **rien de décodé**. L'app pointe la pièce jointe
 * (`input.attachmentRef`) et enregistre la référence déclarée ; elle ne lit ni
 * PDF, ni Excel, ni image. Un cahier de tests en pièce jointe existe dans la
 * trame comme référence, pas comme texte.
 *
 * Numérotation stable (L1) : aucun `AC-n` n'est reconstruit, puisqu'aucun item
 * n'est lu ; la référence de la pièce jointe est l'identifiant stable.
 *
 * Limite connue (§6) : « l'app pointe, elle ne décode pas ». Aucun critère
 * textuel ne sort d'ici ; la couverture issue d'une pièce jointe reste une
 * déclaration référencée (§7 forme 3), jamais une extraction.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types';

/**
 * La référence déclarée de la pièce jointe.
 *
 * Chaîne vide si la pièce n'a pas de référence : mieux vaut une absence
 * visible qu'une référence inventée (§5, l'app n'invente rien).
 */
export function attachmentReference(input: CollectInput): string {
  return input.attachmentRef?.trim() ?? '';
}

/**
 * Extrait les critères d'une pièce jointe : il n'y en a pas.
 *
 * L'app pointe la pièce jointe, elle ne la décode pas (§6) : la référence
 * déclarée est conservée par l'appelant, aucun texte n'est produit.
 */
export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
