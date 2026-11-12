/**
 * Origine 1 (§6) — champ « critères d'acceptation » du ticket.
 *
 * Contenu : une liste d'items déjà structurée par l'équipe, c'est le gîte le
 * plus sûr et le plus stable des six.
 *
 * Règles de lecture :
 * - une ligne = un critère ; une ligne vide est ignorée ;
 * - une ligne de titre (« Critères d'acceptation ») est ignorée ;
 * - le texte est nettoyé (puces, cases, numéros, espaces) ;
 * - une ligne « Given / When / Then » est un critère comme une autre : la
 *   ligne dit ce qui est attendu, pas comment elle est rédigée.
 *
 * Numérotation stable (L1) : ordre d'apparition des items dans le champ ;
 * `AC-1`, `AC-2`, … reconstruits à chaque extraction, donc stables tant que
 * l'ordre du champ ne bouge pas — un item inséré au milieu renumérote la
 * suite, et l'empreinte (§8.2) signale alors la perforation correspondante.
 *
 * Limite connue (§6) : certaines équipes n'utilisent pas le champ — un champ
 * absent ou vide ne produit aucun critère, jamais un critère inventé.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { buildCriteria, cleanText, isTitleLine } from './normalize.js';
import type { CriterionCandidate } from './normalize.js';
import type { CollectInput, ExtractedCriterion } from './types.js';

/**
 * Les lignes du champ deviennent des candidats : ligne vide ignorée, ligne
 * de titre ignorée, le reste est un critère.
 */
function candidatesOf(rawText: string): CriterionCandidate[] {
  const lines = rawText.split(/\r?\n/);
  const candidates: CriterionCandidate[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const text = cleanText(lines[index]);
    if (text.length === 0) continue;
    if (isTitleLine(text)) continue;
    candidates.push({ text, lineNumber: index + 1 });
  }
  return candidates;
}

/**
 * Extrait les critères du champ « critères d'acceptation ».
 * Une ligne vide ou un titre est ignoré ; tout le reste est un critère.
 */
export function extract(input: CollectInput): ExtractedCriterion[] {
  return buildCriteria(input, candidatesOf(input.rawText));
}
