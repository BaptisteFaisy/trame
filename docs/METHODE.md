# MÉTHODE — how Trame is built

## 1. One lot, one worktree, one pull request

The socle froze the contracts (`docs/CONTRACTS.md`): types, ports, defaults,
entry points, DDL, manifest, guards. Everything after that is parallel work on
disjoint files.

```bash
# a lot works in its own worktree, never in the shared tree
git -C ~/Bureau/trame fetch origin
git -C ~/Bureau/trame worktree add ~/Bureau/trame-wt/<lot> -b lot/<lot> origin/main
cd ~/Bureau/trame-wt/<lot>
npm ci            # or: cp -al ~/Bureau/trame/node_modules .
```

Rules for a lot:

- touch only the files it owns (ownership map: `docs/CONTRACTS.md` §4);
- never rewrite a file another agent is writing — the shared tree is not a
  scratch pad;
- `npx tsc --noEmit` clean, `npx vitest run` green, guards green before pushing;
- files < 500 lines, functions < 50 lines (CI enforces it);
- pull request body: exact `## Scope` (generated with
  `git -c core.quotepath=off diff --name-only origin/main`), `## Why` quoting
  the spec section, `## Proof` listing the tests added;
- nothing is merged by hand: the Mergify queue merges when `ci`, `ci-budget` and
  `couche0` are green; conflicts are resolved by the InferHub agent
  (`docs/CONFLICTS.md`).

## 2. Waves

| Wave | Lots | Why this order |
|---|---|---|
| L0 | socle | contracts, entry points, DDL, pipeline, fakes |
| 1 | L1 extraction · L2 verification acts · L3 weaving · L4 coverage · L5 perforations and dangling · L6 falsifiability and proposals · L7 métré and zones | pure domain: they only need the frozen types and the fakes |
| 2 | L8 MCP tools and Rovo agent · L9 screens · L10 certificate and triggers · L11 public site and seeded demo · L12 submission docs | they consume the domain engines |

A lot of wave 2 may start early if it only needs the signatures, not the
results — it then tests against the fakes.

## 3. Definition of done

The twenty acceptance items of §24 are the acceptance checklist: each one is covered by
a named test (`tests/acceptance/<n>-<slug>.test.ts`) that quotes its recipe
number. A lot is done when the items it owns are green, not when its files are
written.

## 4. Known traps (from the sibling projects)

- `couche0` reads the `## Scope` of the pull request body: an undeclared file,
  or a declared file that is not touched, fails the check. Accented paths must
  come from `git -c core.quotepath=off diff --name-only`.
- `.github/workflows/ci.yml` is a guarded file: bumping it requires
  `SAMVISION_ALLOW_GUARD_BUMP` in the pull request body.
- `concurrency` with `cancel-in-progress: true` produces `cancelled` checks
  that the queue reads as red: required checks use `false`.
- A required-status-check protection with `strict: true` is incompatible with
  the Mergify queue: `strict` stays `false`.
- One self-hosted runner (`r630-trame-01`): `merge_queue.max_parallel_checks`
  is 1, speculation would starve the pull requests' CI.

## Test de l’agent de conflits

Version A : le texte de la branche A — il faut garder les deux apports.
Version B : le texte de la branche B — lui aussi doit survivre.
