/**
 * Conversion **pure** des commentaires Jira en actes de vérification
 * (`IssueComment[] → Verification[]`) — §7 formes 5 et 7.
 *
 * Trois formes sortent d'un commentaire, et une seule force chacune :
 * - **forme 5 — `traced-manual`** (force **déclarée**) : un commentaire daté
 *   qui porte une **checklist exécutée** (`- [x] …`). La checklist est la
 *   trace : ce qui a été fait est écrit, ligne par ligne ;
 * - **forme 3 — `third-party`** (force **attestée**) : un commentaire qui
 *   **référence un artefact** (rapport de scan, compte rendu de recette,
 *   benchmark) en même temps qu'il affirme la vérification. L'artefact est
 *   la preuve (§7) — et il est **référencé**, jamais recopié (§18) ;
 * - **forme 7 — `declaration`** (force **déclarée**) : un commentaire qui dit
 *   « vérifié » **sans artefact**. C'est une affirmation : la trame est
 *   « pleine de papier », et le rapport le dit dans ces termes (§7).
 *
 * Un commentaire qui ne prouve rien (une question, une discussion) ne devient
 * **jamais** un acte : il n'est ni compté, ni montré. Un commentaire **sans
 * date** est écarté : un acte sans date ne peut pas servir à détecter une
 * perforation (§8.2) — on n'invente donc jamais une date (§18).
 *
 * Module **pur** : ni réseau, ni horloge, ni Forge.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { IssueComment } from '../ports.js';
import type { Strength, Verification, VerificationForm } from '../types.js';
import { DEFAULT_STRENGTH_BY_FORM } from '../defaults.js';

/** Ce qui est journalisé quand un commentaire est écarté. */
export type CommentReport = (message: string, meta?: unknown) => void;

/** Les options de la conversion : quoi journaliser, et c'est tout. */
export interface CommentMappingOptions {
  /** La clé lisible du ticket (`PROJ-12`), quand on la connaît. */
  readonly ticketKey?: string;
  /** Journal des commentaires écartés ; absent = aucun journal. */
  readonly report?: CommentReport;
}

/** Une case cochée d'une checklist : `- [x] le scénario passe`. */
const CHECKED_ITEM = /^\s*[-*]\s*\[x\]\s*(.+)$/gim;

/**
 * Les bords d'un mot, **accents compris** : le `\b` de JavaScript ignore les
 * lettres accentuées, et « vérifié » ne serait jamais reconnu.
 */
const BEFORE_WORD = '(?<![A-Za-zÀ-ÖØ-öø-ÿ0-9_])';
const AFTER_WORD = '(?![A-Za-zÀ-ÖØ-öø-ÿ0-9_])';

/** Une affirmation de vérification : « vérifié », « tested », « conforme ». */
const ASSERTION = new RegExp(
  `${BEFORE_WORD}(vérifi(?:e|és?|ées?)|verifi(?:ed)?|valid(?:e|és?|ées?)|` +
    `test(?:e|és?|ées?)|tested|passed|conforme|compliant|ok)${AFTER_WORD}`,
  'i',
);

/** Une affirmation d'échec : « ça ne marche pas », « failed ». */
const FAILURE = new RegExp(
  `${BEFORE_WORD}(échec|échoué|échouée|echec|echoue|ko|failed|failure|casse|` +
    `bloquant|bloquante|ne fonctionne pas|does not work)${AFTER_WORD}`,
  'i',
);

/** Un artefact cité : une URL, ou une pièce jointe de Jira. */
const ARTIFACT = /(https?:\/\/\S+)|(\[~[^~\]]+\])|(attachment:\/\/\S+)/i;

/** Les cases cochées d'une checklist, dans l'ordre du commentaire. */
export function checkedItems(body: string): string[] {
  const items: string[] = [];
  for (const match of body.matchAll(CHECKED_ITEM)) {
    const text = match[1].trim();
    if (text.length > 0) items.push(text);
  }
  return items;
}

/** Vrai si le commentaire affirme qu'une vérification a été faite. */
export function assertsVerification(body: string): boolean {
  return ASSERTION.test(body);
}

/** Vrai si le commentaire rapporte un échec. */
export function assertsFailure(body: string): boolean {
  return FAILURE.test(body);
}

/** L'artefact cité par le commentaire, s'il y en a un. */
export function artifactOf(body: string): string | undefined {
  const match = ARTIFACT.exec(body);
  return match ? match[0] : undefined;
}

/** Un identifiant d'acte stable : le même commentaire donne toujours le même acte. */
function actId(issueId: string, commentId: string): string {
  return `ver_comment_${`${issueId}_${commentId}`.replace(/[^A-Za-z0-9_-]+/g, '_')}`;
}

/** Le statut de l'acte : un commentaire qui dit « ça échoue » est un échec. */
function statusOf(body: string): 'passed' | 'failed' {
  return FAILURE.test(body) ? 'failed' : 'passed';
}

/** Un nom lisible et borné pour l'acte. */
function actName(prefix: string, detail: string): string {
  const clean = detail.replace(/\s+/g, ' ').trim();
  return clean.length > 80 ? `${clean.slice(0, 79)}…` : `${prefix} : ${clean}`;
}

/**
 * La forme d'un commentaire : la checklist d'abord (c'est la trace), puis
 * l'artefact (c'est la preuve), puis l'affirmation seule (c'est une
 * déclaration). Un commentaire qui rapporte un **échec** est un acte aussi :
 * son statut le dit, il n'est pas effacé (§7).
 */
function formOf(body: string): { form: VerificationForm; detail: string } | null {
  const items = checkedItems(body);
  if (items.length > 0) return { form: 'traced-manual', detail: items[0] };
  if (!assertsVerification(body) && !assertsFailure(body)) return null;
  const artifact = artifactOf(body);
  if (artifact) return { form: 'third-party', detail: artifact };
  return { form: 'declaration', detail: body.replace(/\s+/g, ' ').trim() };
}

/**
 * Convertit les commentaires d'un ticket en actes de vérification.
 *
 * L'ordre des formes est fixe (checklist, artefact, affirmation) et la force
 * vient de `DEFAULT_STRENGTH_BY_FORM` (src/defaults.ts) : une seule table de
 * force dans toute l'app (§7, zéro duplication).
 */
export function toVerifications(
  comments: readonly IssueComment[],
  options: CommentMappingOptions = {},
): Verification[] {
  const acts: Verification[] = [];
  for (const comment of comments) {
    const act = toVerification(comment, options);
    if (act) acts.push(act);
  }
  return acts;
}

/** Convertit un commentaire en acte de vérification, ou `null`. */
export function toVerification(
  comment: IssueComment,
  options: CommentMappingOptions = {},
): Verification | null {
  const executedAt = comment.createdAt?.trim() ?? '';
  if (executedAt.length === 0) {
    options.report?.('commentaire écarté : date manquante', { id: comment.id });
    return null;
  }
  const body = comment.body ?? '';
  const found = formOf(body);
  if (!found) return null;
  const strength: Strength = DEFAULT_STRENGTH_BY_FORM[found.form];
  const artifactRef = found.form === 'third-party' ? artifactOf(body) : undefined;
  return {
    id: actId(comment.issueId, comment.id),
    form: found.form,
    sourceSystem: 'jira',
    sourceRef: `comment/${comment.issueId}/${comment.id}`,
    issueId: comment.issueId,
    ticketKey: options.ticketKey,
    name: actName('Commentaire', found.detail),
    executedAt,
    status: statusOf(body),
    strength,
    artifactRef,
    authorRef: comment.authorRef,
  };
}
