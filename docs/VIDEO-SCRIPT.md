# VIDEO SCRIPT — Trame (Codegeist 2026)

> **Trame — the coverage of your acceptance criteria** · *the thread that is missing* (*le fil qui manque*)
> Target length: **4:45**. Language: **English** (the submission is in English);
> French cues are kept in parentheses after each line.
> Spec source: `docs/CAHIER-DES-CHARGES.md` §25 (the shot list), §26 (how the
> judges will test), §12 (the deliverables the shots must show).
> Script base: **`origin/main` @ `7c468f7`**
> (`7c468f7bdb33d9d731b71551e2d30a8e7174e657`), written on **13 November 2026**.
> Every number below is **measured on that commit**. The figures the screen shows
> are the ones the **engine** computes on the seeded project
> (`tests/site/demo-numbers.test.ts`, six passing tests, on `main`); the figures
> the **seed** declares are in `tests/sample/demo-project.test.ts`. Where the two
> differ, the difference is stated.

## 0. Status of this script — read before shooting

This version was rewritten on **13 November 2026** for `main` @ **`7c468f7`**.
The product it describes exists and is filmable today. The three things that
cannot be shown as if they existed are named in §0.2, and they never are.

### 0.1 What is real — and where to film it

| Surface | State on 13 November 2026 | Where to film it |
|---|---|---|
| Test suite | `npx vitest run` → **49 files, 428 tests**, all green (≈8 s warm) | terminal |
| The eleven screens of §17 | **real server-side**: one view-model each (`src/viewmodel/*.ts`) and one resolver handler (`src/handlers/*.ts`, registered in `src/handlers/resolver.ts`) — `weave-map`, `criterion-detail`, `holes`, `perforations`, `dangling`, `bulletin`, `certificate`, `validation-queue`, `zone-risks`, `visibility`, `timeline` | the public site panels (§2), `tests/handlers/screens.test.ts` |
| The fourteen MCP tools + four internal actions | **real** (`src/actions/*.ts`, dispatch in `src/handlers/dispatch.ts` ; `tests/contract/entry-points.test.ts` → 5 green) | Rovo, the dispatcher, or the terminal |
| Trigger, consumer, webtrigger, four JQL functions, closure validator | **real** (`src/handlers/{events,consumer,scheduled,jql,validator}.ts` ; `tests/handlers/triggers.test.ts` → 14 green) | Jira issue navigator (the four functions), the validator message |
| The Forge app | **deployed**: `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51`, version **2.1.0**, environment `development`, installed on **`one-atlas-cndz.atlassian.net`** (Jira **and** Confluence, page « weave-certificates ») | that tenant, in a browser |
| The public demo site | **online on `main`**: <https://tradoooo.github.io/trame/> — deploys from `main`, **not** from a branch. The page executes the real engine (`site/src/demo/engine.ts` → `computeCoverage`, `detectPerforations`, `detectDangling`, `findHoles`, `buildBulletin`). 12 tests: `tests/site/demo-numbers.test.ts` (6) + `tests/site/demo-render.test.tsx` (6) | the URL itself |
| Stills ready to cut | `docs/captures/01-site-entier.png` … `05-architecture.png`, shot on 13 November from that URL — see `docs/CAPTURES.md` for what each one contains and how to retake it | timeline |

### 0.2 What does not exist — never stage it

1. **A drawn Jira screen rendered by UI Kit 2.** `src/ui/frontend/index.tsx` is
   the Forge UI resource: it renders **the registry of the eleven resolver
   keys**, not the screens. `@forge/react` v10 does not expose `render`, so the
   UI Kit 2 drawing is not wired. The Jira and Confluence pages of the installed
   app open and answer — they show that registry. **Never composite a drawn
   screen over them**; film the site for the drawing, and the app for the page,
   the fields, the gadget, the JQL functions and the validator message.
