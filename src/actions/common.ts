/**
 * Le socle commun des actions et des outils MCP (§16, §22).
 *
 * Tous les outils de lecture passent par ici, et il n'y a qu'une implémentation
 * de chaque chose (§1 de docs/CONTRACTS.md : zéro duplication) :
 *
 *  - **le périmètre** : un outil ne lit jamais hors du périmètre demandé, et
 *    son périmètre est daté (`scope`, `scopeType`, `computedAt`) ;
 *  - **les effectifs** : la trame est mesurée en effectifs ; les pourcentages
 *    naissent ici, au moment de l'affichage, et voyagent avec leur dénominateur
 *    (`src/domain/percent.ts`) ;
 *  - **le refus de conclure** : sous l'effectif minimal, l'app dit « pas assez
 *    de recul » au lieu d’annoncer un pourcentage ; un périmètre sans aucun critère
 *    écrit n'est pas « 0 % » (§23, §24.16) ;
 *  - **les angles morts** : ce que l'app n'a pas pu voir (`no-right`) est
 *    reporté tel quel, jamais converti en trou du projet (§22, §24.15) ;
 *  - **l'interdiction de filtrer par personne** : aucun outil n'accepte un nom
 *    de personne (§16, §24.19).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type {
  BlindSpot,
  Coverage,
  Criterion,
  CriterionVersion,
  Dangling,
  Link,
  MetricRule,
  Perforation,
  PercentWithCount,
  ScopeRef,
  ScopeType,
  Verification,
  ZoneRisk,
} from '../types.js';
import { computeCoverage } from '../domain/coverage.js';
import { detectDangling } from '../domain/dangling.js';
import { detectPerforations } from '../domain/perforations.js';
import { conclusion, hasNoCriterion, percent } from '../domain/percent.js';
import type { Conclusion } from '../domain/percent.js';
import { t } from '../i18n/index.js';
import type { MessageKey } from '../i18n/index.js';

/* ------------------------------------------------------------- le périmètre */

/** Les quatre périmètres que Trame sait juger (§4, §8.1). */
export const SCOPE_TYPES: readonly ScopeType[] = ['ticket', 'sprint', 'project', 'version'];

/** Ce que l'appelant a demandé : un périmètre, jamais un nom de personne. */
export interface ScopeRequest {
  scope: string;
  scopeType: ScopeType;
}

/** Un refus explicite : l'app dit ce qu'il lui manque, elle ne devine pas. */
export interface Refusal {
  error: string;
  detail: string;
}

/** La lecture du périmètre : réussie, ou refusée avec sa raison. */
export type ScopeRead =
  | { ok: true; request: ScopeRequest }
  | { ok: false; refusal: Refusal };

/** Un refus, sans périmètre. */
export function refusal(error: string, detail: string): Refusal {
  return { error, detail };
}

/** Le type de périmètre, ou `null` s'il n'en existe pas. */
export function readScopeType(value: unknown): ScopeType | null {
  if (typeof value !== 'string') return null;
  const found = SCOPE_TYPES.find((type) => type === value);
  return found ?? null;
}

/**
 * Le périmètre demandé. Sans périmètre, l'outil refuse : il ne devine pas
 * « tout le projet » à la place de l'appelant.
 */
export function readScope(payload: Record<string, unknown>): ScopeRead {
  const scope = readText(payload.scope);
  if (!scope) {
    return {
      ok: false,
      refusal: refusal('scope manquant', 'le périmètre est obligatoire (ticket, sprint, projet ou version)'),
    };
  }
  const scopeType = readScopeType(payload.scopeType) ?? 'project';
  return { ok: true, request: { scope, scopeType } };
}

/** La référence de périmètre, celle que le store comprend. */
export function scopeRefOf(request: ScopeRequest): ScopeRef {
  return { scopeType: request.scopeType, scope: request.scope };
}

