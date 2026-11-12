/**
 * Origine 5 (§6) — ticket de test dédié (sous-tâche « Test »).
 *
 * Contenu : le titre d'une sous-tâche de type Test rattachée au ticket
 * porteur (`rawText`), et le résultat consigné par l'exécutant
 * (`resultText`). `issueId`/`ticketKey` restent ceux du ticket parent : le
 * critère appartient au parent, la sous-tâche n'en est que le gîte.
 *
 * Règles de lecture :
 * - le **titre** est le critère détecté : il dit ce que la sous-tâche vérifie
 *   du ticket parent ;
 * - le **résultat** ne crée jamais de critère : il documente celui du titre
 *   (`documentation`). Un résultat est un acte de vérification, pas une
 *   exigence — en faire un critère serait créer un fil de chaîne (§5) ;
 * - un titre générique (« test recette ») est détecté mais marqué
 *   infalsifiable : on ne complète jamais d'office (§8.4).
 *
 * Numérotation stable (L1) : `AC-n` par sous-tâche (une sous-tâche porte un
 * critère) ; l'identifiant de la sous-tâche (`sourceId`) entre dans le
 * `stableKey`, donc une sous-tâche supprimée ne renumérote pas les autres.
 *
 * Limite connue (§6) : vocabulaire **libre**, rien n'est imposé au rédacteur.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { buildCriterion, cleanText, criterionKey, isTitleLine } from './normalize.js';
import type { CollectInput, ExtractedCriterion } from './types.js';

/** Les mots d'emballage d'un titre de test : « test », « de », « recette »… */
const GENERIC_WORDS =
  /\b(?:tests?|recettes?|vérifications?|verifications?|contrôles?|controles?|qa|cas|fonctionnel(?:le)?s?|unitaires?|intégrations?|integrations?|manuel(?:le)?s?|smoke|de|du|des|le|la|les|et|a|à)\b/gi;

/**
 * Un titre qui ne dit rien : une fois retirés les mots d'emballage, il ne
 * reste aucune exigence (« test recette » → vide).
 */
function isVagueTitle(text: string): boolean {
  return text.replace(GENERIC_WORDS, ' ').replace(/\s+/g, ' ').trim().length < 3;
}

/** Le résultat consigné, en documentation du critère — jamais un critère. */
function resultOf(input: CollectInput, restOfLines: string[]): string {
  const parts: string[] = [];
  if (input.resultText && input.resultText.trim().length > 0) {
    parts.push(cleanText(input.resultText));
  }
  for (const line of restOfLines) {
    const cleaned = cleanText(line);
    if (cleaned.length > 0) parts.push(cleaned);
  }
  return parts.join(' ').trim();
}

/**
 * Extrait le critère porté par une sous-tâche de test.
 * Le titre devient le critère ; le résultat le documente.
 */
export function extract(input: CollectInput): ExtractedCriterion[] {
  const lines = input.rawText.split(/\r?\n/);
  let titleIndex = -1;
  let title = '';
  for (let index = 0; index < lines.length; index += 1) {
    const cleaned = cleanText(lines[index]);
    if (cleaned.length === 0) continue;
    title = cleaned;
    titleIndex = index;
    break;
  }
  if (title.length === 0 || isTitleLine(title)) return [];

  const documentation = resultOf(input, lines.slice(titleIndex + 1));
  const extraHint = isVagueTitle(title)
    ? 'titre de test sans exigence formulée (§8.4)'
    : undefined;

  const criterion = buildCriterion(input, {
    text: title,
    key: criterionKey(1),
    lineNumber: titleIndex + 1,
    documentation: documentation.length > 0 ? documentation : undefined,
    extraHint,
  });
  return criterion ? [criterion] : [];
}
