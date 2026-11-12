# CONTRACTS — frozen files, ownership map, conventions

Trame · Codegeist 2026 · spec: `docs/CAHIER-DES-CHARGES.md` (quoted as §n).

This document is the coordination contract of the build. Every lot works in its
own worktree on its own branch `lot/<name>`, touches **only** the files it owns,
and opens one pull request. A file listed as frozen is never edited by a lot:
if a lot needs a change, it asks in the pull request body and waits.

## 1. Non-negotiable rules

1. **Files < 500 lines, functions < 50 lines.** `tools/check-file-limits.py` and
   `tools/check-function-limits.mjs` run in CI and fail the build.
2. **No duplication.** A logic exists once; helpers are shared, not copied.
3. **The domain never imports `@forge/*`.** Only `src/db`, `src/collect`,
   `src/ingest`, `src/handlers`, `src/actions`, `src/index.ts`, `src/deps.ts`
   may touch the runtime, and only through `src/ports.ts`.
4. **Relative imports end with `.js`** (`./types.js`), NodeNext style.
5. **Every judgement is tested** against the in-memory fakes
   (`tests/helpers/fakes.ts`) — no network, no Forge, deterministic clock.
6. **Honesty (§22)**: no figure without its denominator; the three axes
   (strength, link kind, freshness) are never merged; derived coverage stays on
   its own line; `no-right` is never reported as a hole.
7. **No per-person statistic** anywhere: `authorRef` serves the audit trail of a
   criterion only. A type, a query or a screen that would rank a person is
   refused at review.
8. **CI budget: 5 minutes per job**, `timeout-minutes: 5`, `fetch-depth: 1`,
   `concurrency` set. Never lengthen a timeout (`~/Bureau/CI-BUDGET-5MIN.md`).
9. **Pull request body carries an exact `## Scope`** — the `couche0` guard reads
   it. Generate it with `git -c core.quotepath=off diff --name-only origin/main`
   so accented paths are not escaped. Never list a file you did not touch.
10. **Never write a file another lot is writing.** Ownership below is exclusive.

## 2. Frozen files (socle L0)

| File | Role |
|---|---|
| `src/types.ts` | Domain vocabulary: criterion, verification, link, coverage, perforation, dangling, hole, proposal, witness, bulletin, certificate, blind spot |
| `src/ports.ts` | The only boundary: gateways (Jira, Teamwork Graph, Bitbucket, Confluence, pipeline, LLM, secrets), `TrameStore`, `Deps`, `Settings`, frozen signatures `ActionRun` / `ScreenRender` |
| `src/defaults.ts` | Frozen numbers: derived-link threshold 0.85 and floor 0.5, perforation 7/30 days and 3 changes, métré weights, LLM budget, strength ranks, default strength per form |
| `src/deps.ts` | Single place where the runtime graph is built |
| `src/index.ts` | Forge wiring: `handler`, `dispatch`, `ingestResults`, `onEvent`, `onScheduled`, `onMessage`, `validateWeave`, four JQL functions |
| `src/handlers/resolver.ts` | The eleven screen keys of §17 |
| `src/handlers/dispatch.ts` | The fourteen MCP tools of §16 plus four internal actions |
| `src/db/schema.ts` | DDL of the fifteen tables of §19 |
| `manifest.yml` | Forge modules, permissions, resources |
| `tests/helpers/fakes.ts` | In-memory store, gateways, clock, ids, demo scenario |
| `.github/workflows/*.yml`, `.github/couche0/`, `.github/ci-budget/`, `.github/inferhub/`, `.mergify.yml`, `tools/` | Pipeline and guards |

Adding a member to an interface in `src/ports.ts` or `src/types.ts` is allowed
when a lot needs it **and** no other lot is reading that member yet; removing or
renaming one is not.

## 3. Frozen signatures

