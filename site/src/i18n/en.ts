/**
 * Textes du site — anglais (langue de la soumission, §22).
 *
 * `EN` est la source de vérité pour le jeu de clés : `fr.ts` est typé contre
 * lui, donc une clé manquante ou en trop est une erreur de compilation.
 *
 * Les libellés du DOMAINE (force, type de liaison, chemin de tissage, absences)
 * ne sont pas ici : ils viennent de `src/i18n`, qui est la seule table qui
 * connaît le vocabulaire du produit (§4). Ici, on ne narre que le site.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
export const EN = {
  /* ------------------------------------------------------------- navigation */
  'nav.skip': 'Skip to the content',
  'nav.problem': 'Blind spot',
  'nav.weave': 'The metaphor',
  'nav.demo': 'Live demo',
  'nav.screens': 'Screens',
  'nav.limits': 'What it does not do',
  'nav.architecture': 'Architecture',
  'nav.recipe': 'Recipe',
  'nav.language': 'Français',
  'nav.repo': 'Repository',

  /* ------------------------------------------------------------------ héros */
  'hero.eyebrow': 'Forge app for Jira · Codegeist 2026',
  'hero.title': 'Trame',
  'hero.tagline': 'The coverage of your acceptance criteria',
  'hero.slogan': 'the missing thread',
  'hero.promise':
    'An acceptance criterion is a warp thread. A test that verifies it is a weft pass. Trame weaves the two and shows what nobody sees: a criterion written, never verified.',
  'hero.cta.demo': 'See the live demo',
  'hero.cta.recipe': 'Read the recipe',
  'hero.live.label': 'On the seeded demo project — computed by the real engine, in this page:',
  'hero.live.criteria': 'criteria written',
  'hero.live.holes': 'holes',
  'hero.live.perforations': 'perforations',
  'hero.live.dangling': 'loose threads',

  /* -------------------------------------------------------------- l'angle mort */
  'problem.title': 'The blind spot',
  'problem.lead':
    'Acceptance criteria are the contract between the developer and the verifier. In practice that contract is not kept — and the part that breaks stays invisible until the incident.',
  'problem.case1.title': 'A criterion written and never verified',
  'problem.case1.body':
    'It sits on the ticket. No test mentions it, no naming convention points to it, nobody declared it. Everything looks green: the board, the sprint, the release note. Nothing says it was never checked.',
  'problem.case2.title': 'A criterion changed after its test',
  'problem.case2.body':
    'The product owner rewrites the criterion on Tuesday. The test that covered it dates from March. The link never moved, so the weave still looks full — and the contract is broken.',
  'problem.case3.title': 'A disabled test, an empty comfort',
  'problem.case3.body':
    'The test is disabled, ignored, renamed, or attached to a criterion that was deleted. It still shows up in the report, so the coverage still looks fine. The comfort is empty.',
  'problem.outcome':
    'A defect ships. Three weeks later the review discovers the criterion existed — and that nothing had ever verified it.',

  /* ------------------------------------------------------------- la métaphore */
  'weave.title': 'The metaphor',
  'weave.lead':
    'Weaving is the oldest way to hold two things together: a warp thread, vertical, does not move; a weft pass, horizontal, crosses it. Their intersection is a mesh. A mesh you can see through is a hole.',
  'weave.warp.title': 'The warp thread',
  'weave.warp.body':
    'An acceptance criterion: a stable identifier (AC-3), its text, its fingerprint.',
  'weave.weft.title': 'The weft pass',
  'weave.weft.body':
    'A verification act: an executed test, an attestation, a recorded manual case, a declaration.',
  'weave.mesh.title': 'The mesh',
  'weave.mesh.body':
    'The cell criterion × verification. Filled, it is coverage; empty, it is a hole.',
  'weave.hole.title': 'The hole',
  'weave.hole.body':
    'A criterion with no living verification act. Its size follows the priority of the métré.',
  'weave.perforation.title': 'The perforation',
  'weave.perforation.body':
    'The criterion changed after it was woven: the mesh is still there, and it no longer holds.',
  'weave.loose.title': 'The loose thread',
  'weave.loose.body':
    'A verification act that crosses nothing any more. It is removed from the coverage — the figure can go down.',
  'weave.caption':
    'Hand-drawn in the page: warp threads, a weft pass, a hole where the mesh is missing, a perforated thread, a loose thread.',

  /* ------------------------------------------------------------------ démo */
  'demo.title': 'The live demo',
  'demo.lead':
    'Everything below is computed in your browser by the engine of the app — the same modules src/domain/*. No figure is written by hand: change the seeded project and this page changes with it.',
  'demo.scope.label': 'Scope',
  'demo.source.note':
    'The seeded project is written in French and the engine works on that text; the English glosses are display only.',
  'demo.counters.title': 'The counters',
  'demo.counters.criteria': 'Criteria written',
  'demo.counters.falsifiable': 'Verifiable criteria (the denominator)',
  'demo.counters.unfalsifiable': 'Unverifiable criteria (counted apart)',
  'demo.counters.covered': 'Covered, declared',
  'demo.counters.provisional': 'Covered, provisional (derived, to confirm)',
  'demo.counters.holes': 'Holes',
  'demo.counters.proven': 'Proven (strong, current, declared)',
  'demo.counters.perforations': 'Perforations',
  'demo.counters.dangling': 'Loose threads',
  'demo.axes.title': 'The three axes, never merged',
  'demo.axes.strength': 'By strength',
  'demo.axes.link': 'By link kind',
  'demo.axes.freshness': 'By freshness',
  'demo.holes.title': 'The holes, ranked by the métré',
  'demo.holes.empty': 'No hole in this scope.',
  'demo.holes.never': 'never verified',
  'demo.holes.lost': 'lost its verification',
  'demo.holes.score': 'Priority',
  'demo.holes.calculation': 'How the score was computed',
  'demo.holes.formula': 'score = Σ(weight × value) ÷ Σ(weight)',
  'demo.term.kind': 'kind of criterion',
  'demo.term.zone': 'observed risk of the zone',
  'demo.term.recurrence': 'recurrence (it escaped before)',
  'demo.column.criterion': 'Criterion',
  'demo.column.cause': 'Why',
  'demo.column.act': 'Verification act',
  'demo.column.form': 'Form',
  'demo.column.strength': 'Strength',
  'demo.column.date': 'Date',
  'demo.column.path': 'Link path',
  'demo.holes.zone': 'Zone',
  'demo.holes.kind': 'Kind',
  'demo.perforations.title': 'The perforation registry',
  'demo.perforations.empty': 'No perforation in this scope.',
  'demo.perforations.changed': 'Criterion changed',
  'demo.perforations.verified': 'Last verification',
  'demo.perforations.gap': 'Gap',
  'demo.perforations.class': 'Class',
  'demo.dangling.title': 'The loose thread queue',
  'demo.dangling.empty': 'No loose thread in this scope.',
  'demo.dangling.reason': 'Reason',
  'demo.dangling.impact': 'Impact on the coverage',
  'demo.bulletin.title': 'The weave bulletin',
  'demo.bulletin.scope': 'Scope',
  'demo.bulletin.date': 'Computed at',
  'demo.bulletin.unfalsifiable': 'Unverifiable share',
  'demo.bulletin.added': 'Criteria added during the sprint',
  'demo.bulletin.top': 'Top holes',
  'demo.bulletin.witness': 'No previous witness for this scope yet.',
  'demo.certificate.title': 'The weave certificate',
  'demo.certificate.lead': 'What was verified — and, explicitly, what was not.',
  'demo.certificate.covered': 'Verified',
  'demo.certificate.lines': 'The verification acts that hold a mesh',
  'demo.certificate.notCovered': 'What is NOT covered',
  'demo.certificate.unfalsifiable': 'Unverifiable criteria',
  'demo.certificate.open': 'Open perforations and loose threads',
  'demo.ticket.label': 'Ticket',
  'demo.ticket.all': 'Whole project',
  'demo.criterion.label': 'Criterion',
  'demo.criterion.pick': 'Pick a criterion in the list to see its sheet.',
  'demo.criterion.links': 'Links',
  'demo.criterion.verifications': 'Verification acts',
  'demo.criterion.state': 'State',
  'demo.criterion.noLink': 'No link at all: nothing was ever woven on this criterion.',
  'demo.criterion.deadLink':
    'A link exists, but the act that held it is dead — the mesh no longer holds.',
  'demo.criterion.stale': 'The criterion changed after the verification that covered it.',
  'demo.criterion.fresh': 'The criterion has not changed since it was verified.',
  'demo.criterion.falsifiable': 'Verifiable',
  'demo.criterion.unfalsifiable': 'Unverifiable',
  'demo.criterion.holds': 'the mesh holds',
  'demo.criterion.dead': 'the mesh is dead',
  'demo.criterion.notCovered': 'not covered',

  /* ---------------------------------------------------------------- écrans */
  'screens.title': 'The eleven screens',
  'screens.lead':
    'One screen per judgement. Each illustration is drawn by hand inside the page — there is no screenshot and no external image.',
  'screens.what': 'What it shows',
  'screens.shows.weave-map':
    'The woven canvas: the criteria as vertical threads, the verification acts as horizontal passes, the holes you can see through, the size of a hole following its priority.',
  'screens.shows.criterion-detail':
    'One criterion in full: its text, its fingerprint, its versions, the acts that cover it, and whether the mesh still holds.',
  'screens.shows.holes':
    'The uncovered criteria, sorted by the métré, each one with the calculation of its priority.',
  'screens.shows.perforations':
    'The criteria changed after their verification, with the two dates and the gap.',
  'screens.shows.dangling':
    'The verification acts that no longer cover anything, with the reason and the number of meshes they withdraw.',
  'screens.shows.bulletin':
    'The sprint review sheet: coverage by strength and freshness, perforations, loose threads, unverifiable share, top holes. Dated, comparable to the previous witness.',
  'screens.shows.certificate':
    'The generated Confluence page: what was verified, by whom, with which force — and, explicitly, what is not covered.',
  'screens.shows.validation-queue':
    'The proposals waiting for a human: the derived links to confirm, the test drafts, the reformulations. Nothing is applied automatically.',
  'screens.shows.zone-risks':
    'The observed risk of the repository zones — the second entry of the métré.',
  'screens.shows.visibility':
    'What Trame could see and what it could not: no right, no data, no test, no criterion — four absences, never mixed up.',
  'screens.shows.timeline': 'The witnesses of the successive sprints, laid side by side.',

  /* ------------------------------------------------------------- discipline */
  'limits.title': 'What the app does not do',
  'limits.lead':
    'The measure does not change the work. Trame shows, proposes, and never decides in a human’s place.',
  'limits.no-block.title': 'It does not block',
  'limits.no-block.body':
    'Closing a ticket is never blocked. A non-regression gate is possible, but optional and clearly signalled.',
  'limits.no-attest.title': 'It does not attest',
  'limits.no-attest.body':
    'It never certifies in a human’s place. It records who did what, for the audit, and refuses to attribute an act to an agent.',
  'limits.no-invent.title': 'It does not invent',
  'limits.no-invent.body':
    'A link deduced by similarity stays a proposal until a human confirms it, and never counts as declared coverage.',
  'limits.no-score.title': 'It does not rate anyone',
  'limits.no-score.body':
    'No score per person, no per-team statistic. Actors appear only in the audit trail of a criterion.',
  'limits.absences.title': 'The four absences, kept apart',
  'limits.absences.lead':
    'The app’s own blind spots must never be read as the project’s. No right ≠ no test.',

  /* ----------------------------------------------------------- architecture */
  'architecture.title': 'The architecture in ten lines',
  'architecture.lead':
    'A pure domain, a single boundary, Forge SQL. The page you are reading imports the very same domain modules as the app.',
  'architecture.l1':
    'Sources: the acceptance field, the description, the criteria table, Confluence, a dedicated test ticket, an attachment reference — six places, one fingerprint.',
  'architecture.l2':
    'Acts: the Teamwork Graph objects test-execution, test-run and test-status, plus Bitbucket builds, Jira comments and the signed pipeline trigger.',
  'architecture.l3':
    'The graph of the links: one criterion, one act, one mesh — the fingerprint of the criterion is kept at the moment of the link.',
  'architecture.l4':
    'Four paths of weaving, from the surest to the most fragile: explicit mention, naming convention, semantic similarity (proposed, never counted), human declaration.',
  'architecture.l5':
    'Three judgements: coverage on three axes that are never merged, perforations, loose threads — the last ones make the coverage go down.',
  'architecture.l6':
    'The métré ranks the holes: kind of criterion, observed risk of the zone, recurrence — the score always shows its terms.',
  'architecture.l7':
    'Cache by fingerprint: a changed criterion only recomputes the links it concerns, and the hosted model is only called for similarity.',
  'architecture.l8':
    'Forge SQL: fifteen tables, the DDL in src/db/schema.ts. Texts of criteria are stored, proofs are referenced, never copied.',
  'architecture.l9':
    'The domain never imports @forge/*: everything is testable with the in-memory fakes and a frozen clock.',
  'architecture.l10':
    'One Forge app, one screen per judgement, fourteen MCP tools — and the site you are reading runs the same modules in your browser.',
  'architecture.docs': 'In the repository',
  'architecture.links': 'The four paths of weaving',

  /* ---------------------------------------------------------------- recette */
  'recipe.title': 'How to judge Trame in five minutes',
  'recipe.lead':
    'Everything is open: the engine, the seeded project, the recipe and the video. Nothing needs an account to read.',
  'recipe.step1.title': 'Read the idea in thirty seconds',
  'recipe.step1.body':
    'A criterion is a warp thread, a test is a weft pass, the intersection is a mesh — and the hole is the criterion nobody verified.',
  'recipe.step2.title': 'Run the demo above',
  'recipe.step2.body':
    'Every figure on this page is computed by the engine of the app, in your browser. Pick a ticket, pick a criterion, watch the holes and the perforations.',
  'recipe.step3.title': 'Read the recipe',
  'recipe.step3.body':
    'The twenty points of the acceptance recipe of §24, one by one: what it checks, the exact command, the test file, the real state.',
  'recipe.step4.title': 'Read the judges’ guide',
  'recipe.step4.body':
    'Trame in thirty seconds, the three judgements, what the app does not do, and the ten questions the MCP tools answer.',
  'recipe.step5.title': 'Watch the video',
  'recipe.step5.body':
    'Less than five minutes: a release that certifies everything, and the 31 % nobody checked.',
  'recipe.links': 'Links',
  'recipe.link.readme': 'README.md',
  'recipe.link.demo': 'the demo above',
  'recipe.link.recette': 'docs/RECETTE.md',
  'recipe.link.judges': 'docs/JUDGES.md',
  'recipe.link.video': 'docs/VIDEO-SCRIPT.md',

  /* ------------------------------------------------------------------ footer */
  'footer.note': 'Forge app for Codegeist 2026',
  'footer.licence': 'MIT licence',
  'footer.repo': 'Repository',
  'footer.offline':
    'Everything on this page runs offline: no font, no icon and no script comes from outside the repository.',
} as const;

export type SiteKey = keyof typeof EN;
