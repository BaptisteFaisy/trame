/**
 * Origine 4 (§6) — page Confluence (checklist).
 *
 * Contenu : cases à cocher d'une page liée au ticket (`input.pageId`, texte
 * brut dans `input.rawText` fourni par l'adaptateur Confluence).
 *
 * Règles de lecture :
 * - une case à cocher = un critère, cochée ou non : la case décrit l'exigence,
 *   pas son état d'avancement ;
 * - une liste à puces simple n'est pas retenue : dans une page, une puce est
 *   souvent de la documentation, une case à cocher est un engagement ;
 * - les titres et les blocs de code sont ignorés, comme dans la description.
 *
 * Numérotation stable (L1) : ordre des cases dans la page, `AC-n` reconstruit
 * à chaque lecture ; `pageId` entre dans le `stableKey` pour distinguer deux
 * pages qui porteraient le même texte.
 *
 * Limite connue (§6) : la page vit **hors du ticket**, donc le lien est
 * indirect — la fraîcheur de la page n'est pas celle du ticket, et l'écran
 * doit dire d'où vient le critère (§22 honnêteté). Les tableaux d'une page
 * sont lus par le collecteur `table` : une seule origine par matériau, pour
 * ne pas compter deux fois.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { buildCriteria, checkboxContent, isTitleLine } from './normalize';
import type { CriterionCandidate } from './normalize';
import type { CollectInput, ExtractedCriterion } from './types';

/** Un bloc de code markdown : on ne lit pas un exemple comme une exigence. */
const CODE_FENCE = /^\s*(`{3,}|~{3,})/;

/** Titre markdown (`#`) : une section, pas une case. */
const HEADING = /^#{1,6}\s+/;

/** Les cases à cocher d'une page, dans l'ordre de lecture. */
function candidatesOf(rawText: string): CriterionCandidate[] {
  const lines = rawText.split(/\r?\n/);
  const candidates: CriterionCandidate[] = [];
  let inCode = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (CODE_FENCE.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (HEADING.test(line)) continue;
    const content = checkboxContent(line);
    if (content === undefined) continue;
    const text = content.trim();
    if (text.length === 0 || isTitleLine(text)) continue;
    candidates.push({ text, lineNumber: index + 1 });
  }
  return candidates;
}

/**
 * Extrait les critères d'une page Confluence : une case à cocher = un
 * critère, que la case soit cochée ou non.
 */
export function extract(input: CollectInput): ExtractedCriterion[] {
  return buildCriteria(input, candidatesOf(input.rawText));
}
