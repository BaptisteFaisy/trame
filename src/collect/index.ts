/**
 * Registre des collecteurs et extraction multi-origine (§6, §23).
 *
 * `extractAll` applique le collecteur de chaque origine, puis :
 * 1. **déduplique** par (`issueId`, empreinte du texte §8.2) : deux
 *    occurrences du même texte dans le same ticket ne comptent qu'une fois —
 *    mais le doublon est **signalé** (`duplicateRefs` sur l'exemplaire gardé),
 *    jamais silencieusement fondu, car l'identifiant stable les distingue
 *    (§23) ;
 * 2. **renumérote** par ticket : les `AC-1`, `AC-2`… d'un ticket se suivent
 *    sans trou, toutes origines confondues.
 *
 * L'exemplaire gardé est celui de l'origine la plus sûre, dans l'ordre de
 * confiance documenté : champ d'acceptation > description > tableau > ticket
 * de test > page Confluence > pièce jointe.
 *
 * Les critères infalsifiables (§8.4 : marqueur, texte trop court, phrase à
 * moitié écrite) sont renvoyés avec `unfalsifiableHint` renseigné : ils
 * existent, ils ne comptent ni comme trou ni comme couverture.
 *
 * Module pur : jamais d'import `@forge/*` (docs/CONTRACTS.md §3).
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CriterionOrigin } from '../types';
import type { CollectInput, ExtractedCriterion, SecretSignal } from './types';
import { fingerprint } from './fingerprint';
import { materialsOf, secretFlagOf } from './normalize';
import { extract as extractField } from './field';
import { extract as extractDescription } from './description';
import { extract as extractTable } from './table';
import { extract as extractConfluence } from './confluence';
import { extract as extractTestTicket } from './test-ticket';
import { extract as extractAttachment } from './attachment';

/** Un collecteur par gîte du §6 (signature gelée, docs/CONTRACTS.md §3). */
export const COLLECTORS: Record<CriterionOrigin, (input: CollectInput) => ExtractedCriterion[]> = {
  'acceptance-field': extractField,
  description: extractDescription,
  table: extractTable,
  'confluence-page': extractConfluence,
  'test-ticket': extractTestTicket,
  attachment: extractAttachment,
};

/**
 * Origines de la plus sûre à la moins sûre (ordre de confiance documenté,
 * §6) : le champ d'acceptation est écrit par l'équipe, la description est un
 * melting-pot, le tableau est structuré mais à mise en forme variable, le
 * ticket de test a un vocabulaire libre, la page Confluence est hors du
 * ticket (lien indirect) et la pièce jointe n'est que référencée.
 */
export const ORIGIN_TRUST_ORDER: readonly CriterionOrigin[] = [
  'acceptance-field',
  'description',
  'table',
  'test-ticket',
  'confluence-page',
  'attachment',
];

/** Rang de confiance d'une origine : 0 = la plus sûre (§6). */
function trustRank(origin: CriterionOrigin): number {
  const rank = ORIGIN_TRUST_ORDER.indexOf(origin);
  return rank < 0 ? ORIGIN_TRUST_ORDER.length : rank;
}

/**
 * Un critère extrait, rattaché à son matériau : le registre a besoin de savoir
 * d'où il vient pour rejouer la numérotation et le dédoublonnage.
 */
interface Extracted {
  input: CollectInput;
  /** Rang du matériau dans la liste reçue : départ de l'ordre stable. */
  inputIndex: number;
  /** Rang du critère dans son matériau : départ de l'ordre stable. */
  position: number;
  criterion: ExtractedCriterion;
}

/** Applique le collecteur de chaque origine à son matériau. */
function runCollectors(inputs: readonly CollectInput[]): Extracted[] {
  const out: Extracted[] = [];
  inputs.forEach((input, inputIndex) => {
    const collector = COLLECTORS[input.origin];
    if (!collector) return;
    collector(input).forEach((criterion, position) => {
      out.push({ input, inputIndex, position, criterion });
    });
  });
  return out;
}

