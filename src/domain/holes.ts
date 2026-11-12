/**
 * Les trous — les critères vérifiables sans maille vivante, classés (§11).
 *
 * Un trou est un **critère vérifiable** qu'aucun acte de vérification ne
 * couvre plus (§8.1) :
 *
 *  - une **liaison rejetée** ne compte pas (§9.1 : elle a été refusée) ;
 *  - un **acte désactivé** ne compte pas (§8.3 : le test ne tourne plus) ;
 *  - un **fil détendu** ne compte pas (§8.3 : il ne couvre plus rien) ;
 *  - une liaison dérivée ne compte qu'**au-dessus du seuil** : en dessous,
 *    c'est une proposition dans la file de validation, pas une maille (§9.2).
 *
 * Les critères **infalsifiables** ne sont pas des trous (§8.4) : ils ne
 * peuvent pas être couverts, donc ils ne sont ni comptés comme trou ni comme
 * couverture — l'app en fait une catégorie à part.
 *
 * Chaque trou porte son **métré** : `priorityScore` et `priorityTerms`
 * viennent de `metric.ts`, jamais d'un calcul recopié ici. Le classement est
 * donc explicable terme par terme (§22) : c'est ce qui permet d'afficher le
 * calcul de la priorité sous le trou (§24.11).
 *
 * Le module est pur : aucune horloge, aucun identifiant aléatoire — le score
 * vient des faits, l'identifiant du trou est déterministe (deux recalculs
 * donnent le même trou, il est mis à jour, jamais dupliqué).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type {
  Criterion,
  Dangling,
  Hole,
  Link,
  MetricRule,
  Verification,
  ZoneRisk,
} from '../types.js';
import { DEFAULT_SETTINGS, DERIVED_LINK_THRESHOLD } from '../defaults.js';
import { scoreHole } from './metric.js';
import { findZoneRisk } from './zones.js';

/* ------------------------------------------------------------------ entrée */

/** Tout ce qu'il faut pour trouver et classer les trous — et rien de plus. */
export interface HoleInput {
  /** Les critères du périmètre (les infalsifiables seront écartés). */
  criteria: readonly Criterion[];
  /** Les liaisons, rejetées comprises : une liaison rejetée ne couvre pas. */
  links: readonly Link[];
  /** Les actes de vérification, désactivés compris. */
  verifications: readonly Verification[];
  /** Les fils détendus : un fil ouvert ne couvre plus rien (§8.3). */
  dangling: readonly Dangling[];
  /** Les zones à risque déjà mesurées (`zones.ts`). */
  zoneRisks: readonly ZoneRisk[];
  /** Nombre d'échappements passés, par critère (§11). */
  recurrenceByCriterion: Record<string, number>;
  /** Les poids de l'équipe ; à défaut, ceux du socle (§11). */
  rule?: MetricRule;
  /** Le périmètre du classement. */
  scope: string;
}

/* ---------------------------------------------------------------- interne */

/** Ce qu'il faut savoir une fois pour tout le périmètre. */
interface HoleContext {
  /** Les identifiants des critères couverts par une maille vivante. */
  covered: ReadonlySet<string>;
  /** Les liaisons, pour retrouver la zone du dépôt d'un critère. */
  links: readonly Link[];
  /** Les actes par identifiant. */
  verificationById: ReadonlyMap<string, Verification>;
  /** Les poids de l'équipe, ou ceux du socle. */
  weights: MetricRule['weights'];
  /** Les zones à risque déjà mesurées. */
  zoneRisks: readonly ZoneRisk[];
  /** Le nombre d'échappements passés, par critère (§11). */
  recurrenceByCriterion: Record<string, number>;
}

/* ------------------------------------------------------------------ calcul */

/**
 * Trouve les trous du périmètre et les classe par priorité décroissante
 * (§11, §12.1 : la taille d'un trou suit sa priorité).
 */
export function findHoles(input: HoleInput): Hole[] {
  const context = contextOf(input);
  const holes: Hole[] = [];
  for (const criterion of input.criteria) {
    if (!isHoleCandidate(criterion, context)) continue;
    holes.push(holeOf(criterion, input.scope, context));
  }
  return holes.sort(byPriority);
}

/** Le contexte de décision, calculé une fois pour tout le périmètre. */
function contextOf(input: HoleInput): HoleContext {
  return {
    covered: coveredCriterionIds(input),
    links: input.links,
    verificationById: new Map(input.verifications.map((row) => [row.id, row])),
    weights: input.rule?.weights ?? DEFAULT_SETTINGS.metricWeights,
    zoneRisks: input.zoneRisks,
    recurrenceByCriterion: input.recurrenceByCriterion,
  };
}

/** Un critère est candidat s'il est vérifiable, vivant et non couvert. */
function isHoleCandidate(criterion: Criterion, context: HoleContext): boolean {
  if (!criterion.falsifiable) return false;
  if (criterion.deletedAt) return false;
  return !context.covered.has(criterion.id);
}

/** Le trou d'un critère, avec son métré calculé par `metric.ts`. */
function holeOf(criterion: Criterion, scope: string, context: HoleContext): Hole {
  const zone = zoneOf(criterion, context);
  const scored = scoreHole({
    kind: criterion.kind,
    zoneRisk: findZoneRisk(context.zoneRisks, zone, scope),
    recurrence: context.recurrenceByCriterion[criterion.id] ?? 0,
    weights: context.weights,
  });
  const hole: Hole = {
    id: holeId(criterion.id, scope),
    criterionId: criterion.id,
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    kind: criterion.kind,
    priorityScore: scored.score,
    priorityTerms: [...scored.terms],
    scope,
    state: 'open',
  };
  if (zone) hole.zone = zone;
  return hole;
}

