/**
 * Trame — domain types (frozen contract, see docs/CONTRACTS.md).
 *
 * Vocabulary comes straight from the spec (§4): a criterion is a warp thread
 * (`fil de chaîne`), a verification act is a weft pass (`passage de trame`),
 * their intersection is a mesh (`maille`). An empty mesh is a hole, a mesh
 * whose criterion changed after being woven is a perforation, a weft pass
 * that no longer crosses anything is a dangling thread.
 *
 * Honesty rules encoded in the types (§22):
 * - every figure carries its denominator (`n`), never a bare percentage;
 * - strength, link kind and freshness are three separate axes, never merged;
 * - provisional (derived) coverage is a separate line, never folded into the
 *   declared coverage;
 * - no type here can express a per-person statistic.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */

/* ------------------------------------------------------------- enumerations */

/** Kind of criterion (§4). Drives the priority of a hole (§11). */
export type CriterionKind =
  | 'functional'
  | 'edge-case'
  | 'non-regression'
  | 'security'
  | 'performance'
  | 'experience'
  | 'documentation';

/** Where a criterion was found (§6, six origins). The app never invents one. */
export type CriterionOrigin =
  | 'acceptance-field'
  | 'description'
  | 'table'
  | 'confluence-page'
  | 'test-ticket'
  | 'attachment';

/** Strength of a weft pass (§4, §7): machine > attested > declared. */
export type Strength = 'machine' | 'attested' | 'declared';

/** The seven forms of verification act (§7). */
export type VerificationForm =
  | 'automated-test'
  | 'manual-case'
  | 'third-party'
  | 'code-review'
  | 'traced-manual'
  | 'deployment'
  | 'declaration';

/** How a link was established (§9, §10): four paths, from surest to weakest. */
export type LinkPath = 'mention' | 'naming-convention' | 'similarity' | 'declaration';

/** Life cycle of a link: derived is a proposal, confirmed becomes declared. */
export type LinkKind = 'declared' | 'derived' | 'confirmed';

/** Perforation graffiti (§8.2). */
export type PerforationClass = 'fresh' | 'dry' | 'multiple';

/** Why a weft pass no longer covers anything (§8.3). */
export type DanglingReason =
  | 'test-disabled'
  | 'test-renamed'
  | 'criterion-deleted'
  | 'build-not-running';

/** Scope of a judgement (§8.1): a coverage is always scoped and dated. */
export type ScopeType = 'ticket' | 'sprint' | 'project' | 'version';

/** What the app proposes, never applies (§12.6). */
export type ProposalType = 'test-draft' | 'reformulation' | 'relink' | 'retest';

export type ProposalState = 'open' | 'accepted' | 'rejected';

/**
 * The four kinds of absence (§22). Confusing them is the app's own blind spot
 * being read as the project's: `no-right` means Trame could not look.
 */
export type AbsenceKind = 'no-right' | 'no-data' | 'no-test' | 'no-criterion';

/** Where a verification act was read (§10). */
export type SourceSystem = 'teamwork-graph' | 'bitbucket' | 'jira' | 'confluence' | 'pipeline';

/* ------------------------------------------------------------------- entities */

/** A warp thread: one acceptance criterion of one ticket (§4). */
export interface Criterion {
  id: string;
  issueId: string;
  ticketKey: string;
  /** Stable identifier inside the ticket: `AC-1`, `AC-2`, … (§4). */
  criterionKey: string;
  text: string;
  /** Fingerprint of the text: a change of hash is a perforation trigger. */
  textHash: string;
  kind: CriterionKind;
  origin: CriterionOrigin;
  /** An unverifiable criterion counts neither as a hole nor as coverage (§8.4). */
  falsifiable: boolean;
  unfalsifiableReason?: string;
  /** Free of secrets: a criterion holding a key is never indexed (§5). */
  secretFlag?: string;
  version: number;
  createdAt: string;
  changedAt: string;
  /** Audit trail only — never a ranking (§5, §22). */
  authorRef?: string;
  deletedAt?: string;
  scopeRefs: ScopeRef[];
}

