/**
 * Executable specification of the `TrameStore` port (docs/CONTRACTS.md §5).
 * These tests run against the in-memory store; the Forge SQL store of
 * `src/db/repo.ts` must satisfy the same semantics — scope filtering, ordering,
 * cumulative budget, one cursor per (scope, mode).
 */
import { describe, expect, it } from 'vitest';
import type { ScopeRef } from '../../src/types.js';
import { FakeStore } from '../helpers/fake-store.js';
import { buildScenario, makeCriterion, makeLink, makeVerification, PROJECT, TICKET } from '../helpers/index.js';

const TICKET_SCOPE: ScopeRef = { scopeType: 'ticket', scope: TICKET };

const PROJECT_SCOPE: ScopeRef = { scopeType: 'project', scope: PROJECT };

describe('TrameStore contract', () => {
  it('round-trips a criterion and finds it by ticket and key', async () => {
    const store = new FakeStore();
    const criterion = makeCriterion({ criterionKey: 'AC-9', ticketKey: 'TRAME-9' });
    await store.putCriterion(criterion);
    expect(await store.getCriterion(criterion.id)).toEqual(criterion);
    expect((await store.findCriterion(criterion.issueId, 'AC-9'))?.id).toBe(criterion.id);
    expect(await store.findCriterion(criterion.issueId, 'AC-10')).toBeNull();
  });

  it('filters criteria by scope and hides deleted ones', async () => {
    const store = new FakeStore();
    await store.putCriterion(makeCriterion({ criterionKey: 'AC-1' }));
    await store.putCriterion(makeCriterion({ criterionKey: 'AC-2', ticketKey: 'OTHER-1' }));
    await store.putCriterion(makeCriterion({ criterionKey: 'AC-3', deletedAt: '2026-11-01T00:00:00.000Z' }));
    expect(await store.listCriteria(TICKET_SCOPE)).toHaveLength(1);
    expect((await store.listCriteria(PROJECT_SCOPE)).length).toBe(2);
  });

  it('lists versions in version order', async () => {
    const store = new FakeStore();
    for (const versionNo of [2, 1, 3]) {
      await store.putCriterionVersion({
        id: `v${versionNo}`,
        criterionId: 'crit_AC-1',
        versionNo,
        textHash: `h${versionNo}`,
        changedAt: `2026-11-0${versionNo}T00:00:00.000Z`,
        changeKind: 'edited',
      });
    }
    const versions = await store.listVersions('crit_AC-1');
    expect(versions.map((row) => row.versionNo)).toEqual([1, 2, 3]);
  });

  it('returns only live links, and only derived ones since a date', async () => {
    const { store, ids } = await buildScenario();
    expect((await store.listLinks(ids.ac1)).map((row) => row.id)).toContain(ids.machineLink);
    const derived = await store.listDerivedLinksSince('2026-11-09T00:00:00.000Z');
    expect(derived.every((row) => row.kind === 'derived')).toBe(true);
    expect(derived.map((row) => row.id).sort()).toEqual([ids.derivedStrong, ids.derivedWeak]);
  });

  it('lists verification acts of a ticket scope', async () => {
    const { store } = await buildScenario();
    const acts = await store.listVerifications(TICKET_SCOPE);
    expect(acts.length).toBeGreaterThanOrEqual(4);
    expect(acts.every((row) => row.ticketKey === TICKET)).toBe(true);
  });

  it('orders holes by descending priority and drops covered ones', async () => {
    const store = new FakeStore();
    const base = { ticketKey: TICKET, criterionKey: 'AC-1', kind: 'functional' as const, priorityTerms: [] };
    await store.putHole({ id: 'h1', criterionId: 'c1', ...base, priorityScore: 0.4, scope: TICKET, state: 'open' });
    await store.putHole({ id: 'h2', criterionId: 'c2', ...base, priorityScore: 0.9, scope: TICKET, state: 'open' });
    await store.putHole({ id: 'h3', criterionId: 'c3', ...base, priorityScore: 1, scope: TICKET, state: 'covered' });
    const holes = await store.listHoles(TICKET_SCOPE, 10);
    expect(holes.map((row) => row.id)).toEqual(['h2', 'h1']);
    expect(await store.listHoles(TICKET_SCOPE, 1)).toHaveLength(1);
  });

  it('returns the newest coverage and its timeline, newest first', async () => {
    const store = new FakeStore();
    for (const day of ['08', '10', '09']) {
      await store.putCoverage({
        scope: PROJECT,
        scopeType: 'project',
        computedAt: `2026-11-${day}T00:00:00.000Z`,
        criteriaTotal: 4,
        criteriaFalsifiable: 3,
        unfalsifiableCount: 1,
        byStrength: { machine: 1, attested: 0, declared: 1 },
        byLink: { declared: 2, confirmed: 0, derived: 1 },
        byFreshness: { current: 1, stale: 1 },
        coveredDeclared: 2,
        coveredProvisional: 1,
        holes: 1,
        dangling: 0,
        perforations: 1,
        proven: 0,
        blindSpots: [],
      });
    }
    expect((await store.getCoverage(PROJECT, 'project'))?.computedAt).toBe('2026-11-10T00:00:00.000Z');
    const timeline = await store.listCoverageTimeline(PROJECT, 'project', 2);
    expect(timeline.map((row) => row.computedAt)).toEqual([
      '2026-11-10T00:00:00.000Z',
      '2026-11-09T00:00:00.000Z',
    ]);
  });

  it('accumulates the LLM budget of a day', async () => {
    const store = new FakeStore();
    await store.addBudget('2026-11-12', 2, 100, 0.01);
    await store.addBudget('2026-11-12', 3, 50, 0.02);
    const budget = await store.getBudget('2026-11-12');
    expect(budget).toEqual({ day: '2026-11-12', llmCalls: 5, tokens: 150, costEstimate: 0.03 });
    expect(await store.getBudget('2026-11-13')).toBeNull();
  });

  it('keeps one cursor per scope and mode', async () => {
    const store = new FakeStore();
    await store.putCursor({ scope: PROJECT, mode: 'criteria', runAt: '2026-11-12T00:00:00.000Z' });
    await store.putCursor({ scope: PROJECT, mode: 'criteria', runAt: '2026-11-12T06:00:00.000Z' });
    await store.putCursor({ scope: PROJECT, mode: 'links', runAt: '2026-11-12T06:00:00.000Z' });
    expect((await store.getCursor(PROJECT, 'criteria'))?.runAt).toBe('2026-11-12T06:00:00.000Z');
    expect(store.cursors).toHaveLength(2);
  });

  it('keeps the last witness of a scope', async () => {
    const store = new FakeStore();
    const witness = (id: string, computedAt: string) => ({
      id,
      scope: PROJECT,
      scopeType: 'project' as const,
      period: 'Sprint 7',
      computedAt,
      coverage: { scope: PROJECT } as never,
    });
    await store.putWitness(witness('w1', '2026-11-01T00:00:00.000Z'));
    await store.putWitness(witness('w2', '2026-11-08T00:00:00.000Z'));
    expect((await store.lastWitness(PROJECT, 'project'))?.id).toBe('w2');
  });

  it('lists events newest first, bounded', async () => {
    const store = new FakeStore();
    for (const [index, day] of ['08', '10', '09'].entries()) {
      await store.putEvent({
        id: `e${index}`,
        scope: PROJECT,
        event: 'criterion-added',
        at: `2026-11-${day}T00:00:00.000Z`,
      });
    }
    const events = await store.listEvents(PROJECT, 2);
    expect(events.map((row) => row.id)).toEqual(['e1', 'e2']);
  });

  it('keeps a rejected link out of the live links but readable by id', async () => {
    const store = new FakeStore();
    const link = makeLink({ id: 'link_rejected', criterionId: 'c1', verificationId: 'v1' });
    await store.putLink(link);
    await store.putLink({ ...link, rejectedAt: '2026-11-12T00:00:00.000Z', rejectReason: 'test hors sujet' });
    expect(await store.listLinks('c1')).toHaveLength(0);
    expect((await store.getLink('link_rejected'))?.rejectReason).toBe('test hors sujet');
    const act = makeVerification({ id: 'v1' });
    await store.putVerification(act);
    expect(await store.listLinksOfVerification('v1')).toHaveLength(0);
  });
});
