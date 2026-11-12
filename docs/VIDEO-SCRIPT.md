# VIDEO SCRIPT — Trame (Codegeist 2026)

> **Trame — the coverage of your acceptance criteria** · *the thread that is missing* (*le fil qui manque*)
> Target length: **4:45**. Language: **English** (the submission is in English);
> French cues are kept in parentheses after each line.
> Spec source: `docs/CAHIER-DES-CHARGES.md` §25 (the shot list), §26 (how the
> judges will test), §12 (the deliverables the shots must show).
> Script base : `origin/main` @ `b3f8cce` (`b3f8cced169c9d10f92f94ee9b72c4930122df12`).
> Every number in the "show on screen" column is **measured**. The figures the
> screen shows are the ones the **engine** computes on the seeded project
> (`tests/site/demo-numbers.test.ts`, on branch `lot/l11b-site`); the figures the
> **seed** declares are in `tests/sample/demo-project.test.ts` (`origin/main`).
> Where the two differ, the difference is stated.

## 0. Status of this script — read before shooting

As of 12 November 2026:

- the **domain engine is written, merged and tested** : `computeCoverage`,
  `detectPerforations`, `detectDangling`, `findHoles`, `buildBulletin` all live
  in `src/domain/*` on `origin/main`, with a passing `npx vitest run` (26 files,
  339 tests) ;
- the **demonstration project of §26 is seeded and tested** :
  `src/sample/demo-project.ts` (`tests/sample/demo-project.test.ts`, 10 tests) ;
- the **eleven screens of §17 and the fourteen MCP tools remain stubs**
  (`{ notImplemented: … }`) : no live Jira screen can be filmed yet ;
- the **public demo site exists on branch `origin/lot/l11b-site`**, not merged
  : `npm run site:dev` serves a real page that calls the real engine
  (`site/src/demo/engine.ts` → `buildDemoProject()` + the domain functions) ;
- nothing here promises a feature the repository does not contain. The captures
  of §2 can be made from the terminal (test runs) or from the site branch.

## 1. The run of shots (§25, timing kept)

The **measured demo figures** (the ones to put on screen — they come from the
engine, never hard-coded):

| What | Measured |
|---|---|
| Tickets | 6 (`TRAME-101` … `TRAME-106`) |
| Acceptance criteria | 24, of which **4 unfalsifiable** |
| Automated test executions | 14 |
| Perforations (criterion edited after its test) | 3 |
| Dangling threads (dead acts still linked) | 2 (of 3 disabled tests ; the third covers nothing) |
| Holes (no living mesh) | 4 — 2 never verified, 2 whose only test was disabled |
| Deleted criteria | 2 |

### 0:00 – 0:25 — The release that lied

- **On screen**: a Jira sprint board, tickets closed, a green pipeline, the
  line "All acceptance criteria are covered". Then the Trame bulletin slides
  over it: the same scope, dated, with the real figure.
- **Show on screen**: the demo project's real numbers — **6 tickets, 24
  criteria, and the holes the engine finds (4), of which 2 were never verified
  at all**.
- **Spoken**: "On the third of November, this team closed a release. Six
  tickets, green pipeline, and the message was: *all acceptance criteria are
  covered*. *(tous les critères d'acceptation sont couverts)* Trame reads the
  same release. Some of the criteria were not covered — and nobody could have
  said so, because the information did not exist."
- **Cut**: hard cut on the number; the number replaces the claim on the same frame.

### 0:25 – 1:00 — The weave map

- **On screen**: the weave map (*carte de trame*) — warp threads = criteria,
  weft passes = acts of verification, meshes = coverage. Empty meshes show the
  background through them; the holes are sized by priority.
- **Show on screen**: the 24 criteria as warp threads, the 2 never-verified
  holes wide open, the 2 whose test died drawn with a broken stroke.
- **Spoken**: "Each acceptance criterion is a warp thread. Each act that
  verifies it is a weft pass. Trame weaves the two, and the holes are the
  places where the background shows through."
- **Cut**: slow pan across the map, then a push-in on an empty mesh.

### 1:00 – 1:35 — Covered on paper

- **On screen**: the criterion sheet (*fiche critère*) of `AC-2` — strength
  `declared`, no artefact, no execution, one comment.
- **Show on screen**: a criterion covered only by a comment — force `declared`,
  not `machine`.
- **Spoken**: "Covered on paper. Not proven. *(couvert sur papier, pas
  prouvé)* A criterion is *covered* when a verification act exists. It is
  *proven* only when the act is strong, the link is declared, and the
  criterion has not changed since."
