/**
 * Registre des collecteurs et extraction multi-origine (§6, §23).
 *
 * `extractAll` applique le collecteur de chaque origine, puis dédoublonne :
 * deux occurrences du même texte dans le même ticket (même `issueId`, même
 * empreinte §8.2) ne comptent qu'une fois — mais le doublon est **signalé**
 * (`duplicateRefs` sur l'exemplaire gardé), jamais silencieusement fondu,
 * car l'identifiant stable les distingue (§23).
 *
 * L'exemplaire gardé est celui de l'origine la plus sûre, dans l'ordre du §6 :
 * champ d'acceptation > description > tableau > page Confluence > ticket de
 * test > pièce jointe.
 *
 * Module pur : jamais d'import `@forge/*` (docs/CONTRACTS.md §3).
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CriterionOrigin } from '../types.js';
import type { CollectInput, ExtractedCriterion } from './types.js';
import { fingerprint } from './fingerprint.js';
import { extract as extractField } from './field.js';
import { extract as extractDescription } from './description.js';
import { extract as extractTable } from './table.js';
import { extract as extractConfluence } from './confluence.js';
import { extract as extractTestTicket } from './test-ticket.js';
import { extract as extractAttachment } from './attachment.js';

/** Un collecteur par gîte du §6 (signature gelée, docs/CONTRACTS.md §3). */
export const COLLECTORS: Record<CriterionOrigin, (input: CollectInput) => ExtractedCriterion[]> = {
  'acceptance-field': extractField,
  description: extractDescription,
  table: extractTable,
  'confluence-page': extractConfluence,
  'test-ticket': extractTestTicket,
  attachment: extractAttachment,
};

/** Origines de la plus sûre à la moins sûre (ordre du tableau §6). */
export const ORIGIN_TRUST_ORDER: readonly CriterionOrigin[] = [
  'acceptance-field',
  'description',
  'table',
  'confluence-page',
  'test-ticket',
  'attachment',
];

/** Rang de confiance d'une origine : 0 = la plus sûre (§6). */
function trustRank(origin: CriterionOrigin): number {
  const rank = ORIGIN_TRUST_ORDER.indexOf(origin);
  return rank < 0 ? ORIGIN_TRUST_ORDER.length : rank;
}

/** Extrait tous les matériaux, chacun avec le collecteur de son origine. */
function runCollectors(inputs: readonly CollectInput[]): ExtractedCriterion[] {
  const out: ExtractedCriterion[] = [];
  for (const input of inputs) {
    const collector = COLLECTORS[input.origin];
    if (collector) out.push(...collector(input));
  }
  return out;
}

/**
 * Dédoublonne par (`issueId`, texte empreinté) : garde l'origine la plus sûre
 * (§6) et liste les doublons écartés dans `duplicateRefs`, sans double-compter
 * la couverture (§23).
 */
function dedupe(
  extracted: readonly ExtractedCriterion[],
  inputs: readonly CollectInput[],
): ExtractedCriterion[] {
  const issueOf = new Map<ExtractedCriterion, string>();
  extracted.forEach((criterion, index) => {
    const input = inputs[index];
    if (input) issueOf.set(criterion, input.issueId);
  });
  const kept = new Map<string, ExtractedCriterion>();
  for (const criterion of extracted) {
    const issueId = issueOf.get(criterion) ?? '';
    const key = `${issueId}|${fingerprint(criterion.text)}`;
    const previous = kept.get(key);
    if (!previous) {
      kept.set(key, criterion);
    } else if (trustRank(criterion.origin) < trustRank(previous.origin)) {
      criterion.duplicateRefs = [previous.stableKey, ...(previous.duplicateRefs ?? [])];
      kept.set(key, criterion);
    } else {
      previous.duplicateRefs = [...(previous.duplicateRefs ?? []), criterion.stableKey];
    }
  }
  return [...kept.values()];
}

/**
 * Extraction complète d'un lot de matériaux : chaque origine collectée, puis
 * doublons signalés sans double-compte (§23). Les empreintes comparées le
 * sont via `sameFingerprint`, comparaison en temps constant (§8.2).
 */
export function extractAll(inputs: CollectInput[]): ExtractedCriterion[] {
  const extracted = runCollectors(inputs);
  return dedupe(extracted, inputs);
}

export type { CollectInput, ExtractedCriterion } from './types.js';
export { fingerprint, sameFingerprint, normalize } from './fingerprint.js';
