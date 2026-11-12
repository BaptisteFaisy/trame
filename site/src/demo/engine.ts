/**
 * Le moteur de la démo : le VRAI moteur de l'app, appelé sur le projet semé.
 *
 * Aucune valeur n'est écrite ici : ce module ne fait qu'orchestrer
 * `src/domain/*` (couverture, perforations, fils détendus, métré, bulletin) et
 * `src/sample/demo-project.ts` (les données semées). Si le moteur change, la
 * page change ; si les données changent, la page change aussi.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { buildBulletin } from '../../../src/domain/bulletin.js';
import { computeCoverage } from '../../../src/domain/coverage.js';
import { detectDangling } from '../../../src/domain/dangling.js';
import { findHoles } from '../../../src/domain/holes.js';
import { detectPerforations, isMesh } from '../../../src/domain/perforations.js';
import { buildDemoProject, DEMO_NOW } from '../../../src/sample/demo-project.js';
import type { DemoProject } from '../../../src/sample/demo-project.js';
import type {
  Bulletin,
  Coverage,
  Criterion,
  Dangling,
  Hole,
  Link,
  LinkKind,
  LinkPath,
  Perforation,
  ScopeType,
  Strength,
  Verification,
  VerificationForm,
} from '../../../src/types.js';

/** Le périmètre de la démo : projet, sprint, version ou ticket. */
export type ScopeKind = 'project' | 'sprint' | 'version' | 'ticket';

export interface DemoState {
  project: DemoProject;
  now: string;
  perforations: Perforation[];
  dangling: Dangling[];
  holes: Hole[];
  coverage: Coverage;
  bulletin: Bulletin;
}

/** Une ligne du certificat : un critère, un acte, une force, une date. */
export interface CertificateLine {
  ticketKey: string;
  criterionKey: string;
  form: VerificationForm;
  strength: Strength;
  executedAt: string;
  linkPath: LinkPath;
  linkKind: LinkKind;
  confidence: number;
}

/** Le certificat de trame, assemblé à partir des sorties du moteur. */
export interface CertificateView {
  issuedAt: string;
  scope: string;
  coverage: Coverage;
  lines: CertificateLine[];
  notCovered: Criterion[];
  unfalsifiable: Criterion[];
  perforations: Perforation[];
  dangling: Dangling[];
}

/** Un lien, avec l'acte qu'il désigne et le fait qu'il tienne encore. */
export interface LinkView {
  link: Link;
  verification: Verification | null;
  /** Le moteur confirme que la maille tient encore. */
  holds: boolean;
}

/** La fiche d'un critère : ses liens, ses actes, son état. */
export interface CriterionSheet {
  criterion: Criterion;
  links: LinkView[];
  hole: Hole | null;
  perforation: Perforation | null;
  state: 'hole' | 'perforated' | 'covered' | 'unfalsifiable' | 'deleted';
  /** Un trou qu'aucun acte n'a jamais couvert, ou un trou dont l'acte est mort. */
  cause: 'never' | 'lost';
}

/** Un périmètre calculé : le projet entier, ou un ticket du projet. */
export interface ScopeView {
  key: string;
  label: string;
  kind: ScopeKind;
  coverage: Coverage;
  perforations: Perforation[];
  dangling: Dangling[];
  holes: Hole[];
  bulletin: Bulletin;
  criteria: Criterion[];
  certificate: CertificateView;
  /** Pour chaque trou : jamais vérifié, ou sa vérification est morte. */
  holeCauses: Record<string, 'never' | 'lost'>;
}

/* ------------------------------------------------------------------ filtres */

interface ScopeData {
  criteria: Criterion[];
  links: Link[];
  verifications: Verification[];
}

function scopeData(project: DemoProject, ticketKey?: string): ScopeData {
  const criteria = ticketKey
    ? project.criteria.filter((criterion) => criterion.ticketKey === ticketKey)
    : project.criteria;
  const ids = new Set(criteria.map((criterion) => criterion.id));
  const links = project.links.filter((link) => ids.has(link.criterionId));
  const verifications = ticketKey
    ? project.verifications.filter((act) => act.ticketKey === ticketKey)
    : project.verifications;
  return { criteria, links, verifications };
}