2. **Text written by a model.** `src/ingest/llm.ts` returns the
   `NOT_IMPLEMENTED` mark for `proposeReformulation` and `draftTest` — never a
   plausible fake. The draft the `propose-test` tool serves is deterministic
   (the criterion quoted, the expected form of verification, the suggested
   component). The voice-over says so if the shot shows it.
3. **A certificate page written into Confluence by the app** — a declared
   fallback, not a gap: `publishCertificate` (`src/ingest/confluence.ts`)
   returns `null`, so the action answers "publication impossible" and the §21
   fallback applies: the certificate is produced in the app, then exported by
   hand. Film the certificate **in the site panel** (or the app page); show the
   Confluence page « weave-certificates » as the place it will live, with a
   caption that says exactly that.

### 0.3 Check before the first take (two minutes)

```sh
npx vitest run tests/site/demo-numbers.test.ts tests/site/demo-render.test.tsx   # 12 verts
npx vitest run tests/handlers/screens.test.ts tests/contract/entry-points.test.ts # 3 + 5 verts
npx vitest run                                                                     # 49 fichiers, 428 tests
curl -sI -o /dev/null -w '%{http_code}\n' https://tradoooo.github.io/trame/       # 200
```

Then, in the browser: open the site and check that the nine counters read
**24 / 18 / 4 / 13-18 / 1 / 4 / 11 / 3 / 2** (see §1). Open the installed app on
`one-atlas-cndz.atlassian.net` and check that the Jira page, the Confluence page
and the issue panel open. If the tenant has no ingested data, the JQL functions
return an empty set: then film the contract test instead of the navigator, and
say on the caption that the tenant is empty — never fake a result.

### 0.4 What changed since the 12 November draft

That draft was written on `main` @ a commit since superseded, and it described a
product the repository no longer was. Corrections, all dated
13 November 2026: the base commit is now `7c468f7`; the suite reads 49 files and
428 tests; the eleven screens and the fourteen tools are **no longer placeholders
that answer an "unimplemented" marker** — they answer data through the resolver;
the public site is **merged on `main` and online**, so no branch checkout is
needed to film it; the app is deployed and installed, so the Jira and Confluence
pages can be filmed as they are. Only the three items of §0.2 remain, and they
are stated on screen.

## 1. The run of shots (§25, timing kept)

The **measured demo figures** — the ones to put on screen. They come from the
engine on `main` @ `7c468f7`, never hard-coded:

| What | Measured |
|---|---|
| Tickets | 6 (`TRAME-101` … `TRAME-106`) |
| Acceptance criteria written | **24** |
| Verifiable criteria — the denominator | **18** |
| Unverifiable criteria, counted apart | **4** |
| Covered, declared | **13 of 18** |
| Covered, provisional (similarity proposal above 0.85) | **1** |
| Proven (strong, current, declared) | **11 of 18** |
| Holes | **4** — 2 never verified, 2 whose only act is a disabled test |
| Perforations (criterion edited after its act) | **3** — `TRAME-101/AC-4`, `TRAME-102/AC-4`, `TRAME-104/AC-2` |
| Loose threads (dangling verification acts) | **2** of 3 disabled tests; the third covers nothing |
| Deleted criteria | **2** — `TRAME-106/AC-2`, `TRAME-106/AC-4` |
| Verification acts | 14 |

Sample prop for every panel shot: the section `#demo` of the public site, ticket
selector on *Whole project*. Still available: `docs/captures/02-demo.png`.

### 0:00 – 0:25 — The release that lied

- **On screen**: a Jira sprint board, tickets closed, a green pipeline, the line
  "All acceptance criteria are covered" — **B-roll, not in this repository**:
  shoot it on a scratch project, or open on the site hero (`#top`) instead.
- **Show on screen**: then the site's **counters**: 24 criteria written, 18 of
  them verifiable, **4 holes**.