/** Ordre de confiance, puis ordre d'apparition : le même à chaque extraction. */
function byTrustThenAppearance(a: Extracted, b: Extracted): number {
  const byTrust = trustRank(a.input.origin) - trustRank(b.input.origin);
  if (byTrust !== 0) return byTrust;
  if (a.inputIndex !== b.inputIndex) return a.inputIndex - b.inputIndex;
  return a.position - b.position;
}

/**
 * Deux matériaux de même origine peuvent porter la même clé locale (deux
 * sous-tâches de test sans identifiant, deux pages sans portée) : on suffixe
 * alors le `stableKey` pour qu'il reste unique dans le ticket.
 */
function disambiguate(extracted: readonly Extracted[]): void {
  const seen = new Set<string>();
  for (const item of extracted) {
    const base = item.criterion.stableKey;
    if (!seen.has(base)) {
      seen.add(base);
      continue;
    }
    let suffix = 2;
    while (seen.has(`${base}#${suffix}`)) suffix += 1;
    item.criterion.stableKey = `${base}#${suffix}`;
    seen.add(item.criterion.stableKey);
  }
}

/**
 * Dédoublonne par (`issueId`, texte empreinté) : garde l'origine la plus sûre
 * (§6) et liste les doublons écartés dans `duplicateRefs`, sans double-compter
 * la couverture (§23).
 *
 * Le `stableKey` des deux exemplaires reste distinct : c'est lui qui permet de
 * dire « le même critère a été écrit deux fois » sans le confondre.
 */
function dedupe(extracted: readonly Extracted[]): Extracted[] {
  const kept = new Map<string, Extracted>();
  const out: Extracted[] = [];

  for (const item of extracted) {
    const key = `${item.input.issueId}|${fingerprint(item.criterion.text)}`;
    const previous = kept.get(key);
    if (!previous) {
      kept.set(key, item);
      out.push(item);
      continue;
    }
    const previousRefs = previous.criterion.duplicateRefs ?? [];
    previous.criterion.duplicateRefs = [...previousRefs, item.criterion.stableKey];
  }
  return out;
}

/**
 * Numérotation stable par ticket (§6) : les `AC-n` d'un ticket se suivent
 * dans l'ordre d'apparition, toutes origines confondues — un critère de
 * description ne peut pas hériter du `AC-1` du champ sans que les deux ne se
 * marchent dessus.
 *
 * L'ordre est celui des origines de confiance (le champ d'abord), puis l'ordre
 * d'apparition dans le matériau : à matériaux égaux, le résultat est le même
 * à chaque extraction.
 */
function renumber(extracted: readonly Extracted[]): void {
  const sorted = [...extracted].sort(byTrustThenAppearance);
  const counters = new Map<string, number>();
  for (const item of sorted) {
    const next = (counters.get(item.input.issueId) ?? 0) + 1;
    counters.set(item.input.issueId, next);
    item.criterion.criterionKey = `AC-${next}`;
  }
}

/**
 * Extraction complète d'un lot de matériaux : chaque origine collectée, puis
 * doublons signalés sans double-compte (§23).
 */
export function extractAll(inputs: CollectInput[]): ExtractedCriterion[] {
  const extracted = runCollectors(inputs);
  disambiguate(extracted);
  const ordered = [...extracted].sort(byTrustThenAppearance);
  const kept = dedupe(ordered);
  renumber(kept);
  return kept.map((item) => item.criterion);
}

/**
 * Signale les matériaux qui portent un secret (§5, recette 20).
 *
 * Un critère contenant une clé n'est jamais renvoyé par les collecteurs ;
 * ce signal dit **quel** matériau et **quelle famille** de secret, jamais la
 * valeur — la recopier serait la publier (§5).
 */
export function flagSecrets(inputs: CollectInput[]): SecretSignal[] {
  const signals: SecretSignal[] = [];
  for (const input of inputs) {
    for (const material of materialsOf(input)) {
      const secretFlag = secretFlagOf(material);
      if (!secretFlag) continue;
      signals.push({
        issueId: input.issueId,
        ticketKey: input.ticketKey,
        origin: input.origin,
        secretFlag,
        textHash: fingerprint(material),
      });
    }
  }
  return signals;
}

export type { CollectInput, ExtractedCriterion, SecretSignal } from './types';
export { fingerprint, sameFingerprint, normalize } from './fingerprint';
export { attachmentReference } from './attachment';
