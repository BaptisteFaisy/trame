/**
 * In-memory doubles for every port (docs/CONTRACTS.md §5). No network, no
 * Forge, no `Date.now()`: a test that uses them is deterministic and can
 * simulate the platform's worst habit — a missing right that empties a result
 * without any error (§18, §21).
 */
import type {
  Absence,
  BitbucketGateway,
  BuildRef,
  Clock,
  ConfluenceGateway,
  DeclaredRelation,
  GraphGateway,
  GraphObject,
  IdGenerator,
  IssueComment,
  IssueRef,
  JiraGateway,
  JobQueue,
  LlmGateway,
  Logger,
  PipelineGateway,
  PullMention,
  RecomputeMessage,
  SecretScanner,
  SimilarityProposal,
  TestFile,
} from '../../src/ports.js';
import type {
  Criterion,
  CriterionKind,
  ScopeRef,
  Verification,
  VisibilityProbe,
} from '../../src/types.js';
import { createSecretScanner } from '../../src/domain/secrets.js';

/** Fixed clock: `advanceDays` is the only way time moves in a test. */
export class FakeClock implements Clock {
  private iso: string;

  constructor(iso = '2026-11-12T09:00:00.000Z') {
    this.iso = iso;
  }

  now(): string {
    return this.iso;
  }

  set(iso: string): void {
    this.iso = iso;
  }

  /** Moves forward and returns the new timestamp (handy to date an act). */
  advanceDays(days: number): string {
    const at = new Date(this.iso);
    at.setUTCDate(at.getUTCDate() + days);
    this.iso = at.toISOString();
    return this.iso;
  }
}

/** Predictable identifiers: `crit_1`, `crit_2`, … per prefix. */
export function createFakeIds(): IdGenerator {
  const seen = new Map<string, number>();
  return {
    next(prefix: string) {
      const count = (seen.get(prefix) ?? 0) + 1;
      seen.set(prefix, count);
      return `${prefix}_${count}`;
    },
  };
}

export interface LogLine {
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: unknown;
}

export class FakeLogger implements Logger {
  readonly lines: LogLine[] = [];

  log(level: LogLine['level'], message: string, meta?: unknown): void {
    this.lines.push({ level, message, meta });
  }

  has(fragment: string): boolean {
    return this.lines.some((line) => line.message.includes(fragment));
  }
}

export class FakeQueue implements JobQueue {
  readonly messages: RecomputeMessage[] = [];

  async publish(message: RecomputeMessage): Promise<void> {
    this.messages.push(message);
  }
}

function deniedProbe(objectType: string, detail: string): VisibilityProbe {
  return { objectType, absence: 'no-right', probeRef: '', readable: false, detail };
}

/** Jira double: seeded tickets, comments and declared relations. */
export class FakeJira implements JiraGateway {
  issues: IssueRef[] = [];

  commentsByIssue = new Map<string, IssueComment[]>();

  testTickets = new Map<string, IssueRef[]>();

  relations = new Map<string, DeclaredRelation[]>();

  names = new Map<string, string>();

  private denied = false;

  writes: { issueId: string; kind: 'comment' | 'property'; value: string }[] = [];

  withIssues(...issues: IssueRef[]): this {
    this.issues.push(...issues);
    return this;
  }

  /** Simulates a missing right: every read comes back empty, no exception. */
  denyRead(): this {
    this.denied = true;
    return this;
  }

  private visible<T>(rows: T[]): T[] {
    return this.denied ? [] : rows;
  }

  async getIssue(issueIdOrKey: string): Promise<IssueRef | null> {
    const found = this.issues.find(
      (issue) => issue.id === issueIdOrKey || issue.key === issueIdOrKey,
    );
    return found ? { ...found } : null;
  }

  async issueKeysOf(issueIds: readonly string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (this.denied) return map;
    for (const issue of this.issues) {
      if (issueIds.includes(issue.id)) map.set(issue.id, issue.key);
    }
    return map;
  }