/* ----------------------------------------------------------------- mailles */

/** Les critères couverts par au moins une maille vivante. */
function coveredCriterionIds(input: HoleInput): ReadonlySet<string> {
  const verificationById = new Map(input.verifications.map((row) => [row.id, row]));
  const danglingIds = openDanglingIds(input.dangling);
  const covered = new Set<string>();
  for (const link of input.links) {
    if (!isLivingLink(link, verificationById, danglingIds)) continue;
    covered.add(link.criterionId);
  }
  return covered;
}

/** Les fils détendus encore ouverts : ils ne couvrent plus rien (§8.3). */
function openDanglingIds(dangling: readonly Dangling[]): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const thread of dangling) {
    if (thread.state === 'open') ids.add(thread.verificationId);
  }
  return ids;
}

/**
 * Une liaison est vivante si elle n'a pas été rejetée, si son acte n'est pas
 * désactivé, si aucun fil détendu ne l'a vidée, et si — liaison dérivée —
 * elle est au-dessus du seuil de couverture provisoire (§9.2).
 */
function isLivingLink(
  link: Link,
  verificationById: ReadonlyMap<string, Verification>,
  danglingIds: ReadonlySet<string>,
): boolean {
  if (link.rejectedAt) return false;
  const verification = verificationById.get(link.verificationId);
  if (!verification) return false;
  if (verification.disabledAt) return false;
  if (danglingIds.has(verification.id)) return false;
  if (link.kind === 'derived') return link.confidence >= DERIVED_LINK_THRESHOLD;
  return true;
}

/* ------------------------------------------------------------------ zones */

/**
 * Un critère qui porte aussi sa zone du dépôt (§11).
 *
 * Le contrat gelé `Criterion` n'a pas encore ce champ : on le lit
 * structurellement, sans modifier `src/types.ts` (fichier gelé, hors du
 * périmètre du lot). Le jour où le champ existe, le trou l'utilise sans
 * rien changer ici.
 */
type CriterionWithZone = Criterion & { zone?: string };

/** La zone du dépôt portée par le critère lui-même, si elle existe. */
function criterionZone(criterion: Criterion): string | undefined {
  return (criterion as CriterionWithZone).zone;
}

/**
 * La zone du dépôt où le critère vit : d'abord le critère lui-même, puis
 * l'acte qui le vérifiait — même mort, il porte la zone — sinon la zone des
 * actes du même ticket, mais seulement si ces actes sont d'accord. Des actes
 * qui se contredisent ne disent rien : la zone reste inconnue, le trou
 * affiche « zone sans antécédent » plutôt qu'une zone devinée (§22).
 */
function zoneOf(criterion: Criterion, context: HoleContext): string | undefined {
  const own = criterionZone(criterion);
  if (own) return own;
  const linked = zonesOfCriterion(criterion, context).find((zone) => zone !== undefined);
  if (linked) return linked;
  return zoneOfTicket(criterion, context);
}

/** Les zones des actes liés au critère, du plus récent au plus ancien. */
function zonesOfCriterion(
  criterion: Criterion,
  context: HoleContext,
): (string | undefined)[] {
  return context.links
    .filter((link) => link.criterionId === criterion.id)
    .map((link) => context.verificationById.get(link.verificationId))
    .filter((row): row is Verification => row !== undefined)
    .sort((left, right) => Date.parse(right.executedAt) - Date.parse(left.executedAt))
    .map((row) => row.zone);
}

/** À défaut d'acte lié : la zone des actes du même ticket, si elle est unique. */
function zoneOfTicket(criterion: Criterion, context: HoleContext): string | undefined {
  const zones = new Set(
    [...context.verificationById.values()]
      .filter((row) => row.ticketKey === criterion.ticketKey && Boolean(row.zone))
      .map((row) => row.zone as string),
  );
  if (zones.size !== 1) return undefined;
  return [...zones][0];
}

/* ----------------------------------------------------------------- sortie */

/**
 * L'identifiant du trou : déterministe, dérivé du critère et du périmètre.
 * Deux recalculs donnent le même identifiant, donc le trou est mis à jour et
 * jamais dupliqué.
 */
function holeId(criterionId: string, scope: string): string {
  return `hole_${fnv1a(`${criterionId}|${scope}`)}`;
}

/** Une empreinte courte et stable (FNV-1a sur 64 bits) — pas de dépendance. */
function fnv1a(text: string): string {
  let low = 0x84222325;
  let high = 0xcbf29ce4;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    low = Math.imul(low ^ code, 0x01000193) >>> 0;
    high = Math.imul(high ^ code, 0x01000193) >>> 0;
  }
  return high.toString(16).padStart(8, '0') + low.toString(16).padStart(8, '0');
}

/** Tri : priorité décroissante, puis repère du critère (ordre stable). */
function byPriority(left: Hole, right: Hole): number {
  if (right.priorityScore !== left.priorityScore) return right.priorityScore - left.priorityScore;
  if (left.ticketKey !== right.ticketKey) return left.ticketKey.localeCompare(right.ticketKey);
  return left.criterionKey.localeCompare(right.criterionKey);
}