/** One revision of a criterion: the history perforations are computed on. */
export interface CriterionVersion {
  id: string;
  criterionId: string;
  versionNo: number;
  textHash: string;
  changedAt: string;
  changeKind: 'created' | 'edited' | 'restored' | 'deleted';
  changedByRef?: string;
}

/** A weft pass: one act of verification (§7). */
export interface Verification {
  id: string;
  form: VerificationForm;
  sourceSystem: SourceSystem;
  /** Object reference in its system (`test-execution/…`, build url, comment id). */
  sourceRef: string;
  issueId?: string;
  ticketKey?: string;
  name: string;
  executedAt: string;
  status: 'passed' | 'failed' | 'skipped' | 'ignored' | 'unknown';
  strength: Strength;
  /** A proof is referenced, never copied (§18). */
  artifactRef?: string;
  authorRef?: string;
  /** Set when the test stopped existing or stopped running (§8.3). */
  disabledAt?: string;
  zone?: string;
}

/** A mesh: criterion × verification (§9). */
export interface Link {
  id: string;
  criterionId: string;
  verificationId: string;
  kind: LinkKind;
  path: LinkPath;
  /** 0..1 — displayed on every proposal, never hidden (§9.2). */
  confidence: number;
  /** Hash of the criterion text when the link was woven: perforation input. */
  criterionHashAtLink: string;
  establishedAt: string;
  confirmedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  /** Token weights learned from confirmations/rejections (§9.4). */
  weights?: Record<string, number>;
}

/** A hole: a criterion with no verification act left (§8.1, §11). */
export interface Hole {
  id: string;
  criterionId: string;
  ticketKey: string;
  criterionKey: string;
  kind: CriterionKind;
  zone?: string;
  priorityScore: number;
  /** The terms of the métré, so the score can be explained (§22). */
  priorityTerms: PriorityTerm[];
  scope: string;
  state: 'open' | 'proposal' | 'covered';
  proposalId?: string;
}

export interface PriorityTerm {
  name: 'kind' | 'zone-risk' | 'recurrence';
  weight: number;
  value: number;
  /** Human-readable reason: "security criterion", "zone broke 3 times". */
  because: string;
}

/** A criterion changed after it was verified (§8.2). */
export interface Perforation {
  id: string;
  criterionId: string;
  ticketKey: string;
  criterionKey: string;
  verificationId: string;
  criterionVersionNo: number;
  changedAt: string;
  verifiedAt: string;
  ageDays: number;
  klass: PerforationClass;
  /** `reopened` when the text went back to the verified hash (§23). */
  state: 'open' | 'reopened' | 'reverified';
}

/** A weft pass that no longer covers anything (§8.3). */
export interface Dangling {
  id: string;
  verificationId: string;
  verificationName: string;
  reason: DanglingReason;
  detectedAt: string;
  /** How many meshes this removes: coverage goes down when a test dies. */
  impact: number;
  state: 'open' | 'repaired' | 'dismissed';
}

/** Risk of a repository zone, an input of the métré (§11). */
export interface ZoneRisk {
  scope: string;
  zone: string;
  defectCount: number;
  lastDefectAt?: string;
  openIncidentCount: number;
  score: number;
  computedAt: string;
}

/** The rule that ranks holes: weights are a decision, not a truth (§11). */
export interface MetricRule {
  id: string;
  scope: string;
  weights: { kind: Record<CriterionKind, number>; zoneRisk: number; recurrence: number };
  updatedAt: string;
  updatedByRef?: string;
}

/** A proposal: a draft, never applied (§12.6, §22 reversibility). */
export interface Proposal {
  id: string;
  type: ProposalType;
  criterionId: string;
  payload: ProposalPayload;
  createdAt: string;
  state: ProposalState;
  decidedAt?: string;
  decidedByRef?: string;
}

export type ProposalPayload =
  | { kind: 'test-draft'; title: string; body: string; expectedForm: VerificationForm; zone?: string }
  | { kind: 'reformulation'; before: string; after: string; measure: string }
  | { kind: 'relink'; verificationIds: string[]; reason: string }
  | { kind: 'retest'; perforationIds: string[] };

/* -------------------------------------------------------------- measurements */

