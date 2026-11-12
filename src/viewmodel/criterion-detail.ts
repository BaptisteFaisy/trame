/**
 * Vue-modèle de la fiche critère (§12, TR-14) : la couverture d'un critère,
 * les forces qui le couvrent, ses perforations et la proposition de test.
 *
 * Pur : il reçoit le critère et ses données, il ne lit rien. Les états sont
 * double-codés par un motif et un mot (§22). Les effectifs viennent du bloc
 * de couverture commun ; un chiffre sans effectif n'est jamais affiché.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index.js';
import { label } from '../i18n/index.js';
import { STRENGTH_RANK } from '../defaults.js';
import type {
  Coverage,
  Criterion,
  Link,
  LinkPath,
  Perforation,
  Proposal,
  ProposalState,
  ProposalType,
  ScopeType,
  Strength,
  Verification,
  VerificationForm,
} from '../types.js';
import { codedState, coverageView, perforationLine } from './common.js';
import type { CodedState, CoverageView, Figure, PerforationLine } from './common.js';
import { text } from './labels.js';

/* ------------------------------------------------------------------ entrée */

export interface CriterionDetailInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  criterion: Criterion;
  links: readonly Link[];
  verifications: readonly Verification[];
  perforations: readonly Perforation[];
  proposals: readonly Proposal[];
  /** La trame du périmètre : les figures de contexte. */
  coverage: Coverage;
}

/* ------------------------------------------------------------------ sortie */

export interface CriterionHead {
  id: string;
  ticketKey: string;
  criterionKey: string;
  text: string;
  textHash: string;
  kind: Criterion['kind'];
  kindLabel: string;
  origin: Criterion['origin'];
  originLabel: string;
  falsifiable: boolean;
  unfalsifiableReason?: string;
  version: number;
  createdAt: string;
  changedAt: string;
  state: CodedState;
}

/** La force d'un acte qui couvre le critère, de la plus forte à la plus faible. */
export interface StrengthLine {
  verificationId: string;
  name: string;
  form: VerificationForm;
  formLabel: string;
  strength: Strength;
  strengthLabel: string;
  executedAt: string;
  linkKind: Link['kind'];
  linkLabel: string;
  path: LinkPath;
  pathLabel: string;
  confidence: number;
  state: CodedState;
}

/** Une proposition qui attend une décision sur ce critère. */
export interface ProposalLine {
  id: string;
  type: ProposalType;
  typeLabel: string;
  createdAt: string;
  status: ProposalState;
  summary: string;
  state: CodedState;
}

/** La couverture propre du critère : est-il couvert, à quelle force ? */
export interface CriterionOwnCoverage {
  covered: boolean;
  strength: Strength | null;
  strengthLabel: string;
  fresh: boolean;
  freshLabel: string;
  proven: boolean;
  state: CodedState;
}

export interface CriterionSheet {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  criterion: CriterionHead;
  coverage: CriterionOwnCoverage;
  forces: StrengthLine[];
  perforations: PerforationLine[];
  proposals: ProposalLine[];
  /** Le contexte : les figures du périmètre. */
  figures: Figure[];
  scopeCoverage: CoverageView;
}

/* ---------------------------------------------------------------- la tête */

/** Le motif du critère : pointillé s'il est infalsifiable (§8.4). */
function criterionState(criterion: Criterion, lang: Lang): CodedState {
  if (!criterion.falsifiable) {
    return codedState('dashed', text(lang, 'unfalsifiable'));
  }
  return codedState('solid', label(lang, 'kind', criterion.kind));
}

/** La tête du critère, avec ses libellés. */
function headOf(criterion: Criterion, lang: Lang): CriterionHead {
  const head: CriterionHead = {
    id: criterion.id,
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    text: criterion.text,
    textHash: criterion.textHash,
    kind: criterion.kind,
    kindLabel: label(lang, 'kind', criterion.kind),
    origin: criterion.origin,
    originLabel: label(lang, 'origin', criterion.origin),
    falsifiable: criterion.falsifiable,
    version: criterion.version,
    createdAt: criterion.createdAt,
    changedAt: criterion.changedAt,
    state: criterionState(criterion, lang),
  };
  if (criterion.unfalsifiableReason !== undefined) {
    head.unfalsifiableReason = criterion.unfalsifiableReason;
  }
  return head;
}

/* ------------------------------------------------------------- les forces */

/** Le motif d'une force : déclaration en pointillés, dérivée en pointillés. */
function forceState(link: Link, strength: Strength, lang: Lang): CodedState {
  if (strength === 'declared') return codedState('dashed', label(lang, 'link', link.kind));
  if (link.kind === 'derived') return codedState('dotted', label(lang, 'link', link.kind));
  return codedState('solid', label(lang, 'link', link.kind));
}