```ts
// one MCP tool / action = one file in src/actions/, exporting:
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  actor: ActorContext,
): Promise<unknown>;

// one screen = one file in src/handlers/, exporting:
export async function render(deps: Deps, payload: Record<string, unknown>): Promise<unknown>;

// one origin of criteria = one file in src/collect/, exporting:
export function extract(input: CollectInput): ExtractedCriterion[];

// one source of verification acts = one file in src/ingest/, exporting:
export async function collect(deps: Deps, scope: Scope): Promise<Verification[]>;
```

Internal typing may be richer; the exported shape may not change.

## 4. Ownership map

| Lot | Owns | Depends on |
|---|---|---|
| L0 socle | everything listed in §2, plus the stubs of every entry point | — |
| L1 extraction | `src/collect/*` (six origins §6, fingerprint, stable numbering), `tests/collect/*` | L0 |
| L2 verifications | `src/ingest/*` (graph, bitbucket, comments, confluence, pipeline §7/§10), `tests/ingest/*` | L0 |
| L3 weaving | `src/domain/links.ts`, `src/domain/confidence.ts` (four paths §9/§10, learning §9.4), `tests/domain/links*.test.ts` | L0 |
| L4 coverage | `src/domain/coverage.ts`, `bulletin.ts`, `witness.ts`, `timeline.ts`, `tests/domain/coverage*.test.ts` | L0 |
| L5 perforations | `src/domain/perforations.ts`, `src/domain/dangling.ts`, `tests/domain/perforations*.test.ts`, `tests/domain/dangling*.test.ts` | L0 |
| L6 falsifiability | `src/domain/falsifiability.ts`, `src/domain/proposals.ts`, `tests/domain/falsifiability*.test.ts`, `tests/domain/proposals*.test.ts` | L0 |
| L7 métré | `src/domain/metric.ts`, `src/domain/zones.ts`, `src/domain/holes.ts`, `tests/domain/metric*.test.ts`, `tests/domain/zones*.test.ts` | L0 |
| L8 tools and agent | `src/actions/*` bodies, `static/agent/prompt.md`, `static/skill/**`, `tests/actions/*` | L3–L7 |
| L9 screens | `src/viewmodel/*`, `src/ui/*`, `src/handlers/*` bodies, `tests/viewmodel/*`, `tests/handlers/*` | L3–L7 |
| L10 certificate | `src/domain/certificate.ts`, `src/handlers/ingest.ts`, `consumer.ts`, `scheduled.ts`, `events.ts` bodies, `tests/domain/certificate*.test.ts` | L4, L5 |
| L11 public site and demo | `site/**`, `src/sample/**`, `docs/DEMO-DATA.md`, `tests/site/*`, `tests/sample/*` | L3–L7 |
| L12 submission docs | `docs/RECETTE.md`, `VIDEO-SCRIPT.md`, `JUDGES.md`, `SUBMISSION.md`, `README.md` | all |

`src/db/*` (other than `schema.ts`) belongs to L0 and may be completed by L4 when
a query is missing; `tests/db/*` belongs to L0.

## 5. Data model

Fifteen tables (§19), DDL in `src/db/schema.ts`: `criterion`,
`criterion_version`, `verification`, `link`, `coverage_snapshot`, `perforation`,
`dangling`, `hole`, `proposal`, `zone_risk`, `metric_rule`, `witness`,
`coverage_event`, `cursor`, `budget`. No table holds a per-person statistic.
`src/db/mapping-*.ts` converts rows to domain types; the conversion is tested
both ways.

## 6. Definition of done for a lot

- `npx tsc --noEmit` clean, `npx vitest run` green, guards green
  (`npm run check:limits`, `node tools/check-manifest.mjs` when the manifest is
  touched);
- the acceptance items of §24 that the lot covers are tested by name
  (a test title quotes the recipe number);
- the pull request body carries `## Scope` (exact), a `## Why` line quoting the
  spec section, and a `## Proof` line listing the tests added;
- nothing is merged by hand: the Mergify queue merges, and conflicts are
  resolved by the InferHub agent (`docs/CONFLICTS.md`).