- **Spoken**: "On the third of November, this team closed a release. Six
  tickets, green pipeline, and the message was: *all acceptance criteria are
  covered*. *(tous les critères d'acceptation sont couverts)* Trame reads the
  same release. Twenty-four criteria written, eighteen that can actually be
  verified, four unfalsifiable — and four holes. Nobody could have said so,
  because the information did not exist."
- **Cut**: hard cut on the number; the number replaces the claim on the same frame.

### 0:25 – 1:00 — The weave map

- **On screen**: the site's `#weave` section, which draws the metaphor on the
  seeded project (AC-1 … AC-4 against `testShouldWeave`, `testShouldCountHoles`,
  `testShouldShowZone`), then the `#demo` **three axes** block: strength
  (machine / attested / declared), link kind (declared / confirmed / derived),
  freshness (current / stale).
- **Show on screen**: the three axes side by side, never merged: 13 covered
  declared, 1 provisional, 11 proven, out of 18 verifiable.
- **Spoken**: "Each acceptance criterion is a warp thread. Each act that
  verifies it is a weft pass. Trame weaves the two, and the holes are the
  places where the background shows through. Strength, link kind and freshness
  stay three separate lines — never one score."
- **Honest note**: the full 24-thread map is **not drawn** anywhere. If you need
  a full-screen map, use the site's drawn sample (`#weave`) and say it is a
  sample, or show `src/viewmodel/weave-map.ts` answering through
  `tests/viewmodel/weave-map.test.ts` (5 green).
- **Cut**: slow pan across the drawing, then a push-in on an unwoven mesh.

### 1:00 – 1:35 — Covered on paper, not proven

- **On screen**: the site's *Criterion* selector → **`TRAME-102 / AC-2`**. The
  sheet shows the state badge, the criterion kind, then its links table — act,
  form, strength, date, link path, and whether the mesh holds. One row only:
  a **manual case** (`manual-case`, strength **attested**), no machine
  execution.
- **Show on screen**: `attested` ≠ `machine` — the criterion is *covered* and
  not *proven*; the counters keep them apart (13 covered declared, 11 proven).
- **Spoken**: "Covered, but not proven. *(couvert, pas prouvé)* A criterion is
  *covered* when a verification act exists. It is *proven* only when the act is
  strong — a machine execution —, the link is declared, and the criterion has
  not changed since."
- **Cut**: the badge highlighted; cut to the missing artefact slot.
- **Installed-app alternate**: the ticket's « Criteria » panel and the read-only
  `Trame` / `Holes` / `Perforations` fields on the same ticket. These are real
  modules of the deployed app (2.1.0); they show computed values, not drawings.

### 1:35 – 2:10 — The perforation (the judgement nobody makes)

- **On screen**: the site's perforation registry: one criterion per row, the
  criterion's date, the act's date, the gap in days, and the class (`fresh`,
  `dry` or `multiple`).
- **Show on screen**: the three rows, dated — `TRAME-102/AC-4` (act 6 Nov,
  criterion edited 7 Nov, 5 days old, class `fresh`), `TRAME-101/AC-4`
  (`fresh`), `TRAME-104/AC-2` (34 days, class `dry`).
- **Spoken**: "Here is the judgement nobody makes. This criterion was edited
  after its test ran. The link is still there — but it does not hold any more:
  the test verified an older version of the criterion. Trame calls it a
  perforation, and it carries both dates and its class."
- **Cut**: the two dates side by side, then the mesh drawn in a broken stroke.

### 2:10 – 2:40 — The loose threads (coverage goes down)

- **On screen**: the site's loose-thread queue: the act, the reason
  (`test-disabled`, `criterion-deleted`), and the impact on the coverage.
- **Show on screen**: the **2 loose threads** — `TRAME-101.testShouldCountHoles`
  and `TRAME-104.testShouldDropDanglingCoverage`, both disabled and still
  linked — and the **2 deleted criteria** of `TRAME-106`.
- **Spoken**: "And the opposite: verification acts that no longer cover
  anything. A test was disabled. A criterion was deleted. These threads still
  give comfort — and they are counted. Trame removes them from the figure. The
  coverage goes *down*."
- **Cut**: the percentage animates downward while the queue opens.

### 2:40 – 3:05 — The métré (which hole comes first)

- **On screen**: the site's hole explorer, ranked, each row with its score and
  its three terms (kind, zone risk, recurrence) shown as `weight × value`.
- **Show on screen**: the four holes ranked — **`TRAME-104/AC-1` 0.684**,
  `TRAME-104/AC-4` 0.605, `TRAME-101/AC-4` 0.450, `TRAME-105/AC-4` 0.313. The
  first is a non-regression criterion in `src/104`, a zone that already broke
  (three defects, zone score 0.78).
- **Spoken**: "Trame does not count holes, it ranks them. A hole in a zone that
  has already broken is not the same hole as a hole in a zone that has never
  broken. The score is shown, term by term: kind, zone risk, recurrence."
- **Cut**: the three terms expand under the ranked hole.

### 3:05 – 3:25 — The agent Rovo

- **On screen**: the module `rovo:agent` `le-fil` of `manifest.yml`, its prompt
  `static/agent/prompt.md`, then the question typed in Rovo Chat.
- **Show on screen**: the module `rovo:mcp` `trame-mcp` with its **fourteen
  tools**, all real (`src/actions/*.ts`, `tests/contract/entry-points.test.ts`).
- **Honest note**: the tools and the agent configuration are real; whether Rovo
  answers on screen depends on the tenant — **test it before the session**. If
  it does not answer, film the tool through the dispatcher or the terminal and
  keep the same voice-over.
- **Spoken**: "The same measure, asked in words. *Which criteria of this release
  are covered only by a declaration?* The agent is configured to answer with
  counts, to name the criterion and its source, and to refuse to conclude when
  the sample is too small."
- **Cut**: the typed question, then the answer appearing word by word.

### 3:25 – 3:50 — The weave certificate

- **On screen**: the site's certificate panel: scope, date, coverage, then the
  table of the acts that hold a mesh (criterion, form, strength, date, link
  path), then the section **"What is NOT covered"**.
- **Show on screen**: that section — the **4 holes**, the **4 unfalsifiable**
  criteria declared apart, the open perforations and the loose threads.
- **Spoken**: "And the certificate: dated, scoped, auditable. It lists every act
  of verification — its form, its strength, its date, the link path that holds
  it — the open perforations, the loose threads — and it states, explicitly,
  what is not covered. A certificate that hides its gaps is not a certificate."
- **Honest note**: the Confluence write is not wired (`publishCertificate` →
  `null`, §21 fallback). You may show the « weave-certificates » page of the
  installed app as the place the certificate will live — with a caption saying
  the export is manual today. Do not show an empty page as if it were the
  certificate.
- **Cut**: scroll to "What is NOT covered"; hold two seconds.

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

- **On screen**: the site's `#architecture` section (ten lines, four link
  paths, the documents of the repository), or the still
  `docs/captures/05-architecture.png`.
