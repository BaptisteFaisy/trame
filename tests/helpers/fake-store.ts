/**
 * In-memory `TrameStore` — the executable specification of the persistence
 * port (docs/CONTRACTS.md §5). Every domain test runs against it: no SQL, no
 * network, deterministic order.
 *
 * The Forge SQL store (`src/db/repo.ts`) must satisfy `tests/contract/store.test.ts`
 * with the same semantics: scope filtering, ordering, cumulative budget, one
 * cursor per (scope, mode).
 */
import type { ScopeRef, ScopeType } from '../../src/types.js';
import type {
  Budget,
  Coverage,
  Verification,
  CoverageEvent,
  Criterion,
  CriterionVersion,
  Cursor,
  Dangling,
  Hole,
  Link,
  MetricRule,
  Perforation,
  Proposal,
  Witness,
  ZoneRisk,
} from '../../src/types.js';
import type { TrameStore } from '../../src/ports.js';

/** Keeps the last write per id, like a table with a primary key. */
function upsert<T extends { id: string }>(rows: T[], row: T): void {
  const at = rows.findIndex((candidate) => candidate.id === row.id);
  if (at === -1) rows.push(row);
  else rows[at] = row;
}

function byId<T extends { id: string }>(rows: T[], id: string): T | null {
  return rows.find((row) => row.id === id) ?? null;
}

/** A criterion belongs to a scope through its `scopeRefs`, or its ticket key. */
function inScope(criterion: Criterion, scope: ScopeRef): boolean {
  if (scope.scopeType === 'ticket') {
    return (
      criterion.ticketKey === scope.scope ||
      criterion.issueId === scope.scope ||
      criterion.scopeRefs.some((ref) => ref.scope === scope.scope)
    );
  }
  return criterion.scopeRefs.some(
    (ref) => ref.scopeType === scope.scopeType && ref.scope === scope.scope,
  );
}

/** Newest first (ISO 8601 timestamps sort lexicographically). */
function newestFirst<T>(rows: T[], at: (row: T) => string): T[] {
  return [...rows].sort((left, right) => at(right).localeCompare(at(left)));
}

export class FakeStore implements TrameStore {
  readonly criteria: Criterion[] = [];

  readonly versions: CriterionVersion[] = [];

  readonly verifications: Verification[] = [];

  readonly links: Link[] = [];

  readonly coverages: Coverage[] = [];

  readonly perforations: Perforation[] = [];

  readonly dangling: Dangling[] = [];

  readonly holes: Hole[] = [];

  readonly proposals: Proposal[] = [];

  readonly zoneRisks: ZoneRisk[] = [];

  readonly metricRules: MetricRule[] = [];

  readonly witnesses: Witness[] = [];

  readonly events: CoverageEvent[] = [];

  readonly cursors: Cursor[] = [];

  readonly budgets: Budget[] = [];

  /* ------------------------------------------------------------- criteria */

  async putCriterion(criterion: Criterion): Promise<void> {
    upsert(this.criteria, criterion);
  }

  async getCriterion(id: string): Promise<Criterion | null> {
    return byId(this.criteria, id);
  }

  async findCriterion(issueId: string, criterionKey: string): Promise<Criterion | null> {
    return (
      this.criteria.find(
        (row) => row.issueId === issueId && row.criterionKey === criterionKey && !row.deletedAt,
      ) ?? null
    );
  }

  async listCriteria(scope: ScopeRef): Promise<Criterion[]> {
    return this.criteria.filter((row) => !row.deletedAt && inScope(row, scope));
  }

  async putCriterionVersion(version: CriterionVersion): Promise<void> {
    upsert(this.versions, version);
  }

  async listVersions(criterionId: string): Promise<CriterionVersion[]> {
    return this.versions
      .filter((row) => row.criterionId === criterionId)
      .sort((left, right) => left.versionNo - right.versionNo);
  }

  /* ---------------------------------------------------------- verification */

  async putVerification(verification: Verification): Promise<void> {
    upsert(this.verifications, verification);
  }

  async getVerification(id: string): Promise<Verification | null> {
    return byId(this.verifications, id);
  }

  /**
   * A ticket scope filters on the ticket key; a wider scope keeps the acts of
   * the tickets that hold criteria in it (the SQL store does the same join).
   */
  async listVerifications(scope: ScopeRef): Promise<Verification[]> {
    if (scope.scopeType === 'ticket') {
      return this.verifications.filter((row) => row.ticketKey === scope.scope);
    }
    const keys = new Set(
      (await this.listCriteria(scope)).map((criterion) => criterion.ticketKey),
    );
    return this.verifications.filter((row) => row.ticketKey !== undefined && keys.has(row.ticketKey));
  }

  /* ----------------------------------------------------------------- links */

  async putLink(link: Link): Promise<void> {
    upsert(this.links, link);
  }

  async getLink(id: string): Promise<Link | null> {
    return byId(this.links, id);
  }

  async listLinks(criterionId: string): Promise<Link[]> {
    return this.links.filter((row) => row.criterionId === criterionId && !row.rejectedAt);
  }

  async listLinksOfVerification(verificationId: string): Promise<Link[]> {
    return this.links.filter((row) => row.verificationId === verificationId && !row.rejectedAt);
  }

  async listDerivedLinksSince(at: string): Promise<Link[]> {
    return this.links.filter((row) => row.kind === 'derived' && row.establishedAt >= at);
  }

  /* -------------------------------------------------------------- coverage */

  /** A coverage row has no id: every computation appends a dated measure. */
  async putCoverage(coverage: Coverage): Promise<void> {
    this.coverages.push(coverage);
  }

