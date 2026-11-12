/**
 * Les zones à risque — l'entrée observable du métré (§11).
 *
 * Une zone du dépôt (composant, service, module) a-t-elle déjà produit des
 * défauts ? Combien, et quand ? C'est la seule question posée ici, et elle se
 * répond **par des faits observés** :
 *
 *  - un défaut par zone (`defectCount`), avec la date du dernier (`lastDefectAt`) ;
 *  - le nombre d'incidents encore ouverts (`openIncidentCount`) ;
 *  - un score normalisé dans [0, 1] (`score`) qui tient compte **du nombre**
 *    de défauts **et de leur ancienneté** : un défaut récent pèse plus qu'un
 *    défaut ancien.
 *
 * Un défaut résolu après livraison (`resolvedAfterDelivery`) pèse davantage :
 * il a atteint les utilisateurs, il prouve que la zone casse *après* la
 * release — c'est exactement le signal que le métré doit remonter (§11).
 *
 * **Les zones sans antécédent n'apparaissent pas** : pas de ligne, pas de
 * score. Le trou qui est dans une zone inconnue le dit dans son terme de
 * métré (« zone sans antécédent ») plutôt que d'inventer un risque (§22).
 *
 * Le module est pur : aucune horloge — la date vient de l'entrée (`now`).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ZoneRisk } from '../types.js';

/* ------------------------------------------------------------------ entrée */

/** Un défaut observé dans une zone du dépôt. */
export interface ZoneDefect {
  zone: string;
  /** La date du défaut. */
  at: string;
  /** Le défaut n'a été résolu qu'après la livraison : il a échappé. */
  resolvedAfterDelivery: boolean;
}

/** Un incident encore ouvert dans une zone du dépôt. */
export interface ZoneIncident {
  zone: string;
}

/** Tout ce qu'il faut pour mesurer le risque des zones — et rien de plus. */
export interface ZoneInput {
  /** Le périmètre mesuré : la zone à risque est scoped et datée (§22). */
  scope: string;
  /** Les défauts passés, tous confondus. */
  defects: readonly ZoneDefect[];
  /** Les incidents encore ouverts. */
  openIncidents: readonly ZoneIncident[];
  /** La date de référence : elle vient des données, jamais de l'horloge. */
  now: string;
}

/* ---------------------------------------------------------------- interne */

/** Une zone en cours de mesure : les compteurs et le risque brut. */
interface ZoneBucket {
  zone: string;
  defectCount: number;
  lastDefectAt?: string;
  openIncidentCount: number;
  rawRisk: number;
}

/** À partir de quand un défaut ne pèse plus qu'un quart de son poids. */
const RECENCY_HORIZON_DAYS = 30;

/** Un défaut échappé après livraison pèse 1,5 fois un défaut rattrapé. */
const ESCAPED_MULTIPLIER = 1.5;

/** Un incident ouvert compte pour une unité de risque (il est vivant). */
const OPEN_INCIDENT_RISK = 1;

/** Le risque brut qui donne un score de 0,5 : trois défauts récents. */
const RISK_HALF_SCALE = 3;

/* ----------------------------------------------------------------- calcul */

/**
 * Mesure le risque de chaque zone (§11).
 *
 * Le score est normalisé : `risque brut / (risque brut + 3)`, donc toujours
 * dans [0, 1] et croissant avec le risque. Trois défauts récents valent 0,5 ;
 * un seul vaut 0,25 ; un défaut vieux de 90 jours ne vaut plus que 0,25 de
 * lui-même.
 */
