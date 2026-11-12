# Hermes — the conflict agent (InferHub)

Mergify is the **only merge pilot**. What it cannot do is resolve a conflict: a
`DIRTY` pull request waits for its author. Hermes takes over that part — it
rebases, has each elementary conflict resolved by a model on InferHub, verifies
the result, pushes with a lease and reports on the pull request.

Nothing here merges, labels as approved, or closes anything.

## Files

| File | Role |
|---|---|
| `conflict_agent.py` | The resolver: one conflict block at a time, the rest of the file copied verbatim (never a full rewrite — a large file would be truncated), push with `--force-with-lease`, report on the PR. Exit codes: `0` pushed, `1` failure commented, `2` nothing to do |
| `compilation_gate.py` | A resolution that does not compile is **never pushed**. Circuit breaker: `CONFLICT_COMPILE_GATE=0` |
| `quota.py` | Bounds the calls: cooldown per head SHA, hourly ceiling, 3 per PR per 30 min |
| `union_journal.py` | Joins both sides without a model when the conflict is a pure addition |
| `test_*.py` | The agent tests itself in CI (stdlib only, no network) |

Driven by `.github/workflows/conflict-resolver.yml` (cron 10 min, at the end of
`ci`, and `workflow_dispatch -f pr=N`), and by the sweeper
`.github/workflows/pr-auto-merge.yml` for rebases.

## Configuration (repository settings)

| Kind | Name | Value |
|---|---|---|
| secret | `INFERHUB_API_KEY` | InferHub key — never printed, never committed |
| var | `INFERHUB_BASE_URL` | `https://api.inferhub.dev/v1/chat/completions` — the **full** endpoint, despite the name |
| var | `INFERHUB_MODEL` | `combo/cheap` |
| var | `INFERHUB_AGENT_RESOLVE` | `1` (`0` = circuit breaker) |
| var | `CI_RUNNER` | `["self-hosted","trame-worker"]` |
| secret | `AUTOMERGE_PAT` | owner token: a push signed `github-actions[bot]` puts workflows in `action_required` and the PR stays BLOCKED |

Guard rails: `.github/` and `.mergify.yml` are never touched
(`REFUSED_PREFIXES`), labels `hold` / `intervention-humaine` stop everything,
at most 3 PRs per run.

## Known traps

1. `INFERHUB_BASE_URL` is used as the **complete** endpoint URL. With
   `https://api.inferhub.dev/v1` every resolution dies with HTTP 404.
   `normalize_api_url()` accepts a bare base, a `/v1` base, a trailing slash or
   the full endpoint.
2. `combo/cheap` routes to a reasoning model: if the token budget goes into
   `reasoning_content`, `message.content` comes back empty → raise `AgentError`
   instead of pushing an empty resolved file.
3. `quota.autoriser()` stamps **before** the call: a transport error used to burn
   the 20-minute cooldown. `quota.release_stamp(pr, sha)` gives it back when the
   failure is an InferHub call or an empty content.
4. After a failure, the cooldown is per SHA: push an empty commit to change the
   head, otherwise the sweeper skips the PR.
5. A `DIRTY` PR has no `pull_request` run (no merge ref) and a `*/5` cron does
   not tick on a young repository — reliable wake-up:
   `gh workflow run conflict-resolver.yml -f pr=N`, or `gh workflow run "CI" --ref main`
   (the end of CI wakes the sweeper through `workflow_run`).

## End-to-end test

Two branches editing the same paragraph of a document, merge the first one, the
second turns `CONFLICTING`, then:

```bash
gh workflow run conflict-resolver.yml -f pr=<N>
```

The agent rebases, keeps **both** contributions, pushes with a lease, comments
the PR, and the Mergify queue merges it once `ci`, `ci-budget` and `couche0` are
green. Full runbook: `docs/CONFLICTS.md`.