  async getCoverage(scope: string, scopeType: ScopeType): Promise<Coverage | null> {
    const rows = this.coverages.filter(
      (row) => row.scope === scope && row.scopeType === scopeType,
    );
    return newestFirst(rows, (row) => row.computedAt)[0] ?? null;
  }

  async listCoverageTimeline(scope: string, scopeType: ScopeType, limit: number): Promise<Coverage[]> {
    const rows = this.coverages.filter(
      (row) => row.scope === scope && row.scopeType === scopeType,
    );
    return newestFirst(rows, (row) => row.computedAt).slice(0, limit);
  }

  /* ------------------------------------------- perforations and dangling */

  async putPerforation(perforation: Perforation): Promise<void> {
    upsert(this.perforations, perforation);
  }

  async listPerforations(scope: ScopeRef, ageDays?: number): Promise<Perforation[]> {
    const tickets = new Set(
      (await this.listCriteria(scope)).map((criterion) => criterion.ticketKey),
    );
    return this.perforations.filter(
      (row) =>
        tickets.has(row.ticketKey) &&
        (ageDays === undefined || row.ageDays >= ageDays) &&
        row.state !== 'reverified',
    );
  }

  async putDangling(dangling: Dangling): Promise<void> {
    upsert(this.dangling, dangling);
  }

  async listDangling(scope: ScopeRef): Promise<Dangling[]> {
    const tickets = new Set(
      (await this.listCriteria(scope)).map((criterion) => criterion.ticketKey),
    );
    const ids = new Set(
      this.verifications.filter((row) => row.ticketKey !== undefined && tickets.has(row.ticketKey))
        .map((row) => row.id),
    );
    return this.dangling.filter((row) => ids.has(row.verificationId) && row.state === 'open');
  }

  /* ------------------------------------------------------------ holes etc. */

  async putHole(hole: Hole): Promise<void> {
    upsert(this.holes, hole);
  }

  async listHoles(scope: ScopeRef, limit: number): Promise<Hole[]> {
    const rows = this.holes.filter(
      (row) => row.scope === scope.scope || (scope.scopeType === 'ticket' && row.ticketKey === scope.scope),
    );
    return rows
      .filter((row) => row.state !== 'covered')
      .sort((left, right) => right.priorityScore - left.priorityScore)
      .slice(0, limit);
  }

  async putProposal(proposal: Proposal): Promise<void> {
    upsert(this.proposals, proposal);
  }

  async getProposal(id: string): Promise<Proposal | null> {
    return byId(this.proposals, id);
  }

  async listProposals(state: Proposal['state']): Promise<Proposal[]> {
    return this.proposals.filter((row) => row.state === state);
  }

  async putZoneRisk(risk: ZoneRisk): Promise<void> {
    const at = this.zoneRisks.findIndex(
      (row) => row.scope === risk.scope && row.zone === risk.zone,
    );
    if (at === -1) this.zoneRisks.push(risk);
    else this.zoneRisks[at] = risk;
  }

  async listZoneRisks(scope: string): Promise<ZoneRisk[]> {
    return this.zoneRisks
      .filter((row) => row.scope === scope)
      .sort((left, right) => right.score - left.score);
  }

  async getMetricRule(scope: string): Promise<MetricRule | null> {
    return this.metricRules.find((row) => row.scope === scope) ?? null;
  }

  async putMetricRule(rule: MetricRule): Promise<void> {
    const at = this.metricRules.findIndex((row) => row.scope === rule.scope);
    if (at === -1) this.metricRules.push(rule);
    else this.metricRules[at] = rule;
  }

  /* -------------------------------------------------------- witness, events */

  async putWitness(witness: Witness): Promise<void> {
    upsert(this.witnesses, witness);
  }

  async lastWitness(scope: string, scopeType: ScopeType): Promise<Witness | null> {
    const rows = this.witnesses.filter(
      (row) => row.scope === scope && row.scopeType === scopeType,
    );
    return newestFirst(rows, (row) => row.computedAt)[0] ?? null;
  }

  async putEvent(event: CoverageEvent): Promise<void> {
    upsert(this.events, event);
  }

  async listScopes(limit: number): Promise<string[]> {
    const scopes = new Set<string>();
    for (const event of this.events) scopes.add(event.scope);
    for (const criterion of this.criteria) {
      for (const ref of criterion.scopeRefs) scopes.add(`${ref.scopeType}:${ref.scope}`);
    }
    return [...scopes].slice(0, limit);
  }

  async listEvents(scope: string, limit: number): Promise<CoverageEvent[]> {
    return newestFirst(
      this.events.filter((row) => row.scope === scope),
      (row) => row.at,
    ).slice(0, limit);
  }

  /* ------------------------------------------------------ cursor and budget */

  async getCursor(scope: string, mode: Cursor['mode']): Promise<Cursor | null> {
    return this.cursors.find((row) => row.scope === scope && row.mode === mode) ?? null;
  }

  async putCursor(cursor: Cursor): Promise<void> {
    const at = this.cursors.findIndex(
      (row) => row.scope === cursor.scope && row.mode === cursor.mode,
    );
    if (at === -1) this.cursors.push(cursor);
    else this.cursors[at] = cursor;
  }

  /** Cumulative: two calls on the same day add up (§19 `budget`). */
  async addBudget(day: string, calls: number, tokens: number, cost: number): Promise<void> {
    const row = this.budgets.find((candidate) => candidate.day === day);
    if (!row) {
      this.budgets.push({ day, llmCalls: calls, tokens, costEstimate: cost });
      return;
    }
    row.llmCalls += calls;
    row.tokens += tokens;
    row.costEstimate += cost;
  }

  async getBudget(day: string): Promise<Budget | null> {
    return this.budgets.find((row) => row.day === day) ?? null;
  }
}

export function createFakeStore(): FakeStore {
  return new FakeStore();
}
