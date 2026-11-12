# VIDEO SCRIPT — Trame (Codegeist 2026)

> **Trame — the coverage of your acceptance criteria** · *the thread that is missing* (*le fil qui manque*)
> Target length: **4:45**. Language: **English** (the submission is in English);
> French cues are kept in parentheses after each line.
> Spec source: `docs/CAHIER-DES-CHARGES.md` §25 (the shot list), §26 (how the
> judges will test), §12 (the deliverables the shots must show).
> Script written on branch `lot/l12-docs`, base `origin/main` @ `8f2acb8`.

## 0. Status of this script — read before shooting

This is the **shooting plan**, written against the specification, not a
description of a film that already exists. As of 12 November 2026:

- the eleven screens of §17 (`src/handlers/*.ts`) answer `{ notImplemented: … }`
  and `src/ui/frontend/index.tsx` renders a registry of stubs: **no screen can
  be filmed yet**;
- the Teamwork Graph connector is not wired (`src/ingest/graph.ts` returns `[]`
  and its probe honestly answers `no-right`): **no live graph can be filmed
  yet**;
- the public demo site does not exist (`package.json` declares `site:build` and
  `site:dev`, but the `site/` directory does not): **no demo site can be
  filmed yet**;
- what *is* real today and can be filmed as a fallback: the manifest, the
  fourteen MCP tools and their registry, the Rovo agent prompt, the eleven
  screen keys with their stub status (`src/ui/frontend/index.tsx`), and the
  two domain engines under review (`origin/lot/l4-couverture`,
  `origin/lot/l5-perforations`).

Each shot below therefore carries two lines: **what the viewer sees when the
feature lands**, and **what can be filmed today**. Nothing here promises a
feature the repository does not contain.

## 1. The run of shots

### 0:00 – 0:25 — The release that lied

- **On screen**: a Jira sprint board, tickets closed, a green pipeline, the
  line "All acceptance criteria are covered" typed in a chat. Then the Trame
  bulletin slides in over it: the same scope, dated, with the real figure.
- **Spoken**: "On the third of November, this team closed a release. Six
  tickets, green pipeline, and the message was: *all acceptance criteria are
  covered*. *(tous les critères d'acceptation sont couverts)* Trame reads the
  same release. Thirty-one per cent of the criteria were not covered — and
  nobody could have said so, because the information did not exist."
- **Cut**: hard cut on the number; no transition, the number replaces the
  claim on the same frame.

### 0:25 – 1:00 — The weave map

- **On screen**: the weave map (*carte de trame*) — warp threads = criteria,
  weft passes = acts of verification, meshes = coverage. Empty meshes show the
  background through them; the holes are sized by priority.
- **Spoken**: "Each acceptance criterion is a warp thread. Each act that
  verifies it is a weft pass. Trame weaves the two, and the holes are the
  places where the background shows through. This criterion has no
  verification at all: it is a hole. This one has a verification — but a
  declaration, a human saying *it is done*. The mesh exists. It proves
  nothing."
- **Cut**: slow pan across the map, then a push-in on the empty mesh.

### 1:00 – 1:35 — Covered on paper

- **On screen**: the criterion sheet (*fiche critère*) of `AC-2` — strength
  `declared`, no artefact, no execution, one comment.
- **Spoken**: "Covered on paper. Not proven. *(couvert sur papier, pas
  prouvé)* A criterion is *covered* when a verification act exists. It is
  *proven* only when the act is strong, the link is declared, and the
  criterion has not changed since. Trame never says *covered* alone: it says
  *covered, by a declaration, on a criterion that has been stale for forty
  days*."
- **Cut**: the badge `declared` is highlighted; cut to the empty artefact slot.

### 1:35 – 2:10 — The perforation (the judgement nobody makes)

- **On screen**: the perforation registry (*registre des perforations*):
  one criterion, two dates — "criterion edited Tuesday", "test run on 3 March"
  — and the class: `dry`.
- **Spoken**: "Here is the judgement nobody makes. This criterion was edited
  on Tuesday. Its test ran on the third of March. The link is still there, the
  mesh is still drawn — but it does not hold any more: the test verified an
  older version of the criterion. Trame calls it a perforation. Fresh, dry, or
  multiple, depending on the age and the number of edits."
- **Cut**: the two dates side by side, then the mesh drawn in a broken stroke.

### 2:10 – 2:40 — The dangling threads (coverage goes down)

- **On screen**: the dangling queue (*file des fils détendus*): a disabled
  test, a renamed test, a deleted criterion — each with its reason and its
  impact, and the coverage figure dropping as the items are opened.
- **Spoken**: "And the opposite: verification acts that no longer cover
  anything. A test was disabled. A criterion was deleted. A test was renamed
  and no link points to its new name. These threads still give comfort — and
  they are counted. Trame removes them from the figure. The coverage goes
  *down*. A coverage number that can only go up is a comfort, not a measure."
- **Cut**: the percentage animates downward while the queue opens.

### 2:40 – 3:05 — The métré (which hole comes first)

- **On screen**: the hole explorer, ranked. The first hole is not the most
  numerous: its zone already produced three defects. The score terms are
  displayed: kind, zone risk, recurrence.
- **Spoken**: "Trame does not count holes, it ranks them. A hole in a zone
  that has already broken three times is not the same hole as a hole in a
  zone that has never broken. The score is shown, term by term: criterion
  kind, observed zone risk, recurrence of past defects. The weights are the
  team's choice, and the team can change them."
- **Cut**: the terms expand under the ranked hole.

### 3:05 – 3:25 — The agent Rovo

