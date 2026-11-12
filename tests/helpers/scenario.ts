/**
 * The deterministic demonstration scenario `TRAME-1` — one ticket that carries
 * every judgement the app makes, so a recipe item of §24 is always one test
 * away:
 *
 *  - AC-1 functional, covered by a green automated test → strength `machine`;
 *  - AC-2 security, covered by a comment only → strength `declared`
 *    ("covered on paper", §7);
 *  - AC-3 « the application must be fast » → unfalsifiable, counted apart (§8.4);
 *  - AC-4 non-regression, verified then edited 37 days later → perforation,
 *    class `dry` (§8.2);
 *  - a disabled test that used to cover AC-1 → dangling thread, coverage goes
 *    **down** (§8.3);
 *  - a derived link at 0.91 → provisional coverage, never counted as declared;
 *  - a derived link at 0.62 → a proposal in the work queue (§9.2).
 *
 * Factories are exported: a lot builds its own case instead of duplicating
 * object literals (docs/CONTRACTS.md §1.2).
 */
import type { Deps, Settings } from '../../src/ports.js';
import type {
  Criterion,
  CriterionKind,
  CriterionOrigin,
  Link,
  LinkKind,
  LinkPath,
  Strength,
  Verification,
  VerificationForm,
} from '../../src/types.js';
import { DEFAULT_SETTINGS } from '../../src/defaults.js';
import { FakeStore } from './fake-store.js';
import {
  FakeBitbucket,
  FakeClock,
  FakeConfluence,
  FakeGraph,
  FakeJira,
  FakeLlm,
  FakeLogger,
  FakePipeline,
  FakeQueue,
  createFakeIds,
  createFakeSecrets,
} from './fake-gateways.js';

/** The fixed "today" of every test: the clock never moves on its own. */
export const TODAY = '2026-11-12T09:00:00.000Z';

export const TICKET = 'TRAME-1';

export const ISSUE_ID = '10001';

export const PROJECT = 'TRAME';

export const SPRINT = 'Sprint 7';

export const VERSION = '2026.11';

export const ZONE = 'src/weave';

/** Days before TODAY, as an ISO timestamp. */
export function daysAgo(days: number, from = TODAY): string {
  const at = new Date(from);
  at.setUTCDate(at.getUTCDate() - days);
  return at.toISOString();
}

let sequence = 0;

/** A criterion with sane defaults; override only what the test cares about. */
export function makeCriterion(over: Partial<Criterion> = {}): Criterion {
  sequence += 1;
  const key = over.criterionKey ?? `AC-${sequence}`;
  return {
    id: over.id ?? `crit_${key}`,
    issueId: over.issueId ?? ISSUE_ID,
    ticketKey: over.ticketKey ?? TICKET,
    criterionKey: key,
    text: over.text ?? `le critère ${key} est vérifiable`,
    textHash: over.textHash ?? `hash_${key}_1`,
    kind: (over.kind ?? 'functional') as CriterionKind,
    origin: (over.origin ?? 'acceptance-field') as CriterionOrigin,
    falsifiable: over.falsifiable ?? true,
    version: over.version ?? 1,
    createdAt: over.createdAt ?? daysAgo(20),
    changedAt: over.changedAt ?? daysAgo(20),
    scopeRefs: over.scopeRefs ?? [
      { scopeType: 'ticket', scope: over.ticketKey ?? TICKET },
      { scopeType: 'project', scope: PROJECT },
      { scopeType: 'sprint', scope: SPRINT },
      { scopeType: 'version', scope: VERSION },
    ],
    ...over,
  };
}

/** A verification act; the strength defaults to the form's default (§7). */
const STRENGTH_OF_FORM: Record<VerificationForm, Strength> = {
  'automated-test': 'machine',
  'manual-case': 'attested',
  'third-party': 'attested',
  'code-review': 'declared',
  'traced-manual': 'declared',
  deployment: 'declared',
  declaration: 'declared',
};

