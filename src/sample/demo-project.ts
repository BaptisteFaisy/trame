/**
 * The demonstration project of §26 — the one the judges will see.
 *
 * Six tickets, twenty-four criteria (four of them unfalsifiable), three
 * criteria modified after their verification (perforations), two criteria with
 * no verification act at all (holes), fourteen test executions, three disabled
 * tests, two deleted criteria, a `TRAME-1xx.` naming convention applied to most
 * of the tests but not all, and a series of derived links waiting to be
 * confirmed.
 *
 * Nothing here is random: every date is relative to `now`, every fingerprint is
 * explicit, so the demo project tells the same story on every machine.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type {
  Criterion,
  CriterionKind,
  CriterionOrigin,
  Link,
  ScopeRef,
  Verification,
  VerificationForm,
  ZoneRisk,
} from '../types';

export const DEMO_PROJECT = 'TRAME';

export const DEMO_SPRINT = 'Sprint 42';

export const DEMO_VERSION = '2026.11';

/** The instant the demo is frozen at. */
export const DEMO_NOW = '2026-11-12T09:00:00.000Z';

export const DEMO_TICKETS = ['TRAME-101', 'TRAME-102', 'TRAME-103', 'TRAME-104', 'TRAME-105', 'TRAME-106'];

export interface DemoIssue {
  id: string;
  key: string;
  summary: string;
  component: string;
  sprint: string;
  version: string;
}

export interface DemoProject {
  issues: DemoIssue[];
  criteria: Criterion[];
  verifications: Verification[];
  links: Link[];
  zones: ZoneRisk[];
  /** The holes the demo shows on screen, by criterion key. */
  holes: string[];
  /** The perforations the demo shows, by criterion key. */
  perforations: string[];
  /** The disabled tests the demo shows, by verification name. */
  disabled: string[];
}

/** Days before the frozen instant. */
function daysAgo(days: number, now = DEMO_NOW): string {
  const at = new Date(now);
  at.setUTCDate(at.getUTCDate() - days);
  return at.toISOString();
}

function scopesFor(ticket: string): ScopeRef[] {
  return [
    { scopeType: 'ticket', scope: ticket },
    { scopeType: 'project', scope: DEMO_PROJECT },
    { scopeType: 'sprint', scope: DEMO_SPRINT },
    { scopeType: 'version', scope: DEMO_VERSION },
  ];
}

interface CriterionSpec {
  key: string;
  text: string;
  kind?: CriterionKind;
  falsifiable?: boolean;
  reason?: string;
  /** Days since the criterion was written. */
  age?: number;
  /** Days since the criterion was last edited — after its verification. */
  editedAgo?: number;
  deleted?: boolean;
}

/** One criterion of the demo, with its fingerprint. */
function criterion(ticket: string, spec: CriterionSpec): Criterion {
  const version = spec.editedAgo === undefined ? 1 : 2;
  const hash = `h_${ticket}_${spec.key}_${version}`;
  return {
    id: `crit_${ticket}_${spec.key}`,
    issueId: `10${ticket.slice(-3)}`,
    ticketKey: ticket,
    criterionKey: spec.key,
    text: spec.text,
    textHash: hash,
    kind: spec.kind ?? 'functional',
    origin: 'acceptance-field' as CriterionOrigin,
    falsifiable: spec.falsifiable ?? true,
    unfalsifiableReason: spec.reason,
    version,
    createdAt: daysAgo(spec.age ?? 30),
    changedAt: daysAgo(spec.editedAgo ?? spec.age ?? 30),
    authorRef: `acct_${ticket.slice(-3)}`,
    deletedAt: spec.deleted ? daysAgo(1) : undefined,
    scopeRefs: scopesFor(ticket),
  };
}

interface VerificationSpec {
  name: string;
  form?: VerificationForm;
  status?: Verification['status'];
  executedAgo: number;
  disabledAgo?: number;
  zone?: string;
  mentions?: string[];
}