/**
 * Coverage of a scope, decomposed on three axes that are never merged (§8.1).
 * Every count carries its denominator; a mean carries its range.
 */
export interface Coverage {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  /** Criteria that can be verified at all (unfalsifiable ones are excluded). */
  criteriaTotal: number;
  criteriaFalsifiable: number;
  unfalsifiableCount: number;
  /** Axis 1 — by strength. */
  byStrength: { machine: number; attested: number; declared: number };
  /** Axis 2 — by link kind. Derived links are provisional, kept apart. */
  byLink: { declared: number; confirmed: number; derived: number };
  /** Axis 3 — by freshness. */
  byFreshness: { current: number; stale: number };
  coveredDeclared: number;
  coveredProvisional: number;
  holes: number;
  dangling: number;
  perforations: number;
  /** Proven = strongly covered AND current AND declared (§4 discipline). */
  proven: number;
  /** What Trame could not see, so its blind spots are not read as holes. */
  blindSpots: BlindSpot[];
}

export interface BlindSpot {
  absence: AbsenceKind;
  objectType: string;
  detail: string;
}

/** A dated state of the weave, kept to compare two sprints (§4, §12.4). */
export interface Witness {
  id: string;
  scope: string;
  scopeType: ScopeType;
  period: string;
  coverage: Coverage;
  computedAt: string;
  bulletinRef?: string;
}

/** The bulletin: what a sprint review or a release reads (§12.4). */
export interface Bulletin {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  coverage: Coverage;
  previous?: Witness;
  perforations: number;
  dangling: number;
  unfalsifiableShare: PercentWithCount;
  addedDuringSprint: PercentWithCount;
  topHoles: Hole[];
}

/** A percentage always travels with its count (§22). */
export interface PercentWithCount {
  percent: number;
  count: number;
  total: number;
}

/** The certificate: an opposable dated page (§12.5). */
export interface Certificate {
  scope: string;
  scopeType: ScopeType;
  issuedAt: string;
  coverage: Coverage;
  verifications: CertificateLine[];
  perforations: Perforation[];
  dangling: Dangling[];
  unfalsifiable: Criterion[];
  /** Explicitly declared: what is NOT covered. */
  notCovered: Criterion[];
  confluencePageRef?: string;
}

export interface CertificateLine {
  criterionKey: string;
  ticketKey: string;
  form: VerificationForm;
  strength: Strength;
  executedAt: string;
  linkPath: LinkPath;
  actorRef?: string;
}

/* ------------------------------------------------------------------- plumbing */

export interface ScopeRef {
  scopeType: ScopeType;
  scope: string;
}

/** Incremental recomputation cursor (§18: 50 000 tickets are not one call). */
export interface Cursor {
  scope: string;
  mode: 'criteria' | 'verifications' | 'links' | 'measures';
  lastIssueId?: string;
  lastModifiedAt?: string;
  runAt: string;
}

/** One coverage event, for the timeline and the audit (§19). */
export interface CoverageEvent {
  id: string;
  scope: string;
  event:
    | 'criterion-added'
    | 'criterion-changed'
    | 'criterion-removed'
    | 'link-confirmed'
    | 'link-rejected'
    | 'test-disabled'
    | 'perforation-detected';
  at: string;
  payload?: Record<string, unknown>;
}

/** LLM sobriety: what the app spent, displayed (§22). */
export interface Budget {
  day: string;
  llmCalls: number;
  tokens: number;
  costEstimate: number;
}

/** One criterion read in full: the ticket panel payload (§12, TR-14). */
export interface CriterionDetail {
  criterion: Criterion;
  versions: CriterionVersion[];
  links: Link[];
  verifications: Verification[];
  strengths: Strength[];
  fresh: boolean;
  perforation?: Perforation;
  proposal?: Proposal;
}

/** What the coverage screen answers: what Trame sees, what it does not (TR-20). */
export interface VisibilityReport {
  scope: string;
  checkedAt: string;
  probes: VisibilityProbe[];
}

export interface VisibilityProbe {
  objectType: string;
  absence: AbsenceKind;
  /** A case whose answer is known, to tell `no-right` from `no-data` (§18). */
  probeRef: string;
  readable: boolean;
  detail: string;
}
