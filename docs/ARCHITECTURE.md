# ARCHITECTURE — Trame

Forge app for Jira. Spec: `docs/CAHIER-DES-CHARGES.md` (§n). Contracts:
`docs/CONTRACTS.md`.

## 1. Layers

```
                 ┌───────────────────────────────────────────────┐
 Forge runtime → │ src/index.ts   (wiring only, frozen)          │
                 └───┬───────────────┬───────────────┬───────────┘
                     │ screens       │ actions/MCP   │ trigger · scheduled
                     ▼               ▼               ▼ consumer · webtrigger
                 src/handlers/*  src/actions/*   src/handlers/{events,
                 (11 keys)       (14 + 4 keys)    scheduled,consumer,
                     │               │            ingest,validator,jql}
                     └───────┬───────┘
                             ▼
                 src/viewmodel/*   shaping for the UI and the reports
                             ▼
                 src/domain/*      PURE: weave, coverage, perforations,
                                   dangling, falsifiability, métré, proposals
                             ▼
                 src/ports.ts      the only boundary (frozen interfaces)
                     ▲                       ▲
        src/collect/* (criteria)   src/ingest/* (verification acts)
        src/db/*      (Forge SQL, 15 tables of §19)
```

`src/domain` and `src/collect` never import `@forge/*`. Everything is testable
with `tests/helpers/*` (in-memory store, fake gateways, fixed clock).

## 2. Data flow of one recomputation

1. **Collect** (§6) — six origins: acceptance field, description, table,
   Confluence checklist, dedicated test ticket, attachment reference. Each
   detected criterion gets a stable key (`AC-n`) and a fingerprint
   (`src/collect/fingerprint.ts`). The app never invents a criterion. A
   criterion holding a secret is flagged and never indexed (§5).
2. **Ingest** (§7, §10) — verification acts from the Teamwork Graph
   (`test-execution`, `test-run`, `test-status`), Bitbucket builds and pull
   requests, Jira comments and test tickets, Confluence checklists, and the
   signed pipeline web trigger. Each act carries a date, a status and a default
   strength (machine / attested / declared).
3. **Weave** (§9) — four paths, from surest to weakest: explicit mention
   (`AC-3` in a test name or a PR), naming convention (`PROJ-12.testShouldX`),
   semantic similarity (proposed, never counted by default), human declaration.
   The first two are deterministic; the third carries a confidence and expires.
4. **Judge** (§8) — coverage on three axes that are never merged (strength,
   link kind, freshness), perforations (fingerprint changed after the last
   verification), dangling threads (which **lower** the displayed coverage),
   unfalsifiable criteria (counted apart, never as holes).
5. **Rank** (§11) — the métré orders holes by criterion kind, observed zone
   risk and recurrence, and every score shows its terms.
6. **Report** (§12) — weave map, perforation registry, dangling queue,
   bulletin, certificate, proposals. Each figure is scoped, dated, and carries
   its denominator.

## 3. Persistence (§19)

Fifteen tables in Forge SQL, DDL in `src/db/schema.ts`: `criterion`,
`criterion_version`, `verification`, `link`, `coverage_snapshot`, `perforation`,
`dangling`, `hole`, `proposal`, `zone_risk`, `metric_rule`, `witness`,
`coverage_event`, `cursor`, `budget`. Texts of criteria are stored — that is the
subject of the product. Proofs are **referenced**, never copied. No table can
produce a per-person statistic.

## 4. Platform constraints that shape the code (§18, §21)

- 25 s per standard function; 900 s through `consumer` or a scheduled trigger.
  Long recomputations run in the `trame-recompute` consumer, by slices, with a
  cursor: 50 000 tickets are never one call.
- At most five scheduled triggers, one at 5 minutes: the nightly run recomputes
  perforations and dangling threads, not the extraction.
- The graph is read **as a user**: a missing right omits results without error.
  Hence `probe()` on every gateway and the coverage screen (TR-20) that tells
  `no-right` from `no-data`, `no-test` and `no-criterion`.
- Hosted LLM only for similarity, reformulations and test drafts, cached by
  criterion fingerprint, with a displayed daily budget.
- An app consumes the graph API **or** ships a connector, not both: Trame
  consumes.

## 5. Honesty invariants (§22)

- No figure without its count; a mean carries its range.
- `covered` ≠ `covered strongly` ≠ `covered up to date` ≠ `proven`.
- Derived coverage lives on its own line and can go **down** when a criterion or
  a test changes.
- The app shows, proposes, never blocks and never attests in a human's place;
  an act is never attributed to an agent.
