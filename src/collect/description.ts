/**
 * Origine 2 (§6) — description du ticket (liste à puces, cases à cocher).
 *
 * Contenu : markdown déjà converti en texte brut par l'adaptateur Jira ; les
 * critères y sont des items de liste (`-`, `*`, `* [ ]`) ou des paragraphes
 * isolés, mélangés à du contexte.
 *
 * Règles de lecture :
 * - les blocs de code (` ``` `) et les titres (`#`) sont ignorés : ce sont des
 *   exemples et des sections, jamais des exigences ;
 * - un item de liste et un paragraphe sont tous deux des candidats ;
 * - un candidat sans **verbe d'exigence** (« doit », « ne doit pas »,
 *   « should », « shall », « est capable de », « refuse ») est une note de
 *   contexte, pas un critère : il est ignoré. C'est la limite du §6 — la
 *   description mélange critères et notes — traitée sans rien inventer.
 *
 * Numérotation stable (L1) : parcours ligne à ligne (`lineNumber`), chaque
 * item retenu devient `AC-n` dans l'ordre d'apparition ; la numérotation est
 * **reconstruite** à chaque extraction, ce qui rend le critère reconnaissable
 * d'un run à l'autre tant que la description n'est pas réordonnée.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import {
  buildCriteria,
  cleanText,
  hasRequirementVerb,
  isListLine,
  isTitleLine,
} from './normalize.js';
import type { CriterionCandidate } from './normalize.js';
import type { CollectInput, ExtractedCriterion } from './types.js';

/** Ouverture ou fermeture d'un bloc de code markdown. */
const CODE_FENCE = /^\s*(`{3,}|~{3,})/;

/** Titre markdown (`#`, `##`…) : une section, jamais un critère. */
const HEADING = /^#{1,6}\s+/;

/** Un paragraphe en cours de lecture : lignes accumulées et ligne de départ. */
interface Paragraph {
  lines: string[];
  lineNumber: number;
}

/** Une ligne ouvre-t-elle un bloc de code ? */
function isFence(line: string): boolean {
  return CODE_FENCE.test(line);
}

/** Ajoute une ligne au paragraphe en cours, ou en ouvre un. */
function appendParagraph(
  paragraph: Paragraph | null,
  line: string,
  lineNumber: number,
): Paragraph {
  if (!paragraph) return { lines: [line], lineNumber };
  paragraph.lines.push(line);
  return paragraph;
}

/** Un paragraphe devient un candidat s'il porte un verbe d'exigence. */
function paragraphCandidate(paragraph: Paragraph | null): CriterionCandidate | null {
  if (!paragraph) return null;
  const text = cleanText(paragraph.lines.join(' '));
  if (text.length === 0 || isTitleLine(text)) return null;
  if (!hasRequirementVerb(text)) return null;
  return { text, lineNumber: paragraph.lineNumber };
}

/**
 * Découpe la description en candidats : items de liste et paragraphes, hors
 * blocs de code et hors titres.
 */
function candidatesOf(rawText: string): CriterionCandidate[] {
  const lines = rawText.split(/\r?\n/);
  const candidates: CriterionCandidate[] = [];
  let paragraph: Paragraph | null = null;
  let inCode = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isFence(line)) {
      const flush = paragraphCandidate(paragraph);
      if (flush) candidates.push(flush);
      paragraph = null;
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (HEADING.test(line)) {
      const flush = paragraphCandidate(paragraph);
      if (flush) candidates.push(flush);
      paragraph = null;
      continue;
    }
    if (isListLine(line)) {
      const flush = paragraphCandidate(paragraph);
      if (flush) candidates.push(flush);
      paragraph = null;
      const text = cleanText(line);
      if (text.length === 0 || isTitleLine(text)) continue;
      if (!hasRequirementVerb(text)) continue;
      candidates.push({ text, lineNumber: index + 1 });
      continue;
    }
    if (line.trim().length === 0) {
      const flush = paragraphCandidate(paragraph);
      if (flush) candidates.push(flush);
      paragraph = null;
      continue;
    }
    paragraph = appendParagraph(paragraph, line, index + 1);
  }
  const flush = paragraphCandidate(paragraph);
  if (flush) candidates.push(flush);
  return candidates;
}

/**
 * Extrait les critères écrits dans la description du ticket.
 * Une phrase sans verbe d'exigence n'est pas un critère : elle est ignorée.
 */
export function extract(input: CollectInput): ExtractedCriterion[] {
  return buildCriteria(input, candidatesOf(input.rawText));
}