export function makeVerification(over: Partial<Verification> = {}): Verification {
  sequence += 1;
  const form = (over.form ?? 'automated-test') as VerificationForm;
  return {
    id: over.id ?? `ver_${sequence}`,
    form,
    sourceSystem: over.sourceSystem ?? 'teamwork-graph',
    sourceRef: over.sourceRef ?? `test-execution/${sequence}`,
    issueId: over.issueId ?? ISSUE_ID,
    ticketKey: over.ticketKey ?? TICKET,
    name: over.name ?? `${TICKET}.testCase${sequence}`,
    executedAt: over.executedAt ?? daysAgo(3),
    status: over.status ?? 'passed',
    strength: over.strength ?? STRENGTH_OF_FORM[form],
    zone: over.zone ?? ZONE,
    ...over,
  };
}

/** A mesh: criterion × verification (§9). */
export function makeLink(over: Partial<Link> = {}): Link {
  sequence += 1;
  return {
    id: over.id ?? `link_${sequence}`,
    criterionId: over.criterionId ?? 'crit_AC-1',
    verificationId: over.verificationId ?? 'ver_1',
    kind: (over.kind ?? 'declared') as LinkKind,
    path: (over.path ?? 'naming-convention') as LinkPath,
    confidence: over.confidence ?? 1,
    criterionHashAtLink: over.criterionHashAtLink ?? 'hash_AC-1_1',
    establishedAt: over.establishedAt ?? daysAgo(3),
    ...over,
  };
}

export interface Scenario {
  deps: Deps;
  store: FakeStore;
  clock: FakeClock;
  log: FakeLogger;
  queue: FakeQueue;
  jira: FakeJira;
  graph: FakeGraph;
  bitbucket: FakeBitbucket;
  confluence: FakeConfluence;
  pipeline: FakePipeline;
  llm: FakeLlm;
  settings: Settings;
  /** Identifiers of the seeded entities, so a test never hard-codes them. */
  ids: {
    ac1: string;
    ac2: string;
    ac3: string;
    ac4: string;
    greenTest: string;
    declaredComment: string;
    disabledTest: string;
    perforatedTest: string;
    strongProposal: string;
    weakProposal: string;
    machineLink: string;
    declaredLink: string;
    perforatedLink: string;
    danglingLink: string;
    derivedStrong: string;
    derivedWeak: string;
  };
}

/** Builds the scenario and seeds the store with it. */
export async function buildScenario(settings: Settings = DEFAULT_SETTINGS): Promise<Scenario> {
  sequence = 0;
  const clock = new FakeClock(TODAY);
  const store = new FakeStore();
  const log = new FakeLogger();
  const queue = new FakeQueue();
  const jira = new FakeJira();
  const graph = new FakeGraph();
  const bitbucket = new FakeBitbucket();
  const confluence = new FakeConfluence();
  const pipeline = new FakePipeline();
  const llm = new FakeLlm();
  const deps: Deps = {
    clock,
    ids: createFakeIds(),
    log,
    queue,
    jira,
    graph,
    bitbucket,
    confluence,
    pipeline,
    llm,
    secrets: createFakeSecrets(),
    store,
    settings,
  };
  const ids = await seed(deps);
  return { deps, store, clock, log, queue, jira, graph, bitbucket, confluence, pipeline, llm, settings, ids };
}