  async listIssuesSince(_projectId: string, since: string, limit: number): Promise<IssueRef[]> {
    return this.visible(this.issues.filter((issue) => issue.updatedAt >= since)).slice(0, limit);
  }

  async listIssuesOfSprint(_projectId: string, sprint: string): Promise<IssueRef[]> {
    return this.visible(this.issues.filter((issue) => issue.sprint === sprint));
  }

  async listIssuesOfVersion(_projectId: string, version: string): Promise<IssueRef[]> {
    return this.visible(this.issues.filter((issue) => issue.fixVersion === version));
  }

  async comments(issueId: string): Promise<IssueComment[]> {
    return this.visible(this.commentsByIssue.get(issueId) ?? []);
  }

  async listTestTickets(issueId: string): Promise<IssueRef[]> {
    return this.visible(this.testTickets.get(issueId) ?? []);
  }

  async declaredLinks(issueId: string): Promise<DeclaredRelation[]> {
    return this.visible(this.relations.get(issueId) ?? []);
  }

  async displayName(accountId: string): Promise<string> {
    return this.names.get(accountId) ?? accountId;
  }

  async addComment(issueId: string, bodyKey: string): Promise<boolean> {
    this.writes.push({ issueId, kind: 'comment', value: bodyKey });
    return !this.denied;
  }

  async setIssueProperty(issueId: string, key: string, value: unknown): Promise<boolean> {
    this.writes.push({ issueId, kind: 'property', value: `${key}=${JSON.stringify(value)}` });
    return !this.denied;
  }
}

/** Teamwork Graph double: objects per type, and rights that can be denied. */
export class FakeGraph implements GraphGateway {
  objects: GraphObject[] = [];

  deniedTypes = new Set<string>();

  withObjects(...objects: GraphObject[]): this {
    this.objects.push(...objects);
    return this;
  }

  denyRead(objectType: string): this {
    this.deniedTypes.add(objectType);
    return this;
  }

  async query(objectType: string, _scope: ScopeRef, since?: string): Promise<GraphObject[]> {
    if (this.deniedTypes.has(objectType)) return [];
    return this.objects.filter(
      (object) =>
        object.objectType === objectType && (since === undefined || (object.at ?? '') >= since),
    );
  }

  async probe(objectType: string): Promise<VisibilityProbe> {
    if (this.deniedTypes.has(objectType)) {
      return deniedProbe(objectType, 'droit manquant sur le type d’objet');
    }
    const known = this.objects.filter((object) => object.objectType === objectType);
    return {
      objectType,
      absence: known.length > 0 ? 'no-test' : 'no-data',
      probeRef: known[0]?.id ?? '',
      readable: true,
      detail: known.length > 0 ? `${known.length} objet(s) lus` : 'aucun objet pour ce type',
    };
  }
}

/** Bitbucket double: tests, builds and pull-request mentions. */
export class FakeBitbucket implements BitbucketGateway {
  tests: TestFile[] = [];

  builds: BuildRef[] = [];

  mentions: PullMention[] = [];

  denied = false;

  withTests(...tests: TestFile[]): this {
    this.tests.push(...tests);
    return this;
  }

  withBuilds(...builds: BuildRef[]): this {
    this.builds.push(...builds);
    return this;
  }

  withMentions(...mentions: PullMention[]): this {
    this.mentions.push(...mentions);
    return this;
  }

  denyRead(): this {
    this.denied = true;
    return this;
  }

  async listTests(_repository: string): Promise<TestFile[]> {
    return this.denied ? [] : this.tests;
  }

  async listBuilds(_repository: string, since: string): Promise<BuildRef[]> {
    return this.denied ? [] : this.builds.filter((build) => build.startedAt >= since);
  }

  async pullRequestMentions(_repository: string, since: string): Promise<PullMention[]> {
    if (this.denied) return [];
    return this.mentions.filter((mention) => (mention.mergedAt ?? '') >= since);
  }

