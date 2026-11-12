/**
 * Ports — the only boundary between the pure domain and the Forge runtime.
 *
 * The domain (`src/domain/*`) never imports `@forge/*`. Adapters (`src/db`,
 * `src/collect`, `src/ingest`, `src/handlers`, `src/actions`) implement these
 * interfaces, so every judgement (coverage, perforation, dangling, métré) is
 * testable with in-memory fakes (`tests/helpers/fakes.ts`).
 *
 * Frozen contract: see docs/CONTRACTS.md. Adding a member is allowed, changing
 * or removing one requires every owner's agreement.
 */
import type {
  AbsenceKind,
  Budget,
  Coverage,
  CoverageEvent,
  Criterion,
  CriterionKind,
  CriterionVersion,
  Cursor,
  Dangling,
  Hole,
  Link,
  MetricRule,
  Perforation,
  Proposal,
  ScopeRef,
  ScopeType,
  SourceSystem,
  Verification,
  VisibilityProbe,
  Witness,
  ZoneRisk,
} from './types.js';

/* --------------------------------------------------------------- primitives */

/** Injectable clock: every timestamp in the app comes from here. */
export interface Clock {
  now(): string;
}

/** Injectable identifiers, so tests are deterministic. */
export interface IdGenerator {
  next(prefix: string): string;
}

export interface Logger {
  log(level: 'info' | 'warn' | 'error', message: string, meta?: unknown): void;
}

/** Long recomputations run in a `consumer` (900 s), by slices (§18). */
export interface JobQueue {
  publish(message: RecomputeMessage): Promise<void>;
}

export interface RecomputeMessage {
  scope: string;
  scopeType: ScopeType;
  mode: 'criteria' | 'verifications' | 'links' | 'measures';
  cursor?: Cursor;
}

/* ------------------------------------------------------------------ gateways */