/* ------------------------------------------------------------------- calcul */

function computeScope(
  project: DemoProject,
  ticketKey: string | undefined,
  now: string,
): {
  coverage: Coverage;
  perforations: Perforation[];
  dangling: Dangling[];
  holes: Hole[];
  bulletin: Bulletin;
  data: ScopeData;
} {
  const data = scopeData(project, ticketKey);
  const scope = ticketKey ?? 'TRAME';
  const scopeType: ScopeType = ticketKey ? 'ticket' : 'project';
  const judged = judgeScope(data, scope, scopeType, project, now);
  const bulletin = buildBulletin({
    scope,
    scopeType,
    computedAt: now,
    coverage: judged.coverage,
    perforations: judged.perforations.length,
    dangling: judged.dangling.length,
    holes: judged.holes,
  });
  return { ...judged, bulletin, data };
}

/** Les quatre jugements du moteur, sur un périmètre donné. */
function judgeScope(
  data: ScopeData,
  scope: string,
  scopeType: ScopeType,
  project: DemoProject,
  now: string,
): {
  coverage: Coverage;
  perforations: Perforation[];
  dangling: Dangling[];
  holes: Hole[];
} {
  const perforations = detectPerforations({
    criteria: data.criteria,
    versions: [],
    links: data.links,
    verifications: data.verifications,
    now,
  });
  const dangling = detectDangling({
    verifications: data.verifications,
    links: data.links,
    criteria: data.criteria,
    now,
  });
  const coverage = computeCoverage({
    criteria: data.criteria,
    verifications: data.verifications,
    links: data.links,
    perforations,
    dangling,
    scope,
    scopeType,
    computedAt: now,
  });
  // Le projet semé n'a pas d'historique d'incident : la récurrence vaut zéro,
  // et le métré se lit sur le type de critère et le risque observé de la zone.
  const holes = findHoles({
    criteria: data.criteria,
    links: data.links,
    verifications: data.verifications,
    dangling,
    zoneRisks: project.zones,
    recurrenceByCriterion: {},
    scope,
  });
  return { coverage, perforations, dangling, holes };
}

/* ------------------------------------------------------------------ l'état */

/** L'état de la démo : le projet semé, passé dans le moteur. */
export function buildDemoState(): DemoState {
  const project = buildDemoProject();
  const now = DEMO_NOW;
  const computed = computeScope(project, undefined, now);
  return {
    project,
    now,
    perforations: computed.perforations,
    dangling: computed.dangling,
    holes: computed.holes,
    coverage: computed.coverage,
    bulletin: computed.bulletin,
  };
}

/** Le périmètre affiché : le projet entier, ou un ticket. */
export function buildScopeView(state: DemoState, ticketKey?: string): ScopeView {
  const computed = computeScope(state.project, ticketKey, state.now);
  const kind: ScopeKind = ticketKey ? 'ticket' : 'project';
  return {
    key: ticketKey ?? state.project.issues[0]?.id ?? 'TRAME',
    label: ticketKey ?? 'TRAME',
    kind,
    coverage: computed.coverage,
    perforations: computed.perforations,
    dangling: computed.dangling,
    holes: computed.holes,
    bulletin: computed.bulletin,
    criteria: computed.data.criteria,
    certificate: buildCertificate(state, computed),
    holeCauses: holeCauses(state, computed.holes),
  };
}

/**
 * La cause d'un trou : un critère qu'aucune maille n'a jamais couvert, ou un
 * critère dont la maille est morte (son test a été désactivé, par exemple).
 *
 * On demande au domaine ce qu'est une maille (`isMesh`) : une liaison dérivée
 * sous le seuil est une proposition, pas une maille — elle n'a jamais rien
 * couvert, donc le trou est « jamais vérifié ».
 */
function holeCauses(
  state: DemoState,
  holes: readonly Hole[],
): Record<string, 'never' | 'lost'> {
  const causes: Record<string, 'never' | 'lost'> = {};
  for (const hole of holes) {
    const ever = state.project.links.some(
      (link) =>
        link.criterionId === hole.criterionId &&
        isMesh(link) &&
        link.rejectedAt === undefined,
    );
    causes[hole.id] = ever ? 'lost' : 'never';
  }
  return causes;
}

