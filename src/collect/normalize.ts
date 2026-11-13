/**
 * Nettoyage, numérotation et jugements communs aux six origines (§6).
 *
 * Les six collecteurs lisent des matériaux très différents (liste d'items,
 * markdown, tableau, cases à cocher, titre de sous-tâche, référence). Ils
 * doivent tous produire la **même** forme de critère : le ménage est donc
 * fait ici, une seule fois. Dupliquer ces règles, ce serait six variantes
 * du même bug.
 *
 * Trois jugements sont partagés :
 * - le texte est nettoyé (puces, cases,numbers, espaces) ;
 * - le critère est numéroté (`AC-1`, `AC-2`…) et ancré par un `stableKey` ;
 * - le critère est signalé infalsifiable quand il ne peut pas être vérifié
 *   (marqueurs §8.4, texte trop court, phrase à moitié écrite §23).
 *
 * Module pur : jamais d'import `@forge/*` (docs/CONTRACTS.md §3).
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { MIN_CRITERION_LENGTH, UNFALSIFIABLE_MARKERS } from '../defaults';
import { createSecretScanner } from '../domain/secrets';
import type { CriterionTable } from '../ports';
import type { CollectInput, ExtractedCriterion } from './types';

/** Marqueur de liste ou de numérotation en tête de ligne. */
const LIST_MARKER =
  /^(?:[-*•·+–—]\s*|\(?\d{1,3}[.)]\s+|\(?[A-Za-z][.)]\s+|\d{1,3}\s*[-–—:]\s+|AC[-\s]?\d+\s*[:.-]?\s+)/i;

/** Case à cocher en tête de ligne : `[ ]`, `[x]`, `☐`, `☑`, `☒`. */
const CHECKBOX_MARKER = /^(?:\[[ xX]\]|[☐☑☒])\s*/;

/** Titre markdown (`##`) en tête de ligne. */
const MARKDOWN_HEADING = /^#{1,6}\s+/;

/** Titres de section rencontrés dans les matériaux (§6, origine 1). */
const TITLE_WORDS: readonly string[] = [
  "critères d'acceptation",
  "critère d'acceptation",
  'critères dacceptation',
  "criteres d'acceptation",
  'acceptance criteria',
  'acceptance criterion',
  'prérequis',
  'prerequis',
  'description',
  'contexte',
  'notes',
  'objectif',
  'objectifs',
  'résultat attendu',
  'resultat attendu',
];

/**
 * Verbes d'exigence acceptés dans une description (§6, origine 2) : une
 * phrase sans verbe d'exigence est une note de contexte, pas un critère.
 */
const REQUIREMENT_PATTERNS: readonly RegExp[] = [
  /\bdoit\b/i,
  /\bne doit pas\b/i,
  /\bshould\b/i,
  /\bshall\b/i,
  /\best capable de\b/i,
  /\bêtre capable de\b/i,
  /\brefuse\b/i,
];

/** Phrase arrêtée sur le verbo d'exigence : « le système doit » (§23). */
const HALF_WRITTEN = /(?:doit|doivent|devra|devront|shall|should)\s*[.!…]*$/i;

/** Texte laissé en chantier : « à compléter », « TODO ». */
const WORK_IN_PROGRESS = /(?:à compléter|a completer|TODO|TBD)\b/i;

/** Le scanner de secrets (§5) : un seul exemplaire, aucun état global. */
const secretScanner = createSecretScanner();