- **Cut**: the badge `declared` highlighted; cut to the empty artefact slot.

### 1:35 – 2:10 — The perforation (the judgement nobody makes)

- **On screen**: the perforation registry (*registre des perforations*): one
  criterion, two dates, and the class: `fresh`, `dry` or `multiple`.
- **Show on screen**: the demo's **3 perforations** — a criterion edited
  *after* its test ran, with both dates side by side.
- **Spoken**: "Here is the judgement nobody makes. This criterion was edited
  after its test ran. The link is still there — but it does not hold any more:
  the test verified an older version of the criterion. Trame calls it a
  perforation."
- **Cut**: the two dates side by side, then the mesh drawn in a broken stroke.

### 2:10 – 2:40 — The dangling threads (coverage goes down)

- **On screen**: the dangling queue (*file des fils détendus*): a disabled
  test, a renamed test, a deleted criterion — each with its reason and its
  impact, and the coverage figure dropping.
- **Show on screen**: the demo's **2 dangling threads** (the two disabled tests
  still linked to a criterion) and the **2 deleted criteria**.
- **Spoken**: "And the opposite: verification acts that no longer cover
  anything. A test was disabled. A criterion was deleted. These threads still
  give comfort — and they are counted. Trame removes them from the figure. The
  coverage goes *down*."
- **Cut**: the percentage animates downward while the queue opens.

### 2:40 – 3:05 — The métré (which hole comes first)

- **On screen**: the hole explorer, ranked. The first hole is not the most
  numerous: its zone already produced defects. The score terms are displayed:
  kind, zone risk, recurrence.
- **Show on screen**: the **4 holes ranked**, each with its score and its three
  terms (kind, zone risk, recurrence).
- **Spoken**: "Trame does not count holes, it ranks them. A hole in a zone
  that has already broken is not the same hole as a hole in a zone that has
  never broken. The score is shown, term by term."
- **Cut**: the terms expand under the ranked hole.

### 3:05 – 3:25 — The agent Rovo

- **On screen**: Rovo Chat, the agent **Le fil** (*the thread*). The question
  is typed; the answer appears with figures and the criterion quoted.
- **Show on screen**: the agent's *manifest* surface (`manifest.yml`, module
  `rovo:agent` `le-fil`, the fourteen actions) and its prompt
  (`static/agent/prompt.md`). Honest caption: the agent is configured, its
  tools are stubs.
- **Spoken**: "The same measure, asked in words. *Which criteria of this
  release are covered only by a declaration?* The agent is configured to
  answer with counts, to name the criterion and its source, and to refuse to
  conclude when the sample is too small."
- **Cut**: the typed question, then the answer appearing word by word.

### 3:25 – 3:50 — The weave certificate

- **On screen**: the Confluence page of the weave certificate (*certificat de
  trame*): scope, date, coverage by strength and link kind, the list of acts —
  and, in its own section, an explicit statement of what is **not** covered.
- **Show on screen**: the certificate's `notCovered` list (the **4 holes**)
  and the **4 unfalsifiable** criteria declared apart.
- **Spoken**: "And the certificate: dated, scoped, auditable. It lists every
  act of verification — type, date, actor, strength — the open perforations,
  the dangling threads — and it states, explicitly, what is not covered. A
  certificate that hides its gaps is not a certificate."
- **Cut**: scroll to the "not covered" section; hold on it for two seconds.

### 3:50 – 4:15 — The link with the sibling app

- **On screen**: two windows side by side — the Trame criterion sheet and the
  `preuve-a-l'appui` (proof-on-demand) Done gate listing the available proofs.
- **Spoken**: "Trame is a measurement layer, not a gate. It never blocks a
  closure. But a sibling app can now ask it: for this criterion, which proof
  exists, and at which strength? Trame answers — machine, attested, or
  declared."