/* ------------------------------------------------------------- les mailles */

/**
 * Le moteur décide : ce lien tient-il encore une maille ?
 *
 * On ne réécrit pas la règle du domaine : on demande à `computeCoverage` de
 * juger la paire, avec les fils détendus déjà détectés par le moteur.
 */
export function holdsMesh(state: DemoState, link: Link): boolean {
  const criterion = state.project.criteria.find((one) => one.id === link.criterionId);
  const verification = state.project.verifications.find((one) => one.id === link.verificationId);
  if (!criterion || !verification) return false;
  const coverage = computeCoverage({
    criteria: [criterion],
    verifications: [verification],
    links: [link],
    dangling: state.dangling,
    scope: state.coverage.scope,
    scopeType: state.coverage.scopeType,
    computedAt: state.now,
  });
  return coverage.coveredDeclared + coverage.coveredProvisional > 0;
}

/* -------------------------------------------------------------- le bulletin */

function certificateLines(
  state: DemoState,
  links: readonly Link[],
): CertificateLine[] {
  const lines: CertificateLine[] = [];
  for (const link of links) {
    if (!holdsMesh(state, link)) continue;
    const criterion = state.project.criteria.find((one) => one.id === link.criterionId);
    const verification = state.project.verifications.find((one) => one.id === link.verificationId);
    if (!criterion || !verification) continue;
    lines.push({
      ticketKey: criterion.ticketKey,
      criterionKey: criterion.criterionKey,
      form: verification.form,
      strength: verification.strength,
      executedAt: verification.executedAt,
      linkPath: link.path,
      linkKind: link.kind,
      confidence: link.confidence,
    });
  }
  return lines;
}

/** Le certificat : ce qui est vérifié, et explicitement ce qui ne l'est pas. */
function buildCertificate(
  state: DemoState,
  computed: ReturnType<typeof computeScope>,
): CertificateView {
  const holeIds = new Set(computed.holes.map((hole) => hole.criterionId));
  const notCovered = computed.data.criteria.filter(
    (criterion) => holeIds.has(criterion.id) && !criterion.deletedAt,
  );
  const unfalsifiable = computed.data.criteria.filter(
    (criterion) => !criterion.falsifiable && !criterion.deletedAt,
  );
  return {
    issuedAt: state.now,
    scope: computed.coverage.scope,
    coverage: computed.coverage,
    lines: certificateLines(state, computed.data.links),
    notCovered,
    unfalsifiable,
    perforations: computed.perforations,
    dangling: computed.dangling,
  };
}

/* ----------------------------------------------------------- la fiche critère */

/** La fiche d'un critère : ses liens, son état, son calcul de priorité. */
export function buildCriterionSheet(state: DemoState, criterionId: string): CriterionSheet | null {
  const criterion = state.project.criteria.find((one) => one.id === criterionId);
  if (!criterion) return null;
  const links = state.project.links
    .filter((link) => link.criterionId === criterionId)
    .map((link) => ({
      link,
      verification: state.project.verifications.find((one) => one.id === link.verificationId) ?? null,
      holds: holdsMesh(state, link),
    }));
  const hole = state.holes.find((one) => one.criterionId === criterionId) ?? null;
  const perforation =
    state.perforations.find((one) => one.criterionId === criterionId) ?? null;
  return {
    criterion,
    links,
    hole,
    perforation,
    state: stateOf(criterion, hole, perforation),
    cause: links.length === 0 ? 'never' : 'lost',
  };
}

/** L'état d'un critère, du plus grave au plus rassurant. */
function stateOf(
  criterion: Criterion,
  hole: Hole | null,
  perforation: Perforation | null,
): CriterionSheet['state'] {
  if (criterion.deletedAt) return 'deleted';
  if (!criterion.falsifiable) return 'unfalsifiable';
  if (hole) return 'hole';
  if (perforation) return 'perforated';
  return 'covered';
}
