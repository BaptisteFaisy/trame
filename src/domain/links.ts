/**
 * The weaving: the link between a criterion (a warp thread) and an act of
 * verification (a weft pass) (§9).
 *
 * Four paths, from the surest to the most fragile:
 *
 * 1. `mention` — the act quotes the criterion (`AC-3` in a test name or in a
 *    pull request): deliberate and dated, a **declared** link;
 * 2. `naming-convention` — the act carries the ticket key (`PROJ-12.testX`):
 *    deterministic, a **declared** link;
 * 3. `similarity` — the model proposes a correspondence with a confidence: a
 *    **derived** link, never counted as declared coverage;
 * 4. `declaration` — a human wrote the link: the reference, a **declared** link.
 *
 * The two deterministic paths need no model and no human, and they are the only
 * ones that give a declared link on their own (§10).
 *
 * Pure: no Forge, no clock, no randomness. The date of a link is an argument.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type { Link, LinkKind, LinkPath, Criterion, Verification } from '../types.js';
import type { DeclaredRelation, SimilarityProposal } from '../ports.js';
import { DERIVED_LINK_FLOOR, DERIVED_LINK_THRESHOLD } from '../defaults.js';

/** A criterion that nothing can verify never gets a mesh (§8.4). */
function canBeWoven(criterion: Criterion): boolean {
  return criterion.falsifiable && !criterion.deletedAt;
}