/** A ticket as Trame reads it: no criterion is invented, only detected (§6). */
export interface IssueRef {
  id: string;
  key: string;
  projectId: string;
  summary: string;
  status: string;
  /** Raw acceptance-criteria field, when the team uses it. */
  acceptanceField?: string;
  /** Raw description (Atlassian Document Format or markdown). */
  description?: string;
  /** Criteria tables live here: `columns` then `rows`. */
  tables?: CriterionTable[];
  labels: string[];
  components: string[];
  sprint?: string;
  fixVersion?: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface CriterionTable {
  columns: string[];
  rows: string[][];
}

/** A comment or checklist item: origin of declarations (§7, forms 5 and 7). */
export interface IssueComment {
  id: string;
  issueId: string;
  body: string;
  createdAt: string;
  authorRef?: string;
}

export interface JiraGateway {
  getIssue(issueIdOrKey: string): Promise<IssueRef | null>;
  /** Incremental: what changed since the cursor (§18, §21 volume). */
  listIssuesSince(projectId: string, since: string, limit: number): Promise<IssueRef[]>;
  listIssuesOfSprint(projectId: string, sprint: string): Promise<IssueRef[]>;
  listIssuesOfVersion(projectId: string, version: string): Promise<IssueRef[]>;
  comments(issueId: string): Promise<IssueComment[]>;
  /** Dedicated test tickets / sub-tasks (§6, origin 5). */
  listTestTickets(issueId: string): Promise<IssueRef[]>;
  /** Declared links: `is tested by`, labels, explicit relations (§9.1). */
  declaredLinks(issueId: string): Promise<DeclaredRelation[]>;
  /** Audit only — the app never ranks a person (§5, §22). */
  displayName(accountId: string): Promise<string>;
  addComment(issueId: string, bodyKey: string, params?: Record<string, string>): Promise<boolean>;
  setIssueProperty(issueId: string, key: string, value: unknown): Promise<boolean>;
}

export interface DeclaredRelation {
  criterionRef: string;
  verificationRef: string;
  kind: string;
  createdAt: string;
}

/** One object read from the Teamwork Graph (§10). */
export interface GraphObject {
  objectType: string;
  id: string;
  name?: string;
  status?: string;
  at?: string;
  /** Related work item, when the graph exposes the relation (§21, to verify). */
  workItemId?: string;
  testPlanId?: string;
  repository?: string;
  zone?: string;
  raw?: Record<string, unknown>;
}

/**
 * Teamwork Graph reader. Persisted Cypher only — raw Cypher is refused to new
 * apps (§21). A missing right omits results **without error**, hence `probe`.
 */
export interface GraphGateway {
  query(objectType: string, scope: ScopeRef, since?: string): Promise<GraphObject[]>;
  /** Tells `no-right` from `no-data` on a case whose answer is known (§18). */
  probe(objectType: string): Promise<VisibilityProbe>;
}

/** Graph object types Trame reads (§10). Used by the coverage screen. */
export const GRAPH_OBJECT_TYPES = [
  'test-plan',
  'test-run',
  'test-execution',
  'test-status',
  'work-item',
  'commit',
  'pull-request',
  'deployment',
  'document',
  'project',
  'software-service',
  'AtlassianUser',
] as const;

export type GraphObjectType = (typeof GRAPH_OBJECT_TYPES)[number];

/** Bitbucket: builds, pipelines and pull requests (§7 forms 1 and 4). */
export interface BitbucketGateway {
  /** Test names of a repository, with the file they live in (zone, §11). */
  listTests(repository: string): Promise<TestFile[]>;
  /** Builds and their state: a build that no longer runs loosens a thread. */
  listBuilds(repository: string, since: string): Promise<BuildRef[]>;
  pullRequestMentions(repository: string, since: string): Promise<PullMention[]>;
  probe(repository: string): Promise<VisibilityProbe>;
}

export interface TestFile {
  name: string;
  path: string;
  zone: string;
  disabled: boolean;
  /** `PROJ-12.testShouldRetry` → `PROJ-12` (§10, path 2). */
  ticketKeyInName?: string;
  /** `AC-3` quoted in the name or the message (§10, path 1). */
  criterionRefs: string[];
}

export interface BuildRef {
  id: string;
  repository: string;
  state: 'successful' | 'failed' | 'stopped' | 'expired' | 'unknown';
  startedAt: string;
  pipelineEnabled: boolean;
}

export interface PullMention {
  pullRequestId: string;
  title: string;
  description: string;
  mergedAt?: string;
  authorRef?: string;
  criterionRefs: string[];
  ticketKeys: string[];
}

/** Confluence: checklists as criteria (§6) and the certificate page (§12.5). */
export interface ConfluenceGateway {
  readChecklist(pageId: string): Promise<{ text: string; checked: boolean; at?: string }[]>;
  probe(pageId: string): Promise<VisibilityProbe>;
  /** Returns the page reference; the app never copies a proof (§18). */
  publishCertificate(spaceKey: string, title: string, body: string): Promise<string | null>;
}

/** CI pipelines can push results through the signed web trigger (§18). */
export interface PipelineGateway {
  ingest(payload: unknown): Promise<Verification[]>;
}

/** One similarity proposal: never counted as coverage until confirmed (§9.2). */
export interface SimilarityProposal {
  criterionId: string;
  verificationId: string;
  confidence: number;
  rationale: string;
}

/** Text-only hosted LLM, cached by criterion fingerprint (§18, §22). */
export interface LlmGateway {
  /** Path 3 of §10 — proposed, never counted by default. */
  suggestLinks(criteria: readonly Criterion[], tests: readonly Verification[]): Promise<SimilarityProposal[]>;
  classifyKind(text: string): Promise<CriterionKind>;
  /** `null` when the criterion is falsifiable. */
  unfalsifiableReason(text: string): Promise<string | null>;
  proposeReformulation(text: string, reason: string): Promise<{ after: string; measure: string }>;
  draftTest(criterion: Criterion, zone?: string): Promise<{ title: string; body: string }>;
}

/** Secrets and personal data are kept out before indexing (§5). */
export interface SecretScanner {
  scan(text: string): { clean: boolean; findings: string[] };
}

/* --------------------------------------------------------------------- store */

/**
 * Persistence port. Implemented by `src/db` (Forge SQL, §19) and by the
 * in-memory fake. No method here can return a per-person statistic.
 */
export interface TrameStore {
  putCriterion(criterion: Criterion): Promise<void>;
  getCriterion(id: string): Promise<Criterion | null>;
  findCriterion(issueId: string, criterionKey: string): Promise<Criterion | null>;
  listCriteria(scope: ScopeRef): Promise<Criterion[]>;
  putCriterionVersion(version: CriterionVersion): Promise<void>;
  listVersions(criterionId: string): Promise<CriterionVersion[]>;

  putVerification(verification: Verification): Promise<void>;
  getVerification(id: string): Promise<Verification | null>;
  listVerifications(scope: ScopeRef): Promise<Verification[]>;