/** Échappe un littéral pour l'utiliser dans une expression régulière. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Une clé de titre comparée sans apostrophe typographique ni ponctuation. */
function titleKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.:*_`]+$/, '')
    .trim();
}

/** Un texte est-il un titre (titre markdown, titre de section) ? */
export function isTitleLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (MARKDOWN_HEADING.test(trimmed)) return true;
  if (TITLE_WORDS.includes(titleKey(trimmed))) return true;
  return trimmed.length <= 60 && trimmed.endsWith(':');
}

/**
 * Nettoie un texte de critère : puces, cases, numéros, espaces (§6).
 * L'ordre compte — une case peut suivre une puce (« - [ ] texte »).
 */
export function cleanText(raw: string): string {
  let text = raw.trim();
  text = text.replace(LIST_MARKER, '');
  text = text.replace(CHECKBOX_MARKER, '');
  text = text.replace(LIST_MARKER, '');
  return text.replace(/\s+/g, ' ').trim();
}

/** Retire la puce de liste en tête de ligne, sans autre nettoyage. */
export function stripListMarker(raw: string): string {
  return raw.trim().replace(LIST_MARKER, '').trim();
}

/**
 * Le texte est-il une case à cocher ? Renvoie le texte de la case, sinon
 * `undefined` — une puce seule n'est pas une case.
 */
export function checkboxContent(raw: string): string | undefined {
  const withoutBullet = stripListMarker(raw);
  if (withoutBullet.length === 0) return undefined;
  const match = CHECKBOX_MARKER.exec(withoutBullet);
  if (!match) return undefined;
  return withoutBullet.slice(match[0].length).trim();
}

/**
 * L'état d'une case à cocher : « cochée », « non cochée », ou `undefined` si
 * la ligne n'est pas une case. L'état **documente** le critère, il ne le
 * qualifie pas : une case cochée reste une exigence (§6).
 */
export function checkboxState(raw: string): 'cochée' | 'non cochée' | undefined {
  const withoutBullet = stripListMarker(raw);
  const match = CHECKBOX_MARKER.exec(withoutBullet);
  if (!match) return undefined;
  return /[xX☑☒]/.test(match[0]) ? 'cochée' : 'non cochée';
}

/** Une ligne de liste (puce, case, numérotation) ? */
export function isListLine(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return false;
  if (checkboxContent(trimmed) !== undefined) return true;
  return /^[-*•·+–—]\s+/.test(trimmed) || /^\(?\d{1,3}[.)]\s+/.test(trimmed);
}

/** La phrase contient-elle un verbe d'exigence ? (§6, origine 2) */
export function hasRequirementVerb(text: string): boolean {
  return REQUIREMENT_PATTERNS.some((pattern) => pattern.test(text));
}

/** Numéro stable d'un critère dans son périmètre : `AC-1`, `AC-2`… */
export function criterionKey(index: number): string {
  return `AC-${index}`;
}

/**
 * La portée d'un matériau : ce qui distingue deux sources du même texte
 * (page Confluence, sous-tâche de test, second tableau). Elle entre dans le
 * `stableKey`.
 */
export function scopeOf(input: CollectInput): string {
  if (input.origin === 'confluence-page') return input.pageId ?? input.sourceId ?? '';
  return input.sourceId ?? '';
}

/**
 * Identifiant stable d'un critère : `issueId|origine[:portée]|clé`.
 *
 * La clé est celle de l'origine (position dans le matériau) : elle ne bouge
 * pas quand un autre critère apparaît ailleurs dans le ticket — c'est
 * l'empreinte (§8.2) qui, elle, détecte le changement de texte.
 */
export function stableKeyOf(input: CollectInput, key: string, scope?: string): string {
  const portee = scope ?? scopeOf(input);
  const origine = portee.length > 0 ? `${input.origin}:${portee}` : input.origin;
  return `${input.issueId}|${origine}|${key}`;
}

/** Famille de secret présente dans un texte (§5) : jamais la valeur. */
export function secretFlagOf(text: string): string | undefined {
  const found = secretScanner.scan(text);
  return found.clean ? undefined : found.findings.join(', ');
}

/** Indice d'infalsifiabilité : marqueur §8.4, longueur, phrase inachevée. */
export function unfalsifiableHintOf(text: string): string | undefined {
  const reasons: string[] = [];
  const marker = markerReason(text);
  if (marker) reasons.push(marker);
  if (text.trim().length < MIN_CRITERION_LENGTH) {
    reasons.push(`texte trop court (moins de ${MIN_CRITERION_LENGTH} caractères)`);
  }
  if (HALF_WRITTEN.test(text.trim()) || WORK_IN_PROGRESS.test(text)) {
    reasons.push('texte à moitié écrit : la phrase s’arrête sur le verbe d’exigence');
  }
  return reasons.length > 0 ? reasons.join(' ; ') : undefined;
}

/** Le texte contient-il un marqueur de non-falsifiabilité (§8.4) ? */
function markerReason(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const marker of UNFALSIFIABLE_MARKERS) {
    const pattern = new RegExp(`(?<![\\p{L}])${escapeRegExp(marker)}(?![\\p{L}])`, 'u');
    if (pattern.test(lower)) return `adjectif non vérifiable : « ${marker} »`;
  }
  return undefined;
}

/** Un critère en cours de fabrication, avant contrôle. */
export interface CriterionDraft {
  /** Texte du critère (déjà nettoyé). */
  text: string;
  /** Numéro du critère dans son périmètre. */
  key: string;
  /** Ligne d'apparition dans le matériau (1-based). */
  lineNumber?: number;
  /** Note jointe : elle documente, elle ne crée pas de critère. */
  documentation?: string;
  /** Indice supplémentaire (ex. titre de test sans exigence formulée). */
  extraHint?: string;
}

/** Un texte candidat, avant numérotation. */
export interface CriterionCandidate {
  /** Texte déjà nettoyé (puces, cases, numéros, espaces). */
  text: string;
  /** Ligne d'apparition dans le matériau (1-based), si le matériau est en lignes. */
  lineNumber?: number;
  /** Note jointe : elle documente, elle ne crée pas de critère (§6, origine 5). */
  documentation?: string;
  /** Indice supplémentaire (ex. titre de test sans exigence formulée). */
  extraHint?: string;
}

/**
 * Numérote des candidats dans l'ordre d'apparition : `AC-1`, `AC-2`, …
 *
 * Un candidat écarté (texte vide ou portant un secret, §5) ne consomme pas de
 * numéro : la suite reste consécutive, et une ré-extraction sur un matériau
 * inchangé donne la même numérotation (§6).
 */
export function buildCriteria(
  input: CollectInput,
  candidates: readonly CriterionCandidate[],
): ExtractedCriterion[] {
  const out: ExtractedCriterion[] = [];
  for (const candidate of candidates) {
    const criterion = buildCriterion(input, {
      text: candidate.text,
      key: criterionKey(out.length + 1),
      lineNumber: candidate.lineNumber,
      documentation: candidate.documentation,
      extraHint: candidate.extraHint,
    });
    if (criterion) out.push(criterion);
  }
  return out;
}

/**
 * Fabrique un critère : nettoyage final, ancrage, indice d'infalsifiabilité.
 *
 * Renvoie `undefined` quand le texte est vide **ou** porte un secret : un
 * critère qui contient une clé n'est jamais retourné, donc jamais indexé
 * (§5, recette 20). Le signalement est fait par `flagSecrets` (§5).
 */
export function buildCriterion(
  input: CollectInput,
  draft: CriterionDraft,
): ExtractedCriterion | undefined {
  const text = draft.text.trim();
  if (text.length === 0) return undefined;
  if (secretFlagOf(text) !== undefined) return undefined;
  const criterion: ExtractedCriterion = {
    criterionKey: draft.key,
    text,
    origin: input.origin,
    stableKey: stableKeyOf(input, draft.key),
  };
  if (draft.lineNumber !== undefined) criterion.lineNumber = draft.lineNumber;
  if (draft.documentation !== undefined) criterion.documentation = draft.documentation;
  const hint = joinHints(unfalsifiableHintOf(text), draft.extraHint);
  if (hint !== undefined) criterion.unfalsifiableHint = hint;
  return criterion;
}

/** Assemble deux indices d'infalsifiabilité sans les confondre. */
function joinHints(base: string | undefined, extra: string | undefined): string | undefined {
  if (base && extra) return `${base} ; ${extra}`;
  return base ?? extra;
}

/** Les matériaux textuels d'une origine (texte, colonnes, lignes). */
export function materialsOf(input: CollectInput): string[] {
  const materials: string[] = [];
  if (input.rawText.trim().length > 0) materials.push(input.rawText);
  if (input.table) {
    for (const column of input.table.columns) {
      if (column.trim().length > 0) materials.push(column);
    }
    for (const row of input.table.rows) {
      for (const cell of row) {
        if (cell.trim().length > 0) materials.push(cell);
      }
    }
  }
  return materials;
}

/** Une colonne de tableau et son indice (l'indice est la structure, §6). */
export interface TableColumn {
  /** Texte de l'en-tête de colonne, nettoyé. */
  text: string;
  /** Indice de la colonne dans le tableau (0-based). */
  columnIndex: number;
}

/**
 * Les colonnes d'un tableau qui portent un nom exploitable : une colonne vide
 * ne donne aucun critère (§6), mais son indice reste dans la structure.
 */
export function tableColumns(table: CriterionTable): TableColumn[] {
  const columns: TableColumn[] = [];
  table.columns.forEach((column, columnIndex) => {
    const text = cleanText(column);
    if (text.length === 0) return;
    columns.push({ text, columnIndex });
  });
  return columns;
}