/** A disabled act weaves nothing: it is a thread that went loose (§8.3). */
function canWeave(verification: Verification): boolean {
  return !verification.disabledAt;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The act quotes the criterion: `AC-3` appears in its name (and `AC-3` is not
 * the prefix of `AC-30`). The criterion key is quoted as a whole.
 */
export function mentionsCriterion(criterion: Criterion, verification: Verification): boolean {
  const key = escapeRegExp(criterion.criterionKey);
  const pattern = new RegExp(`(^|[^0-9])${key}([^0-9]|$)`, 'i');
  return pattern.test(verification.name) || pattern.test(verification.sourceRef);
}

/**
 * The act carries the ticket key of the criterion: `TRAME-101.testShouldX`.
 * A name that carries ANOTHER ticket key is a trap (§23): it is not a link.
 */
export function followsNamingConvention(
  criterion: Criterion,
  verification: Verification,
): boolean {
  const key = escapeRegExp(criterion.ticketKey);
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${key}[^A-Za-z0-9]`, 'i');
  if (!pattern.test(verification.name)) return false;
  return !belongsToAnotherTicket(criterion, verification);
}

/** The act names another ticket than the criterion: the convention lies. */
export function belongsToAnotherTicket(
  criterion: Criterion,
  verification: Verification,
): boolean {
  const pattern = /([A-Z]{2,10}-\d+)(?![A-Za-z0-9])/gi;
  const tickets = verification.name.match(pattern);
  if (!tickets) return false;
  return tickets.some((ticket) => ticket.toUpperCase() !== criterion.ticketKey.toUpperCase());
}

/** Deterministic identifier: the same pair always produces the same link. */
function linkId(criterionId: string, verificationId: string, path: LinkPath): string {
  return `link_${criterionId}_${verificationId}_${path}`;
}

/** Builds a link of a given kind and path. */
function makeLink(
  criterion: Criterion,
  verification: Verification,
  path: LinkPath,
  kind: LinkKind,
  confidence: number,
  establishedAt: string,
): Link {
  return {
    id: linkId(criterion.id, verification.id, path),
    criterionId: criterion.id,
    verificationId: verification.id,
    kind,
    path,
    confidence,
    criterionHashAtLink: criterion.textHash,
    establishedAt,
  };
}

/** Path 1 — the act quotes the criterion. */
export function linkByMention(
  criterion: Criterion,
  verification: Verification,
  establishedAt: string,
): Link | null {
  if (!canBeWoven(criterion) || !canWeave(verification)) return null;
  if (!mentionsCriterion(criterion, verification)) return null;
  return makeLink(criterion, verification, 'mention', 'declared', 1, establishedAt);
}

/** Path 2 — the act carries the ticket key. */
export function linkByNamingConvention(
  criterion: Criterion,
  verification: Verification,
  establishedAt: string,
): Link | null {
  if (!canBeWoven(criterion) || !canWeave(verification)) return null;
  if (!followsNamingConvention(criterion, verification)) return null;
  return makeLink(criterion, verification, 'naming-convention', 'declared', 1, establishedAt);
}

/** Path 4 — a human wrote the link. */
export function linkByDeclaration(
  criterion: Criterion,
  verification: Verification,
  establishedAt: string,
): Link | null {
  if (!canBeWoven(criterion) || !canWeave(verification)) return null;
  return makeLink(criterion, verification, 'declaration', 'declared', 1, establishedAt);
}

/** Path 3 — the model proposes, with its confidence. */
export function linkBySimilarity(
  criterion: Criterion,
  verification: Verification,
  confidence: number,
  establishedAt: string,
): Link | null {
  if (!canBeWoven(criterion) || !canWeave(verification)) return null;
  if (classifyDerived(confidence) === 'discarded') return null;
  return makeLink(criterion, verification, 'similarity', 'derived', confidence, establishedAt);
}

/** What a confidence means (§9.2). */
export function classifyDerived(
  confidence: number,
  threshold: number = DERIVED_LINK_THRESHOLD,
  floor: number = DERIVED_LINK_FLOOR,
): 'provisional' | 'proposal' | 'discarded' {
  if (confidence >= threshold) return 'provisional';
  if (confidence >= floor) return 'proposal';
  return 'discarded';
}

/** A declared link beats a derived one for the same pair (§9.2). */
function strongest(left: Link, right: Link): Link {
  if (left.kind === 'derived' && right.kind !== 'derived') return right;
  if (right.kind === 'derived' && left.kind !== 'derived') return left;
  if (right.confidence > left.confidence) return right;
  return left;
}

/** The four paths, applied in order, for one pair. */
function linksForPair(
  criterion: Criterion,
  verification: Verification,
  establishedAt: string,
): Link[] {
  const found: Link[] = [];
  const mention = linkByMention(criterion, verification, establishedAt);
  const convention = linkByNamingConvention(criterion, verification, establishedAt);
  if (mention) found.push(mention);
  if (convention && !mention) found.push(convention);
  return found;
}

/**
 * Weaves a scope: the deterministic paths first, then the human declarations,
 * then the proposals of the model — a pair never carries two meshes.
 */
export function weave(input: WeaveInput): Link[] {
  const { criteria, verifications, declared = [], proposals = [], establishedAt } = input;
  const best = new Map<string, Link>();
  const keep = (link: Link): void => {
    const key = `${link.criterionId}|${link.verificationId}`;
    const current = best.get(key);
    best.set(key, current ? strongest(current, link) : link);
  };
  for (const criterion of criteria) {
    for (const verification of verifications) {
      for (const link of linksForPair(criterion, verification, establishedAt)) keep(link);
    }
  }
  for (const relation of declared) {
    const criterion = criteria.find((row) => row.criterionKey === relation.criterionRef);
    const verification = verifications.find((row) => row.id === relation.verificationRef);
    if (!criterion || !verification) continue;
    const link = linkByDeclaration(criterion, verification, relation.createdAt);
    if (link) keep(link);
  }
  for (const proposal of proposals) {
    const criterion = criteria.find((row) => row.id === proposal.criterionId);
    const verification = verifications.find((row) => row.id === proposal.verificationId);
    if (!criterion || !verification) continue;
    const link = linkBySimilarity(criterion, verification, proposal.confidence, establishedAt);
    if (link) keep(link);
  }
  return [...best.values()];
}

export interface WeaveInput {
  criteria: readonly Criterion[];
  verifications: readonly Verification[];
  declared?: readonly DeclaredRelation[];
  proposals?: readonly SimilarityProposal[];
  establishedAt: string;
}