  putLink(link: Link): Promise<void>;
  getLink(id: string): Promise<Link | null>;
  listLinks(criterionId: string): Promise<Link[]>;
  listLinksOfVerification(verificationId: string): Promise<Link[]>;
  /** Recompute only what a fingerprint change touches (§24, recipe 18). */
  listDerivedLinksSince(at: string): Promise<Link[]>;

  putCoverage(coverage: Coverage): Promise<void>;
  getCoverage(scope: string, scopeType: ScopeType): Promise<Coverage | null>;
  listCoverageTimeline(scope: string, scopeType: ScopeType, limit: number): Promise<Coverage[]>;

  putPerforation(perforation: Perforation): Promise<void>;
  listPerforations(scope: ScopeRef, ageDays?: number): Promise<Perforation[]>;

  putDangling(dangling: Dangling): Promise<void>;
  listDangling(scope: ScopeRef): Promise<Dangling[]>;

  putHole(hole: Hole): Promise<void>;
  listHoles(scope: ScopeRef, limit: number): Promise<Hole[]>;

  putProposal(proposal: Proposal): Promise<void>;
  getProposal(id: string): Promise<Proposal | null>;
  listProposals(state: Proposal['state']): Promise<Proposal[]>;

  putZoneRisk(risk: ZoneRisk): Promise<void>;
  listZoneRisks(scope: string): Promise<ZoneRisk[]>;

  getMetricRule(scope: string): Promise<MetricRule | null>;
  putMetricRule(rule: MetricRule): Promise<void>;

  putWitness(witness: Witness): Promise<void>;
  lastWitness(scope: string, scopeType: ScopeType): Promise<Witness | null>;

  putEvent(event: CoverageEvent): Promise<void>;
  /** Les périmètres connus de l'app : le recalcul nocturne les parcourt. */
  listScopes(limit: number): Promise<string[]>;
  listEvents(scope: string, limit: number): Promise<CoverageEvent[]>;

  getCursor(scope: string, mode: Cursor['mode']): Promise<Cursor | null>;
  putCursor(cursor: Cursor): Promise<void>;

  addBudget(day: string, calls: number, tokens: number, cost: number): Promise<void>;
  getBudget(day: string): Promise<Budget | null>;
}

/* ----------------------------------------------------------------- assembly */

/** Everything a handler needs, injected — never imported from `@forge/*`. */
export interface Deps {
  clock: Clock;
  ids: IdGenerator;
  log: Logger;
  queue: JobQueue;
  jira: JiraGateway;
  graph: GraphGateway;
  bitbucket: BitbucketGateway;
  confluence: ConfluenceGateway;
  pipeline: PipelineGateway;
  llm: LlmGateway;
  secrets: SecretScanner;
  store: TrameStore;
  settings: Settings;
}

/** Tunable knobs (§11: weights are a decision). Frozen defaults in defaults.ts. */
export interface Settings {
  /** Above it a derived link shows as provisional coverage (§9.2). */
  derivedLinkThreshold: number;
  /** Below it the link stays a proposal in the work queue. */
  derivedLinkFloor: number;
  perforationFreshDays: number;
  perforationDryDays: number;
  perforationMultipleChanges: number;
  metricWeights: MetricRule['weights'];
  llmDailyCallBudget: number;
  language: 'en' | 'fr';
}

/** A scope Trame can judge. */
export interface Scope {
  scopeType: ScopeType;
  scope: string;
  projectId?: string;
}

/** Reads a scope into the entities it contains. */
export interface ScopeResolver {
  resolve(scope: Scope): Promise<{ issues: IssueRef[]; refs: ScopeRef[] }>;
}

/** Absence reported by any adapter that could not look. */
export interface Absence {
  absence: AbsenceKind;
  objectType: string;
  source: SourceSystem;
  detail: string;
}

/** What Forge passes to a function: identity and module, never a right. */
export interface ActorContext {
  accountId: string;
  moduleId: string;
  /** An MCP call is always an agent: it declares, it never attests (§5). */
  fromMcp: boolean;
  cloudId: string;
}

/**
 * Frozen signature of an action / MCP tool (docs/CONTRACTS.md §4): a richer
 * internal typing is welcome, the exported shape is not.
 */
export type ActionRun = (
  deps: Deps,
  payload: Record<string, unknown>,
  actor: ActorContext,
) => Promise<unknown>;

/** Frozen signature of a screen handler. */
export type ScreenRender = (deps: Deps, payload: Record<string, unknown>) => Promise<unknown>;