export function computeZoneRisks(input: ZoneInput): ZoneRisk[] {
  const buckets = new Map<string, ZoneBucket>();
  for (const defect of input.defects) {
    bucketOf(buckets, defect.zone).defectCount += 1;
    const bucket = bucketOf(buckets, defect.zone);
    bucket.lastDefectAt = latest(bucket.lastDefectAt, defect.at);
    bucket.rawRisk += defectRisk(defect, input.now);
  }
  for (const incident of input.openIncidents) {
    const bucket = bucketOf(buckets, incident.zone);
    bucket.openIncidentCount += 1;
    bucket.rawRisk += OPEN_INCIDENT_RISK;
  }
  return [...buckets.values()]
    .map((bucket) => toZoneRisk(bucket, input))
    .sort(byScoreThenZone);
}

/** Le seau d'une zone, créé à la demande. */
function bucketOf(buckets: Map<string, ZoneBucket>, zone: string): ZoneBucket {
  const existing = buckets.get(zone);
  if (existing) return existing;
  const created: ZoneBucket = {
    zone,
    defectCount: 0,
    openIncidentCount: 0,
    rawRisk: 0,
  };
  buckets.set(zone, created);
  return created;
}

/** La valeur de risque d'un défaut : récence × échappement. */
function defectRisk(defect: ZoneDefect, now: string): number {
  const recency = recencyWeight(defect.at, now);
  return defect.resolvedAfterDelivery ? recency * ESCAPED_MULTIPLIER : recency;
}

/** Le poids de récence d'un défaut : 1 aujourd'hui, 0,5 à 30 jours, etc. */
function recencyWeight(at: string, now: string): number {
  const ageDays = ageInDays(at, now);
  return 1 / (1 + ageDays / RECENCY_HORIZON_DAYS);
}

/** L'âge d'un défaut en jours (jamais négatif : l'avenir ne pèse pas). */
function ageInDays(at: string, now: string): number {
  const then = Date.parse(at);
  const today = Date.parse(now);
  if (!Number.isFinite(then) || !Number.isFinite(today)) return 0;
  const days = (today - then) / 86_400_000;
  return days > 0 ? days : 0;
}

/** La date la plus récente des deux (comparaison sur l'horodatage). */
function latest(current: string | undefined, candidate: string): string {
  if (!current) return candidate;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

/** La ligne exposée : les compteurs et le score normalisé. */
function toZoneRisk(bucket: ZoneBucket, input: ZoneInput): ZoneRisk {
  const risk: ZoneRisk = {
    scope: input.scope,
    zone: bucket.zone,
    defectCount: bucket.defectCount,
    openIncidentCount: bucket.openIncidentCount,
    score: normalize(bucket.rawRisk),
    computedAt: input.now,
  };
  if (bucket.lastDefectAt) risk.lastDefectAt = bucket.lastDefectAt;
  return risk;
}

/** Le score normalisé dans [0, 1] : 0,5 pour un risque brut de 3. */
function normalize(rawRisk: number): number {
  if (!Number.isFinite(rawRisk) || rawRisk <= 0) return 0;
  const score = rawRisk / (rawRisk + RISK_HALF_SCALE);
  return Math.round(score * 10000) / 10000;
}

/** Tri : score décroissant, puis zone par ordre alphabétique (stable). */
function byScoreThenZone(left: ZoneRisk, right: ZoneRisk): number {
  if (right.score !== left.score) return right.score - left.score;
  return left.zone.localeCompare(right.zone);
}

/* ------------------------------------------------------------------ usage */

/**
 * Le risque d'une zone donnée, parmi ceux déjà mesurés.
 *
 * Le périmètre d'abord (deux périmètres ne sont pas mélangés, §22), le nom de
 * la zone ensuite. `undefined` quand la zone est inconnue : le trou dira
 * alors « zone sans antécédent » plutôt que d'inventer un risque.
 */
export function findZoneRisk(
  zoneRisks: readonly ZoneRisk[],
  zone: string | undefined,
  scope?: string,
): ZoneRisk | undefined {
  if (!zone) return undefined;
  const inScope = zoneRisks.filter((risk) => risk.zone === zone && (!scope || risk.scope === scope));
  if (inScope.length > 0) return inScope[0];
  return zoneRisks.find((risk) => risk.zone === zone);
}