/** Un acte lié, mis en forme. */
function toStrengthLine(
  lang: Lang,
  link: Link,
  act: Verification,
): StrengthLine {
  return {
    verificationId: act.id,
    name: act.name,
    form: act.form,
    formLabel: label(lang, 'form', act.form),
    strength: act.strength,
    strengthLabel: label(lang, 'strength', act.strength),
    executedAt: act.executedAt,
    linkKind: link.kind,
    linkLabel: label(lang, 'link', link.kind),
    path: link.path,
    pathLabel: label(lang, 'path', link.path),
    confidence: link.confidence,
    state: forceState(link, act.strength, lang),
  };
}

/** Les forces du critère, de la plus forte à la plus faible. */
function forcesOf(
  lang: Lang,
  links: readonly Link[],
  verifications: readonly Verification[],
): StrengthLine[] {
  const acts = new Map(verifications.map((act) => [act.id, act]));
  const lines: StrengthLine[] = [];
  for (const link of links) {
    const act = acts.get(link.verificationId);
    if (act === undefined || act.disabledAt !== undefined) continue;
    lines.push(toStrengthLine(lang, link, act));
  }
  return lines.sort((left, right) => {
    const byStrength = STRENGTH_RANK[right.strength] - STRENGTH_RANK[left.strength];
    if (byStrength !== 0) return byStrength;
    return right.executedAt.localeCompare(left.executedAt);
  });
}

/* ------------------------------------------------------- la couverture d’un */

/** L'état de couverture propre du critère (§22, « couvert » n'est jamais nu). */
function ownCoverage(
  lang: Lang,
  criterion: Criterion,
  forces: readonly StrengthLine[],
  links: readonly Link[],
): CriterionOwnCoverage {
  const covered = forces.length > 0;
  const best = forces[0]?.strength ?? null;
  const strong = best === 'machine' || best === 'attested';
  const fresh = links.some((link) => link.criterionHashAtLink === criterion.textHash);
  const declared = forces.some((line) => line.linkKind !== 'derived');
  const proven = strong && fresh && declared;
  let state: CodedState;
  if (!covered) state = codedState('empty', text(lang, 'holes'));
  else if (proven) state = codedState('solid', text(lang, 'proven'));
  else if (best === 'declared') state = codedState('dashed', text(lang, 'covered-declared'));
  else state = codedState('dotted', text(lang, 'covered-provisional'));
  return {
    covered,
    strength: best,
    strengthLabel: best === null ? '' : label(lang, 'strength', best),
    fresh,
    freshLabel: label(lang, 'freshness', fresh ? 'current' : 'stale'),
    proven,
    state,
  };
}

/* -------------------------------------------------------------------- sortie */

/** La résumé d'une proposition : le test proposé, la reformulation, etc. */
function proposalSummary(lang: Lang, proposal: Proposal): string {
  if (proposal.payload.kind === 'test-draft') return proposal.payload.title;
  if (proposal.payload.kind === 'reformulation') return proposal.payload.after;
  if (proposal.payload.kind === 'relink') return proposal.payload.reason;
  return `${proposal.payload.perforationIds.length} ${text(lang, 'perforations')}`;
}

/** Une proposition en ligne, avec son état double-codé. */
function toProposalLine(lang: Lang, proposal: Proposal): ProposalLine {
  const typeLabel =
    proposal.payload.kind === 'test-draft' ? text(lang, 'proposed-test')
    : proposal.payload.kind === 'reformulation' ? text(lang, 'proposed-reformulation')
    : proposal.payload.kind === 'relink' ? label(lang, 'link', 'derived')
    : text(lang, 'perforations');
  return {
    id: proposal.id,
    type: proposal.type,
    typeLabel,
    createdAt: proposal.createdAt,
    status: proposal.state,
    summary: proposalSummary(lang, proposal),
    state: codedState('dotted', text(lang, 'proposed-test')),
  };
}

/** Bâtit la fiche critère. */
export function buildCriterionDetail(input: CriterionDetailInput): CriterionSheet {
  const lang = input.language;
  const forces = forcesOf(lang, input.links, input.verifications);
  const scopeCoverage = coverageView(lang, input.coverage);
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    criterion: headOf(input.criterion, lang),
    coverage: ownCoverage(lang, input.criterion, forces, input.links),
    forces,
    perforations: input.perforations.map((row) => perforationLine(lang, row)),
    proposals: input.proposals.map((row) => toProposalLine(lang, row)),
    figures: scopeCoverage.figures,
    scopeCoverage,
  };
}