/** Un texte lu dans la charge utile, nettoyé. */
export function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Un entier lu dans la charge utile, borné. */
export function readLimit(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

/* ------------------------------------------------- l'interdiction §24.19 */

/** Les clés qui filtrent une personne : un outil n'en accepte aucune. */
const PERSON_FILTERS = [
  'author',
  'authorref',
  'user',
  'username',
  'accountid',
  'person',
  'people',
  'displayname',
  'assignedto',
  'reporter',
  'actor',
  'owner',
];

/**
 * Un outil n'accepte jamais un filtre par personne (§16) : ni nom, ni
 * identifiant de compte, ni « auteur ».
 */
export function readPersonFilter(payload: Record<string, unknown>): Refusal | null {
  for (const key of Object.keys(payload)) {
    if (PERSON_FILTERS.includes(key.toLowerCase())) {
      return refusal(
        'filtre par personne refusé',
        `« ${key} » n'est pas un filtre accepté : Trame ne classe jamais les personnes (§16, §24.19)`,
      );
    }
  }
  return null;
}

/* ---------------------------------------------------------- les données */

/** Tout ce qu'un outil de lecture lit dans le store, pour un périmètre. */
export interface ScopeData {
  request: ScopeRequest;
  criteria: Criterion[];
  verifications: Verification[];
  links: Link[];
  versions: CriterionVersion[];
  /** Les perforations, recalculées par le moteur (§8.2). */
  perforations: Perforation[];
  /** Les fils détendus, recalculés par le moteur (§8.3). */
  dangling: Dangling[];
  zoneRisks: ZoneRisk[];
  /** Les poids choisis par l'équipe, s'ils en a (§11). */
  rule: MetricRule | null;
}

/** Les liaisons d'un périmètre : critère par critère, dédoublonnées. */
async function linksOf(deps: Deps, criteria: readonly Criterion[]): Promise<Link[]> {
  const found = new Map<string, Link>();
  for (const criterion of criteria) {
    for (const link of await deps.store.listLinks(criterion.id)) {
      found.set(link.id, link);
    }
  }
  return [...found.values()];
}

/** Les versions d'un périmètre : l'historique que les perforations lisent. */
async function versionsOf(deps: Deps, criteria: readonly Criterion[]): Promise<CriterionVersion[]> {
  const found: CriterionVersion[] = [];
  for (const criterion of criteria) {
    found.push(...(await deps.store.listVersions(criterion.id)));
  }
  return found;
}

/**
 * Lit un périmètre : les critères, les actes, les liaisons, et les troubles
 * recalculés par le moteur (perforations, fils détendus) — l'app ne lit pas
 * un chiffre périmé quand elle peut le recalculer (§8.2, §8.3).
 */
export async function loadScope(deps: Deps, request: ScopeRequest): Promise<ScopeData> {
  const ref = scopeRefOf(request);
  const criteria = await deps.store.listCriteria(ref);
  const verifications = await deps.store.listVerifications(ref);
  const links = await linksOf(deps, criteria);
  const versions = await versionsOf(deps, criteria);
  const now = deps.clock.now();
  const perforations = detectPerforations({ criteria, versions, links, verifications, now });
  const dangling = detectDangling({ verifications, links, criteria, now });
  const zoneRisks = await deps.store.listZoneRisks(request.scope);
  const rule = await deps.store.getMetricRule(request.scope);
  return { request, criteria, verifications, links, versions, perforations, dangling, zoneRisks, rule };
}

/* ------------------------------------------------------- les angles morts */

/** Le type d'objet sondé : les actes de vérification du graphe (§10, §24.15). */
const PROBED_OBJECT_TYPE = 'test-execution';

/**
 * Ce que l'app n'a pas pu voir.
 *
 * Seule une sonde **illisible** est un angle mort : le droit manque, Trame n'a
 * pas regardé (§22). Une source lisible et vide est une absence du projet
 * (`no-data`), pas un angle mort de l'app — les deux ne sont jamais confondus.
 */
export async function blindSpotsOf(deps: Deps): Promise<BlindSpot[]> {
  try {
    const probe = await deps.graph.probe(PROBED_OBJECT_TYPE);
    if (probe.readable) return [];
    return [
      {
        absence: probe.absence,
        objectType: probe.objectType,
        detail: probe.detail,
      },
    ];
  } catch (error) {
    return [
      {
        absence: 'no-right',
        objectType: PROBED_OBJECT_TYPE,
        detail: `sonde de visibilité impossible : ${String(error)}`,
      },
    ];
  }
}

/* ------------------------------------------------------------ la trame */

/** La trame du périmètre, recalculée et datée, angles morts compris. */
export async function coverageOf(deps: Deps, data: ScopeData): Promise<Coverage> {
  return computeCoverage({
    criteria: data.criteria,
    verifications: data.verifications,
    links: data.links,
    perforations: data.perforations,
    dangling: data.dangling,
    blindSpots: await blindSpotsOf(deps),
    scope: data.request.scope,
    scopeType: data.request.scopeType,
    computedAt: deps.clock.now(),
  });
}

/* ------------------------------------------------------- les pourcentages */

/** Les figures d'une trame : des pourcentages qui toujours portent leur effectif. */
export interface CoverageFigures {
  /** `not-enough-history` : sous l'effectif minimal, l'app refuse de conclure. */
  conclusion: Conclusion;
  /** Un périmètre sans aucun critère écrit : pas « 0 % », une autre phrase. */
  noCriterionWritten: boolean;
  /** Effectif des critères écrits, vérifiables ou non. */
  written: number;
  /** Effectif des critères vérifiables : le dénominateur de la trame. */
  verifiable: number;
  coveredDeclared?: PercentWithCount;
  coveredProvisional?: PercentWithCount;
  proven?: PercentWithCount;
  holes?: PercentWithCount;
  unfalsifiable?: PercentWithCount;
}

/**
 * Les figures d'une trame.
 *
 * Sans aucun critère écrit, il n'y a **aucun** pourcentage : le périmètre n'est
 * pas « 0 % », il n'est pas mesurable (§23, §24.16).
 */
export function figuresOf(coverage: Coverage): CoverageFigures {
  const written = coverage.criteriaTotal + coverage.unfalsifiableCount;
  const verifiable = coverage.criteriaTotal;
  const figures: CoverageFigures = {
    conclusion: conclusion(verifiable),
    noCriterionWritten: hasNoCriterion(coverage),
    written,
    verifiable,
  };
  if (figures.noCriterionWritten) return figures;
  figures.coveredDeclared = percent(coverage.coveredDeclared, verifiable);
  figures.coveredProvisional = percent(coverage.coveredProvisional, verifiable);
  figures.proven = percent(coverage.proven, verifiable);
  figures.holes = percent(coverage.holes, verifiable);
  figures.unfalsifiable = percent(coverage.unfalsifiableCount, written);
  return figures;
}

/* ------------------------------------------------------------ l'enveloppe */

/** L'enveloppe de toute réponse : le périmètre, la date, rien d'autre. */
export function envelope(
  request: ScopeRequest,
  computedAt: string,
): { scope: string; scopeType: ScopeType; computedAt: string } {
  return { scope: request.scope, scopeType: request.scopeType, computedAt };
}

/**
 * Un message du dictionnaire, en clair, dans la langue de l'app (§22).
 */
export function say(deps: Deps, key: MessageKey): string {
  return t(deps.settings.language, key);
}

/**
 * Les messages de la réponse, en clair.
 *
 * Les clés viennent du dictionnaire (français et anglais, §22) : l'agent Rovo
 * lit une phrase, pas un identifiant. Les messages disent ce que l'appelant
 * doit savoir avant de lire les chiffres : « pas assez de recul », « aucun
 * critère écrit », « rien n'est appliqué sans décision humaine ».
 */
export function messagesOf(
  deps: Deps,
  figures: CoverageFigures,
  extra: readonly MessageKey[] = [],
): string[] {
  const keys = [...extra];
  if (figures.noCriterionWritten) keys.push('msg.no-criterion-written');
  if (figures.conclusion === 'not-enough-history') keys.push('msg.not-enough-history');
  return keys.map((key) => t(deps.settings.language, key));
}

/* --------------------------------------------------------- un critère */

/** Le critère visé, avec ses liaisons et ses actes. */
export interface CriterionTarget {
  criterion: Criterion;
  ticketKey: string;
  links: Link[];
  verifications: Verification[];
}

/** La lecture d'un critère : trouvé, ou refusé avec sa raison. */
export type CriterionRead =
  | { ok: true; target: CriterionTarget }
  | { ok: false; refusal: Refusal };

/** Le critère trouvé par son identifiant, dans le ticket demandé. */
async function findById(
  deps: Deps,
  criterionId: string,
  ticketKey: string,
): Promise<Criterion | null> {
  const direct = await deps.store.getCriterion(criterionId);
  if (direct) return direct;
  const scoped = await deps.store.listCriteria({ scopeType: 'ticket', scope: ticketKey });
  return scoped.find((row) => row.criterionKey === criterionId) ?? null;
}

/**
 * Le critère demandé, avec son périmètre contrôlé : un critère d'un autre
 * ticket n'est jamais renvoyé (§16 — rien hors du périmètre demandé).
 */
export async function loadCriterion(
  deps: Deps,
  payload: Record<string, unknown>,
): Promise<CriterionRead> {
  const criterionId = readText(payload.criterionId) || readText(payload.criterionKey);
  if (!criterionId) {
    return { ok: false, refusal: refusal('critère manquant', 'criterionId (ou criterionKey) est obligatoire') };
  }
  const ticketKey = readText(payload.ticketKey);
  if (!ticketKey) {
    return { ok: false, refusal: refusal('ticket manquant', 'ticketKey est obligatoire') };
  }
  const criterion = await findById(deps, criterionId, ticketKey);
  if (!criterion) {
    return {
      ok: false,
      refusal: refusal('critère introuvable', `aucun critère « ${criterionId} » dans le ticket ${ticketKey}`),
    };
  }
  if (criterion.ticketKey !== ticketKey) {
    return {
      ok: false,
      refusal: refusal('hors périmètre', `le critère appartient au ticket ${criterion.ticketKey}`),
    };
  }
  const links = await deps.store.listLinks(criterion.id);
  const verifications: Verification[] = [];
  for (const link of links) {
    const act = await deps.store.getVerification(link.verificationId);
    if (act) verifications.push(act);
  }
  return { ok: true, target: { criterion, ticketKey, links, verifications } };
}