- **On screen**: Rovo Chat, the agent **Le fil** (*the thread*). The question
  is typed and the answer appears with figures, counts and the criterion
  quoted.
- **Spoken**: "The same measure, asked in words. *Which criteria of this
  release are covered only by a declaration?* *(quels critères de la version
  ne sont couverts que par une déclaration)* The agent answers with counts,
  names the criterion and its source, and refuses to conclude when the sample
  is too small. It never attests in a human's place, and it never ranks a
  person."
- **Cut**: the typed question, then the answer appearing word by word.

### 3:25 – 3:50 — The weave certificate

- **On screen**: the Confluence page of the weave certificate (*certificat de
  trame*): scope, date, coverage by strength and link kind, the list of acts
  with their type, date, actor and strength — and, in its own section, an
  explicit statement of what is **not** covered.
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
  declared — and the Done gate knows what it is asking for."
- **Cut**: split screen, no camera move.
- **Honest note**: this shot needs the sibling app `preuve-a-l-appui`
  (§13). Nothing in this repository implements that integration; if the
  sibling app is not ready on the day, cut this slot and extend the
  certificate shot instead.

### 4:15 – 4:45 — Architecture

- **On screen**: a diagram — the Teamwork Graph objects `test-*`
  (`test-plan`, `test-run`, `test-execution`, `test-status`), the four link
  paths, the fingerprint cache, Forge SQL.
- **Spoken**: "How it is built. The Atlassian graph gives the executions, the
  plans and their dates — but no direct link between a criterion and a test.
  Trame rebuilds it in four paths: an explicit mention, a naming convention,
  a similarity proposal — never counted as coverage — and a human
  declaration. The first two are deterministic. Similarity is proposed with a
  confidence and it expires. Every criterion is fingerprinted, so a change
  only recomputes what changed. And the measures are stored in Forge SQL."
- **Cut**: hold on the diagram, end card with the repository URL.

## 2. The four captures to shoot

Four still images, each with the module that produces it, the exact command,
and the state of that module today.

### Capture 1 — the weave map

- **Module**: `jira:globalPage`, key `trame-page` (manifest.yml), resolver key
  `weave-map` (`src/handlers/weave-map.ts`).
- **Command**:

```bash
npm ci
forge deploy                    # the site is not deployed yet
forge install                   # installs the global page on the dev site
```

  then open the *Trame* global page in the browser. On the public demo site
  (lot L11), the command is `npm run site:dev` and the URL is the local one
  printed by Vite.
- **State**: the screen is a stub — `{ notImplemented: 'weave-map' }`.
- **Caveat**: `forge deploy` and `forge install` act on the **development**
  site of the Atlassian tenant configured in `manifest.yml`; the app id there
  is still provisional, so this capture needs a real tenant before the
  shooting day.

### Capture 2 — the perforation

- **Module**: same global page, resolver key `perforations`
  (`src/handlers/perforations.ts`); the same data is exposed by the MCP tool
  `list-perforations`.
- **Command**: the same `forge deploy` / `forge install`, then the
  *Perforations* panel of the Trame page. To produce the same figure from the
  command line once the tool has a body:

```bash
forge execute --file payload.json   # payload.json: {"action":"list-perforations","scope":"TRAME-1"}
```

  The exact shape of the payload file depends on the Forge CLI version: check
  `forge execute --help` before the shooting day rather than on the day.

- **State**: the screen is a stub; the MCP tool answers
  `{ notImplemented: 'list-perforations' }`.

### Capture 3 — the bulletin

- **Module**: `jira:dashboardGadget`, key `bulletin-gadget` (manifest.yml),
  resolver key `bulletin`; the same bulletin is available as the Confluence
  macro `bulletin-macro` and as the MCP tool `get-bulletin`.
- **Command**:

```bash
forge deploy
forge install
# then, in Jira: Dashboard ▸ Add gadget ▸ "Weave bulletin"
```

- **State**: the screen is a stub. The bulletin algorithm itself exists and is
  tested on the branch `origin/lot/l4-couverture`
  (`tests/domain/bulletin.test.ts`, four tests green under the filter
  `-t '§24.13'`).

### Capture 4 — the certificate

- **Module**: `confluence:globalPage`, key `certificates-page` (manifest.yml),
  resolver key `certificate`; produced by the internal action
  `publish-certificate` (`src/actions/publish-certificate.ts`).
- **Command**:

```bash
forge deploy
forge install
# the page is created from the app: action publish-certificate {"scope":"TRAME-1"}
```

- **State**: the screen and the action are stubs
  (`{ notImplemented: 'publish-certificate' }`).

**Shooting note**: the four captures and the eleven screens share one data
source — the seeded demonstration project (§26). Until that project is seeded
(lot L11), the captures must be made on the `TRAME-1` scenario of
`tests/helpers/scenario.ts`, which is real but holds one ticket, four
criteria, four acts and six links.

## 3. Recording notes

- English narration, no music bed under the speech, no emoji anywhere.
- Every number spoken in this script is a placeholder taken from the
  specification (§25) or from the demo scenario: replace them with the real
  figures of the seeded project (§26) once it exists, and keep the
  denominator in the spoken line.
- Numbers are always spoken with their denominator and their date: "87 per
  cent of 24 criteria, computed on 12 November, of which 40 per cent by
  declaration only".
- The words **covered**, **covered strongly**, **covered up to date** and
  **proven** are never used interchangeably; the captions use the same words
  as the narration.
- Total length 4:45; the two shots that may be cut are 3:50–4:15 (sibling
  app) and 4:15–4:45 (architecture).