/** One verification act of the demo. */
function verification(ticket: string, spec: VerificationSpec): Verification {
  const form = spec.form ?? 'automated-test';
  return {
    id: `ver_${ticket}_${spec.name}`,
    form,
    sourceSystem: form === 'declaration' ? 'jira' : 'teamwork-graph',
    sourceRef: `test-execution/${ticket}/${spec.name}`,
    issueId: `10${ticket.slice(-3)}`,
    ticketKey: ticket,
    name: spec.name,
    executedAt: daysAgo(spec.executedAgo),
    status: spec.status ?? 'passed',
    strength: form === 'automated-test' ? 'machine' : form === 'declaration' ? 'declared' : 'attested',
    zone: spec.zone ?? `src/${ticket.slice(-3).toLowerCase()}`,
    disabledAt: spec.disabledAgo === undefined ? undefined : daysAgo(spec.disabledAgo),
  };
}

/** One mesh: criterion × verification. */
function link(
  ticket: string,
  criterionKey: string,
  verificationName: string,
  options: { kind?: Link['kind']; path?: Link['path']; confidence?: number; establishedAgo?: number } = {},
): Link {
  const kind = options.kind ?? 'declared';
  const path = options.path ?? 'naming-convention';
  const confidence = options.confidence ?? (kind === 'derived' ? 0.9 : 1);
  const version = path === 'naming-convention' ? 1 : 1;
  return {
    id: `link_${ticket}_${criterionKey}_${verificationName}`,
    criterionId: `crit_${ticket}_${criterionKey}`,
    verificationId: `ver_${ticket}_${verificationName}`,
    kind,
    path,
    confidence,
    criterionHashAtLink: `h_${ticket}_${criterionKey}_${version}`,
    establishedAt: daysAgo(options.establishedAgo ?? 20),
  };
}

/** The twenty-four criteria, ticket by ticket. */
const CRITERIA: Record<string, CriterionSpec[]> = {
  'TRAME-101': [
    { key: 'AC-1', text: 'le tissage classe les critères par ticket' },
    { key: 'AC-2', text: 'un jeton expiré est refusé', kind: 'security' },
    { key: 'AC-3', text: 'le tableau de bord reste rapide', kind: 'performance', falsifiable: false, reason: '« rapide » n’est pas mesurable' },
    { key: 'AC-4', text: 'la couverture déclarée ne baisse pas', kind: 'non-regression', editedAgo: 3 },
  ],
  'TRAME-102': [
    { key: 'AC-1', text: 'une perforation est signalée à l’écran', kind: 'functional' },
    { key: 'AC-2', text: 'un critère supprimé ne laisse pas de trou', kind: 'non-regression' },
    { key: 'AC-3', text: 'le rapport de trame est imprimable', kind: 'documentation' },
    { key: 'AC-4', text: 'le bulletin est daté et comparable', kind: 'functional', editedAgo: 5 },
  ],
  'TRAME-103': [
    { key: 'AC-1', text: 'les permissions d’un ticket sont respectées', kind: 'security' },
    { key: 'AC-2', text: 'une liaison dérivée n’est jamais comptée comme couverture', kind: 'non-regression' },
    { key: 'AC-3', text: 'l’interface reste agréable', kind: 'experience', falsifiable: false, reason: '« agréable » n’est pas mesurable' },
    { key: 'AC-4', text: 'le certificat déclare les manques', kind: 'functional' },
  ],
  'TRAME-104': [
    { key: 'AC-1', text: 'les fils détendus retirent leur couverture', kind: 'non-regression' },
    { key: 'AC-2', text: 'un test renommé n’est plus compté', kind: 'edge-case', editedAgo: 34 },
    { key: 'AC-3', text: 'le calcul est rejouable à l’identique', kind: 'functional' },
    { key: 'AC-4', text: 'la zone à risque est affichée', kind: 'functional' },
  ],
  'TRAME-105': [
    { key: 'AC-1', text: 'le hole explorer se trie par priorité', kind: 'functional' },
    { key: 'AC-2', text: 'la proposition de test n’est jamais appliquée', kind: 'non-regression' },
    { key: 'AC-3', text: 'le dossier de preuve est robuste', kind: 'functional', falsifiable: false, reason: '« robuste » n’est pas mesurable' },
    { key: 'AC-4', text: 'la reformulation propose une mesure', kind: 'functional' },
  ],
  'TRAME-106': [
    { key: 'AC-1', text: 'le kiosque de couverture distingue les absences', kind: 'functional' },
    { key: 'AC-2', text: 'un critère fusionné garde son historique', kind: 'edge-case', deleted: true },
    { key: 'AC-3', text: 'la convention de nommage suffit au premier jour', kind: 'functional', falsifiable: false, reason: '« suffit » n’est pas mesurable' },
    { key: 'AC-4', text: 'le critère supprimé disparaît du périmètre', kind: 'non-regression', deleted: true },
  ],
};