/** Seeds criteria, acts and meshes; returns their identifiers. */
async function seed(deps: Deps): Promise<Scenario['ids']> {
  const ac1 = makeCriterion({ criterionKey: 'AC-1', text: 'le tissage classe les critères par ticket' });
  const ac2 = makeCriterion({ criterionKey: 'AC-2', kind: 'security', text: 'un jeton expiré est refusé' });
  const ac3 = makeCriterion({
    criterionKey: 'AC-3',
    kind: 'performance',
    text: 'l’application doit être rapide',
    falsifiable: false,
    unfalsifiableReason: '« rapide » n’est pas mesurable',
  });
  const ac4 = makeCriterion({
    criterionKey: 'AC-4',
    kind: 'non-regression',
    text: 'la couverture déclarée ne baisse pas',
    textHash: 'hash_AC-4_2',
    version: 2,
    changedAt: daysAgo(3),
  });
  for (const criterion of [ac1, ac2, ac3, ac4]) await deps.store.putCriterion(criterion);

  const greenTest = makeVerification({ id: 'ver_green', name: `${TICKET}.testShouldWeaveCriteria`, executedAt: daysAgo(3) });
  const declaredComment = makeVerification({
    id: 'ver_comment',
    form: 'declaration',
    sourceSystem: 'jira',
    sourceRef: 'comment/90001',
    name: 'commentaire « vérifié à la main »',
    executedAt: daysAgo(1),
  });
  const disabledTest = makeVerification({
    id: 'ver_disabled',
    name: `${TICKET}.testShouldCountHoles`,
    executedAt: daysAgo(12),
    status: 'ignored',
    disabledAt: daysAgo(1),
  });
  const perforatedTest = makeVerification({
    id: 'ver_old',
    name: `${TICKET}.testShouldKeepCoverageStable`,
    executedAt: daysAgo(40),
  });
  for (const verification of [greenTest, declaredComment, disabledTest, perforatedTest]) {
    await deps.store.putVerification(verification);
  }

  const links = [
    makeLink({ id: 'link_machine', criterionId: ac1.id, verificationId: greenTest.id, path: 'naming-convention', criterionHashAtLink: ac1.textHash, establishedAt: daysAgo(3) }),
    makeLink({ id: 'link_declared', criterionId: ac2.id, verificationId: declaredComment.id, kind: 'declared', path: 'declaration', establishedAt: daysAgo(1) }),
    makeLink({ id: 'link_dangling', criterionId: ac1.id, verificationId: disabledTest.id, path: 'mention', establishedAt: daysAgo(12) }),
    makeLink({
      id: 'link_perforated',
      criterionId: ac4.id,
      verificationId: perforatedTest.id,
      path: 'naming-convention',
      criterionHashAtLink: 'hash_AC-4_1',
      establishedAt: daysAgo(40),
    }),
    makeLink({
      id: 'link_derived_strong',
      criterionId: ac2.id,
      verificationId: greenTest.id,
      kind: 'derived',
      path: 'similarity',
      confidence: 0.91,
      establishedAt: daysAgo(2),
    }),
    makeLink({
      id: 'link_derived_weak',
      criterionId: ac4.id,
      verificationId: disabledTest.id,
      kind: 'derived',
      path: 'similarity',
      confidence: 0.62,
      establishedAt: daysAgo(2),
    }),
  ];
  for (const link of links) await deps.store.putLink(link);

  await deps.store.putCriterionVersion({
    id: 'ver_ac4_1',
    criterionId: ac4.id,
    versionNo: 1,
    textHash: 'hash_AC-4_1',
    changedAt: daysAgo(45),
    changeKind: 'created',
  });
  await deps.store.putCriterionVersion({
    id: 'ver_ac4_2',
    criterionId: ac4.id,
    versionNo: 2,
    textHash: 'hash_AC-4_2',
    changedAt: daysAgo(3),
    changeKind: 'edited',
  });

  return {
    ac1: ac1.id,
    ac2: ac2.id,
    ac3: ac3.id,
    ac4: ac4.id,
    greenTest: greenTest.id,
    declaredComment: declaredComment.id,
    disabledTest: disabledTest.id,
    perforatedTest: perforatedTest.id,
    strongProposal: 'link_derived_strong',
    weakProposal: 'link_derived_weak',
    machineLink: 'link_machine',
    declaredLink: 'link_declared',
    perforatedLink: 'link_perforated',
    danglingLink: 'link_dangling',
    derivedStrong: 'link_derived_strong',
    derivedWeak: 'link_derived_weak',
  };
}