- **Honest note**: this shot needs the sibling app `preuve-a-l-appui` (§13).
  Nothing in this repository implements that integration; if the sibling app is
  not ready on the day, cut this slot and extend the certificate shot instead.

### 4:15 – 4:45 — Architecture

- **On screen**: a diagram — the Teamwork Graph objects `test-*`, the four
  link paths, the fingerprint cache, Forge SQL.
- **Show on screen**: `src/domain/*` (pure logic), `src/ingest/*` (real graph /
  Bitbucket / comments / pipeline adapters), `src/collect/*` (six extraction
  origins), `src/db/*` (Forge SQL), `src/sample/demo-project.ts`.
- **Spoken**: "How it is built. The Atlassian graph gives the executions — but
  no direct link between a criterion and a test. Trame rebuilds it in four
  paths: an explicit mention, a naming convention, a similarity proposal —
  never counted as coverage — and a human declaration. Every criterion is
  fingerprinted, so a change only recomputes what changed. And the measures are
  stored in Forge SQL."
- **Cut**: hold on the diagram, end card with the repository URL.

## 2. The four captures to shoot

Four still images. Since the screens and tools are stubs, each capture is made
either from a **test run** (terminal) or from the **live demo site** on branch
`lot/l11b-site` (which serves the real engine).

### Capture 1 — the weave map + the holes

- **From the tests** (the data behind the map):

```bash
npx vitest run tests/sample/demo-project.test.ts   # 10 tests : 6 tickets, 24 critères
npx vitest run tests/domain/holes.test.ts          # 24 tests : les trous classés
```

- **From the live site** (renders the real engine on the seeded project):

```bash
git checkout lot/l11b-site && npm ci
npm run site:dev      # Vite sert la carte de trame calculée en direct
```

- **State**: the screenshot today is the terminal output or the site page; the
  `jira:globalPage` screen itself is a stub (`{ notImplemented: 'weave-map' }`).

### Capture 2 — the perforation

- **From the tests** (a criterion edited after its test, both dates, its class):

```bash
npx vitest run tests/domain/perforations.test.ts -t '§24.4'   # 7 tests verts
```

- **From the live site**: the *Perforations* panel of `npm run site:dev`
  (branch `lot/l11b-site`).
- **State**: `src/domain/perforations.ts` is real ; the screen and the MCP tool
  `list-perforations` return `{ notImplemented: … }`.

### Capture 3 — the bulletin

- **From the tests**:

```bash
npx vitest run tests/domain/bulletin.test.ts -t '§24.13'   # 4 tests verts
```

- **From the live site**: the bulletin section of `npm run site:dev`.
- **State**: `src/domain/bulletin.ts` is real ; the gadget and the tool
  `get-bulletin` are stubs.

### Capture 4 — the certificate

- **From the tests**:

```bash
npx vitest run tests/domain/certificate.test.ts   # 4 tests verts, dont §24.14
```

- **From the live site**: the certificate section of `npm run site:dev`
  (lists what is verified and, explicitly, what is not covered).
- **State**: the certificate *content* is real ; the Confluence page
  (`publishCertificate`) and the action `publish-certificate` are stubs.

**Shooting note**: the four captures share one data source — the seeded
demonstration project of §26 (`src/sample/demo-project.ts`), passed through the
real engine. Until the site branch is merged and the app is deployed, film the
terminal runs or the `lot/l11b-site` site; the screens themselves will follow
in lot L9.

## 3. Recording notes

- English narration, no music bed under the speech, no emoji anywhere.
- The only numbers spoken are the measured ones of §1 (6 tickets, 24 criteria,
  3 perforations, 2 dangling, 4 holes, 4 unfalsifiable). The coverage
  *percentage* is computed live by the engine and is not hard-coded: capture it
  from `npm run site:dev` and speak it **with its denominator** ("x criteria of
  24"), never as a bare number.
- Numbers are always spoken with their denominator and their date: "87 per
  cent of 24 criteria, computed on 12 November".
- The words **covered**, **covered strongly**, **covered up to date** and
  **proven** are never used interchangeably; the captions use the same words
  as the narration.
- Total length 4:45; the two shots that may be cut are 3:50–4:15 (sibling
  app) and 4:15–4:45 (architecture).