/** The verification acts, ticket by ticket. */
const VERIFICATIONS: Record<string, VerificationSpec[]> = {
  'TRAME-101': [
    { name: 'TRAME-101.testShouldWeaveCriteria', executedAgo: 3 },
    { name: 'TRAME-101.testShouldRejectExpiredToken', executedAgo: 3 },
    { name: 'TRAME-101.testShouldCountHoles', executedAgo: 12, disabledAgo: 1 },
    { name: 'review-101', form: 'code-review', executedAgo: 9 },
  ],
  'TRAME-102': [
    { name: 'TRAME-102.testShouldReportPerforation', executedAgo: 6 },
    { name: 'TRAME-102.testShouldForgetDeletedCriterion', form: 'manual-case', executedAgo: 6 },
    { name: 'comment-102', form: 'declaration', executedAgo: 2 },
  ],
  'TRAME-103': [
    { name: 'TRAME-103.testShouldRespectPermissions', executedAgo: 8 },
    { name: 'TRAME-103.testShouldNotCountDerivedLink', executedAgo: 8 },
    { name: 'TRAME-103.testShouldPublishCertificate', form: 'manual-case', executedAgo: 4 },
    { name: 'comment-103', form: 'declaration', executedAgo: 1 },
  ],
  'TRAME-104': [
    { name: 'TRAME-104.testShouldDropDanglingCoverage', executedAgo: 10, disabledAgo: 2 },
    { name: 'TRAME-104.testShouldComputeCoverage', executedAgo: 10 },
    { name: 'TRAME-104.testShouldBeStable', executedAgo: 40 },
    { name: 'TRAME-104.testShouldShowZones', executedAgo: 10, disabledAgo: 2 },
  ],
  'TRAME-105': [
    { name: 'TRAME-105.testShouldRankHoles', executedAgo: 7 },
    { name: 'TRAME-105.testShouldNeverApplyProposal', executedAgo: 7 },
  ],
  'TRAME-106': [
    { name: 'TRAME-106.testShouldTellAbsencesApart', executedAgo: 5 },
    { name: 'TRAME-106.testShouldUseNamingConvention', executedAgo: 5 },
  ],
};

/** Builds the whole demonstration project. */
export function buildDemoProject(now = DEMO_NOW): DemoProject {
  const issues: DemoIssue[] = DEMO_TICKETS.map((key, index) => ({
    id: `10${key.slice(-3)}`,
    key,
    summary: SUMMARY[key] ?? 'Critères de trame',
    component: `composant-${index + 1}`,
    sprint: DEMO_SPRINT,
    version: DEMO_VERSION,
  }));
  const criteria: Criterion[] = [];
  const verifications: Verification[] = [];
  for (const ticket of DEMO_TICKETS) {
    for (const spec of CRITERIA[ticket] ?? []) criteria.push(criterion(ticket, spec));
    for (const spec of VERIFICATIONS[ticket] ?? []) verifications.push(verification(ticket, spec));
  }
  const links: Link[] = [...DECLARED_LINKS, ...DERIVED_LINKS].map((entry) => link(entry.ticket, entry.criterion, entry.verification, entry.options));
  const zones: ZoneRisk[] = [
    { scope: DEMO_PROJECT, zone: 'src/104', defectCount: 3, lastDefectAt: daysAgo(12), openIncidentCount: 1, score: 0.78, computedAt: now },
    { scope: DEMO_PROJECT, zone: 'src/103', defectCount: 1, lastDefectAt: daysAgo(45), openIncidentCount: 0, score: 0.31, computedAt: now },
  ];
  return {
    issues,
    criteria,
    verifications,
    links,
    zones,
    holes: ['TRAME-101/AC-4', 'TRAME-105/AC-4'],
    perforations: ['TRAME-101/AC-4', 'TRAME-102/AC-4', 'TRAME-104/AC-2'],
    disabled: ['TRAME-101.testShouldCountHoles', 'TRAME-104.testShouldDropDanglingCoverage', 'TRAME-104.testShouldShowZones'],
  };
}

