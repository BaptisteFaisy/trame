/**
 * Origine 1 (§6) — champ « critères d'acceptation » du ticket.
 *
 * Contenu : une liste d'items déjà structurée par l'équipe, c'est le gîte le
 * plus sûr et le plus stable des six.
 *
 * Numérotation stable (L1) : ordre d'apparition des items dans le champ ;
 * `AC-1`, `AC-2`, … reconstruits à chaque extraction, donc stables tant que
 * l'ordre du champ ne bouge pas — un item inséré au milieu renumérote la
 * suite, et l'empreinte (§8.2) signale alors la perforation correspondante.
 *
 * Limite connue (§6) : certaines équipes n'utilisent pas le champ — un champ
 * absent ou vide ne produit aucun critère, jamais un critère inventé.
 *
 * Souche L0 : la vraie analyse arrive au lot L1.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CollectInput, ExtractedCriterion } from './types.js';

export function extract(input: CollectInput): ExtractedCriterion[] {
  void input;
  return [];
}