- **Show on screen**: `src/domain/*` (pure logic), `src/ingest/*` (graph,
  Bitbucket, comments, pipeline adapters — except the model generation),
  `src/collect/*` (six extraction origins), `src/db/*` (Forge SQL),
  `src/sample/demo-project.ts`, and `site/src/demo/engine.ts` (the site calls
  the same domain functions).
- **Spoken**: "How it is built. The Atlassian graph gives the executions — but
  no direct link between a criterion and a test. Trame rebuilds it in four
  paths: an explicit mention, a naming convention, a similarity proposal —
  never counted as coverage — and a human declaration. Every criterion is
  fingerprinted, so a change only recomputes what changed. And the measures are
  stored in Forge SQL."
- **Cut**: hold on the diagram, end card with the repository URL.

## 2. The four stills to shoot — and the five you already have

Five stills are done: `docs/captures/01-site-entier.png` (the whole page),
`02-demo.png` (the counters, the axes, the top of the hole table), `03-ecrans.png`
(the eleven screen cards of `#screens` — drawn by hand in the page, as the site
says itself), `04-trame.png` (the weave metaphor),
`05-architecture.png` (architecture and recipe). They were shot from the online
site on 13 November; `docs/CAPTURES.md` gives their exact offsets and the command
to retake them. The four below are the shots that still need their own frame —
all of them come from the **same live site** (no checkout, no branch, no build)
or from the **installed app**.