  async probe(_repository: string): Promise<VisibilityProbe> {
    return this.denied
      ? deniedProbe('repository', 'dépôt illisible (droit Bitbucket manquant)')
      : {
          objectType: 'repository',
          absence: this.tests.length > 0 ? 'no-test' : 'no-data',
          probeRef: this.tests[0]?.path ?? '',
          readable: true,
          detail: `${this.tests.length} test(s) vus`,
        };
  }
}

/** Confluence double: checklists and generated certificate pages. */
export class FakeConfluence implements ConfluenceGateway {
  checklists = new Map<string, { text: string; checked: boolean; at?: string }[]>();

  published: { spaceKey: string; title: string; body: string }[] = [];

  denied = false;

  withChecklist(pageId: string, items: { text: string; checked: boolean; at?: string }[]): this {
    this.checklists.set(pageId, items);
    return this;
  }

  denyRead(): this {
    this.denied = true;
    return this;
  }

  async readChecklist(pageId: string): Promise<{ text: string; checked: boolean; at?: string }[]> {
    return this.denied ? [] : (this.checklists.get(pageId) ?? []);
  }

  async probe(pageId: string): Promise<VisibilityProbe> {
    return this.denied
      ? deniedProbe('document', 'page Confluence illisible')
      : {
          objectType: 'document',
          absence: this.checklists.has(pageId) ? 'no-data' : 'no-data',
          probeRef: pageId,
          readable: true,
          detail: this.checklists.has(pageId) ? 'page lue' : 'page absente',
        };
  }

  async publishCertificate(spaceKey: string, title: string, body: string): Promise<string | null> {
    if (this.denied) return null;
    this.published.push({ spaceKey, title, body });
    return `${spaceKey}/${title}`;
  }
}

/** Pipeline double: what the signed web trigger injected. */
export class FakePipeline implements PipelineGateway {
  results: Verification[] = [];

  async ingest(_payload: unknown): Promise<Verification[]> {
    return this.results;
  }
}

/** LLM double: canned answers and a call counter (sobriety, §22). */
export class FakeLlm implements LlmGateway {
  proposals: SimilarityProposal[] = [];

  kinds = new Map<string, CriterionKind>();

  unfalsifiable = new Map<string, string>();

  reformulations = new Map<string, { after: string; measure: string }>();

  drafts = new Map<string, { title: string; body: string }>();

  calls = 0;

  async suggestLinks(
    _criteria: readonly Criterion[],
    _tests: readonly Verification[],
  ): Promise<SimilarityProposal[]> {
    this.calls += 1;
    return this.proposals;
  }

  async classifyKind(text: string): Promise<CriterionKind> {
    this.calls += 1;
    return this.kinds.get(text) ?? 'functional';
  }

  async unfalsifiableReason(text: string): Promise<string | null> {
    this.calls += 1;
    return this.unfalsifiable.get(text) ?? null;
  }

  async proposeReformulation(
    text: string,
    _reason: string,
  ): Promise<{ after: string; measure: string }> {
    this.calls += 1;
    return (
      this.reformulations.get(text) ?? {
        after: `${text} (mesurable)`,
        measure: 'mesure à préciser',
      }
    );
  }

  async draftTest(criterion: Criterion, _zone?: string): Promise<{ title: string; body: string }> {
    this.calls += 1;
    return this.drafts.get(criterion.id) ?? { title: `Test ${criterion.criterionKey}`, body: '' };
  }
}

/** Real detectors, no fake: secrets must never be indexed (§5). */
export function createFakeSecrets(): SecretScanner {
  return createSecretScanner();
}

/** A gateway that reports what it could not see. */
export function absenceOf(absence: Absence['absence'], objectType: string, detail: string): Absence {
  return { absence, objectType, source: 'teamwork-graph', detail };
}