const SUMMARY: Record<string, string> = {
  'TRAME-101': 'Tissage et sécurité des jetons',
  'TRAME-102': 'Perforations et registre',
  'TRAME-103': 'Confidentialité et certificat',
  'TRAME-104': 'Fils détendus et zones à risque',
  'TRAME-105': 'Trous, propositions et reformulations',
  'TRAME-106': 'Absences et convention de nommage',
};

interface LinkSpec {
  ticket: string;
  criterion: string;
  verification: string;
  options: { kind?: Link['kind']; path?: Link['path']; confidence?: number; establishedAgo?: number };
}

/** Links written by a human or deduced by the two deterministic paths. */
const DECLARED_LINKS: LinkSpec[] = [
  { ticket: 'TRAME-101', criterion: 'AC-1', verification: 'TRAME-101.testShouldWeaveCriteria', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-101', criterion: 'AC-2', verification: 'TRAME-101.testShouldRejectExpiredToken', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-101', criterion: 'AC-4', verification: 'TRAME-101.testShouldCountHoles', options: { path: 'naming-convention', establishedAgo: 12 } },
  { ticket: 'TRAME-102', criterion: 'AC-1', verification: 'TRAME-102.testShouldReportPerforation', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-102', criterion: 'AC-2', verification: 'TRAME-102.testShouldForgetDeletedCriterion', options: { path: 'mention' } },
  { ticket: 'TRAME-102', criterion: 'AC-4', verification: 'TRAME-102.testShouldReportPerforation', options: { path: 'mention', establishedAgo: 5 } },
  { ticket: 'TRAME-103', criterion: 'AC-1', verification: 'TRAME-103.testShouldRespectPermissions', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-103', criterion: 'AC-2', verification: 'TRAME-103.testShouldNotCountDerivedLink', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-103', criterion: 'AC-4', verification: 'TRAME-103.testShouldPublishCertificate', options: { path: 'mention' } },
  { ticket: 'TRAME-104', criterion: 'AC-1', verification: 'TRAME-104.testShouldDropDanglingCoverage', options: { path: 'naming-convention', establishedAgo: 10 } },
  { ticket: 'TRAME-104', criterion: 'AC-2', verification: 'TRAME-104.testShouldBeStable', options: { path: 'naming-convention', establishedAgo: 40 } },
  { ticket: 'TRAME-104', criterion: 'AC-3', verification: 'TRAME-104.testShouldComputeCoverage', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-105', criterion: 'AC-1', verification: 'TRAME-105.testShouldRankHoles', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-105', criterion: 'AC-2', verification: 'TRAME-105.testShouldNeverApplyProposal', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-106', criterion: 'AC-1', verification: 'TRAME-106.testShouldTellAbsencesApart', options: { path: 'naming-convention' } },
  { ticket: 'TRAME-106', criterion: 'AC-3', verification: 'TRAME-106.testShouldUseNamingConvention', options: { path: 'naming-convention' } },
];

/** Links proposed by similarity: two to confirm, one too weak to matter. */
const DERIVED_LINKS: LinkSpec[] = [
  { ticket: 'TRAME-101', criterion: 'AC-3', verification: 'TRAME-101.testShouldWeaveCriteria', options: { kind: 'derived', path: 'similarity', confidence: 0.91, establishedAgo: 2 } },
  { ticket: 'TRAME-102', criterion: 'AC-3', verification: 'TRAME-102.testShouldReportPerforation', options: { kind: 'derived', path: 'similarity', confidence: 0.88, establishedAgo: 2 } },
  { ticket: 'TRAME-105', criterion: 'AC-4', verification: 'TRAME-105.testShouldRankHoles', options: { kind: 'derived', path: 'similarity', confidence: 0.62, establishedAgo: 2 } },
  { ticket: 'TRAME-103', criterion: 'AC-3', verification: 'TRAME-103.testShouldRespectPermissions', options: { kind: 'derived', path: 'similarity', confidence: 0.41, establishedAgo: 2 } },
];