### Still 1 — the weave map and the holes

- **From the live site**: `#demo`, selector *Whole project* → the counters
  (24 / 18 / 4 / 13-18 / 1) and the hole table with its scores.
- **Underneath the data** (what proves the screen is not a mock):

```sh
npx vitest run tests/site/demo-numbers.test.ts   # 6 verts : les chiffres de la démo
npx vitest run tests/domain/holes.test.ts        # les quatre trous, leur métré
```

- **State**: the screen data is real (`src/viewmodel/weave-map.ts`,
  `src/handlers/weave-map.ts`); the Jira page of the installed app shows the
  registry of the eleven resolver keys, not a drawing.

### Still 2 — the perforation

- **From the live site**: the perforation registry of `#demo` — three rows, two
  dates per row, the gap in days, the class.
- **Underneath**:

```sh
npx vitest run tests/domain/perforations.test.ts -t '§24.4'   # 7 verts
```

- **State**: `src/domain/perforations.ts` and the screen handler are real; the
  registry is the same data the MCP tool `list-perforations` answers.

### Still 3 — the bulletin

- **From the live site**: the bulletin panel of `#demo` — scope, computation
  date, coverage, the top holes, and the note about the previous witness.
- **Underneath**:

```sh
npx vitest run tests/domain/bulletin.test.ts -t '§24.13'   # 4 verts
```

- **State**: `src/domain/bulletin.ts`, the screen handler and the tool
  `get-bulletin` are real. The Jira dashboard gadget « Weave bulletin » is a real
  module of the deployed app; film it if the tenant holds data.

### Still 4 — the certificate

- **From the live site**: the certificate panel of `#demo`, scrolled to "What is
  NOT covered" — the four holes and the four unverifiable criteria, stated
  apart.
- **Underneath**:

```sh
npx vitest run tests/domain/certificate.test.ts -t '§24.14'   # 1 vert (fichier : 4)
```

- **State**: the certificate *content* is real; writing it into Confluence is
  not wired (`publishCertificate` → `null`, §21 fallback), and the action says
  so instead of publishing an empty page.

**Shooting rule for the four stills**: one data source — the seeded
demonstration project of §26, passed through the real engine. Never a hand-typed
figure, never a hand-drawn screen. The site is online, the engine runs in the
browser, and the app is installed: everything on the list is a screen recording
away.

## 3. Recording notes

- English narration, no music bed under the speech, no emoji anywhere.
- The numbers spoken are the measured ones of §1: 6 tickets, 24 criteria
  written, **18 verifiable**, 4 unverifiable, **13 of 18** covered declared,
  **1** provisional, **11 of 18** proven, **4** holes, **3** perforations,
  **2** loose threads. Each one is said with its denominator.
- The coverage *percentage* is computed live by the engine and never hard-coded:
  capture it from the site and speak it **with its denominator** — "72 per cent
  of the 18 verifiable criteria" — never as a bare number.
- Numbers are dated: "computed on **13 November 2026**".
- The words **covered**, **covered strongly**, **covered up to date** and
  **proven** are never used interchangeably; the captions use the same words as
  the narration.
- Two honest captions are mandatory: *"the eleven screens answer data; the Jira
  page still shows their registry — the drawing is on the public site"* and
  *"the certificate is exported by hand: the Confluence write is a declared
  fallback (§21)"*.
- Total length 4:45; the two shots that may be cut are 3:50–4:15 (sibling app)
  and 4:15–4:45 (architecture).