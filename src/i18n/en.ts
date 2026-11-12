/**
 * English dictionary (§22: the interface ships in English and French).
 *
 * This object is the source of truth for the key set: `fr.ts` is typed against
 * it, so a missing or extra key is a compile error. Keys are grouped by what
 * they label; every state is double-coded by a pattern **and** a word, never by
 * colour alone (§22 accessibility).
 */
export const EN = {
  'app.name': 'Trame',
  'app.tagline': 'The coverage of your acceptance criteria',

  'screen.weave-map': 'Weave map',
  'screen.criterion-detail': 'Criterion sheet',
  'screen.holes': 'Hole explorer',
  'screen.perforations': 'Perforation registry',
  'screen.dangling': 'Dangling thread queue',
  'screen.bulletin': 'Weave bulletin',
  'screen.certificate': 'Weave certificate',
  'screen.validation-queue': 'Validation queue',
  'screen.zone-risks': 'Risk zones',
  'screen.visibility': 'What Trame sees',
  'screen.timeline': 'Weave history',

  'axis.strength': 'By strength',
  'axis.link': 'By link kind',
  'axis.freshness': 'By freshness',

  'strength.machine': 'machine (automated run, green)',
  'strength.attested': 'attested (a third party, with an artefact)',
  'strength.declared': 'declared (an assertion, no artefact)',

  'link.declared': 'declared',
  'link.confirmed': 'confirmed (re-woven)',
  'link.derived': 'derived, to confirm',

  'freshness.current': 'up to date',
  'freshness.stale': 'out of date',

  'path.mention': 'explicit mention',
  'path.naming-convention': 'naming convention',
  'path.similarity': 'similarity (proposed)',
  'path.declaration': 'human declaration',

  'kind.functional': 'functional',
  'kind.edge-case': 'edge case',
  'kind.non-regression': 'non-regression',
  'kind.security': 'security',
  'kind.performance': 'performance',
  'kind.experience': 'experience',
  'kind.documentation': 'documentation',

  'origin.acceptance-field': 'acceptance criteria field',
  'origin.description': 'ticket description',
  'origin.table': 'criteria table',
  'origin.confluence-page': 'Confluence page',
  'origin.test-ticket': 'dedicated test ticket',
  'origin.attachment': 'attachment (referenced, not decoded)',

  'form.automated-test': 'automated test run',
  'form.manual-case': 'manual test case, executed and recorded',
  'form.third-party': 'third-party attestation',
  'form.code-review': 'code review covering the criterion',
  'form.traced-manual': 'manual verification traced in a ticket',
  'form.deployment': 'deployment proof',
  'form.declaration': 'declaration ("it is done")',

  'perforation.fresh': 'fresh perforation (changed less than 7 days ago)',
  'perforation.dry': 'dry perforation (over 30 days, never re-verified)',
  'perforation.multiple': 'multiple perforation (changed 3 times, never re-verified)',

  'dangling.test-disabled': 'test disabled or ignored',
  'dangling.test-renamed': 'test renamed, no link points to it',
  'dangling.criterion-deleted': 'criterion deleted or renumbered',
  'dangling.build-not-running': 'build no longer runs',

  'absence.no-right': 'no right: Trame could not look',
  'absence.no-data': 'no data: Trame looked, there is nothing',
  'absence.no-test': 'no test: the criterion has no verification act',
  'absence.no-criterion': 'no criterion written',

  'msg.not-enough-history': 'not enough history (sample below 5)',
  'msg.no-criterion-written': 'no acceptance criterion written — not 0%',
  'msg.covered-on-paper': 'covered on paper: declaration only, not proven',
  'msg.provisional': 'provisional coverage, never counted as declared',
  'msg.hole-priority': 'priority computed by the métré (terms shown)',
  'msg.coverage-lowered': 'coverage lowered: a verification act died',
  'msg.dated-scope': 'scoped and dated figure',
  'msg.not-applied': 'proposal: nothing is applied without a human decision',
} as const;

export type MessageKey = keyof typeof EN;
