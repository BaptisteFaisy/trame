/**
 * Adaptateur pipeline — le pont signé vers les CI (§7 forme 1, §18).
 *
 * C'est la **seule** source de la force « machine » que l'app possède en
 * propre : un pipeline pousse ses résultats vers le web trigger signé
 * (`ci-results`, §18), et ils deviennent des actes de forme `automated-test`,
 * force **machine** — la seule force qui prouve (§4).
 *
 * Deux garde-fous :
 * - **la signature est vérifiée en amont** par le web trigger
 *   (src/handlers/ingest.ts) : une charge non signée n'est jamais interprétée.
 *   Ce module ne valide que le **schéma** de la charge utile ;
 * - **une charge inutilisable est écartée, sans lever** : `ingest` répond
 *   alors `[]` et journalise la raison (§18). Jamais d'acte inventé.
 *
 * Le schéma attendu est documenté ci-dessous ; il est versionné
 * (`trame.ci.v1`) pour qu'un pipeline ancien ne soit pas lu à tort.
 *
 * Signature exigée par src/deps.ts : `createPipelineGateway(clock)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Clock, Logger, PipelineGateway } from '../ports.js';
import type { Strength, Verification } from '../types.js';
import { DEFAULT_STRENGTH_BY_FORM } from '../defaults.js';
import { consoleLogger, depsWarning, normalizeStatus, safe } from './common.js';
import { ticketKeyInName } from './refs.js';

/** La version du schéma que ce module sait lire. Toute autre est refusée. */
export const PIPELINE_SCHEMA = 'trame.ci.v1';

/**
 * La charge utile attendue (schéma documenté) :
 *
 * ```jsonc
 * {
 *   "schema": "trame.ci.v1",          // version du schéma — refusée si inconnue
 *   "repository": "ws/service",       // dépôt, zone par défaut (§11)
 *   "ticketKey": "PROJ-12",           // ticket rattaché (optionnel)
 *   "zone": "billing",                // zone explicite (optionnelle)
 *   "issueId": "10001",               // identifiant Jira (optionnel)
 *   "actorRef": "ci/pipeline",        // la CI qui pousse, jamais une personne
 *   "build": {
 *     "id": "build-42",               // identifiant du build (obligatoire)
 *     "url": "https://ci/…",          // l'artefact, référencé jamais copié (§18)
 *     "startedAt": "2026-11-10T08:12:00Z"
 *   },
 *   "results": [
 *     { "name": "PROJ-12.testShouldRetry", "status": "passed",
 *       "at": "2026-11-10T08:12:31Z", "disabled": false }
 *   ]
 * }
 * ```
 */
export interface PipelineResult {
  readonly id?: string;
  readonly name: string;
  readonly status?: string;
  readonly at?: string;
  readonly disabled?: boolean;
}

export interface PipelineBuild {
  readonly id: string;
  readonly url?: string;
  readonly startedAt?: string;
}

export interface PipelinePayload {
  readonly schema: string;
  readonly repository?: string;
  readonly ticketKey?: string;
  readonly zone?: string;
  readonly issueId?: string;
  readonly actorRef?: string;
  readonly build: PipelineBuild;
  readonly results: readonly PipelineResult[];
}

/** Le verdict de la validation : une charge valide, ou la raison du refus. */
export type PipelineValidation =
  | { readonly ok: true; readonly value: PipelinePayload }
  | { readonly ok: false; readonly reason: string };

/** Un champ texte de la charge utile (jamais un autre type). */
function text(raw: Record<string, unknown>, key: string): string | undefined {
  const value = raw[key];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** Un résultat de test utilisable ; `null` s'il n'a pas de nom. */
function resultOf(raw: unknown): PipelineResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const name = text(record, 'name');
  if (!name) return null;
  return {
    id: text(record, 'id'),
    name,
    status: text(record, 'status'),
    at: text(record, 'at'),
    disabled: record['disabled'] === true,
  };
}

/**
 * Valide la charge utile du pont. Une charge **inutilisable** est refusée
 * avec une raison — elle n'est jamais interprétée à moitié, et rien ne lève.
 */
export function validatePayload(payload: unknown): PipelineValidation {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, reason: 'charge utile absente ou non-objet' };
  }
  const raw = payload as Record<string, unknown>;
  const schema = text(raw, 'schema');
  if (schema !== PIPELINE_SCHEMA) {
    return { ok: false, reason: `schéma inattendu : ${schema ?? '(aucun)'}` };
  }
  const build = raw['build'];
  const buildId = build && typeof build === 'object' ? text(build as Record<string, unknown>, 'id') : undefined;
  if (!buildId) return { ok: false, reason: 'build sans identifiant' };
  const results = Array.isArray(raw['results']) ? raw['results'].map(resultOf).filter((r): r is PipelineResult => r !== null) : [];
  if (results.length === 0) return { ok: false, reason: 'aucun résultat de test utilisable' };
  const buildRecord = (build ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    value: {
      schema,
      repository: text(raw, 'repository'),
      ticketKey: text(raw, 'ticketKey'),
      zone: text(raw, 'zone'),
      issueId: text(raw, 'issueId'),
      actorRef: text(raw, 'actorRef'),
      build: {
        id: buildId,
        url: text(buildRecord, 'url'),
        startedAt: text(buildRecord, 'startedAt'),
      },
      results,
    },
  };
}

/** Un identifiant d'acte stable : le même résultat du même build. */
function actId(buildId: string, result: PipelineResult): string {
  const slug = `${buildId}_${result.id ?? result.name}`.replace(/[^A-Za-z0-9_-]+/g, '_');
  return `ver_pipeline_${slug}`;
}

/**
 * Convertit les résultats en actes de vérification : forme `automated-test`,
 * force **machine** (`DEFAULT_STRENGTH_BY_FORM` — la table unique de §7).
 *
 * La date vient du résultat, sinon du build, sinon de l'instant de réception
 * (`clock`) — une borne basse journalisée, jamais une date inventée.
 */
export function toVerifications(
  payload: PipelinePayload,
  clock: Clock,
  report?: (message: string, meta?: unknown) => void,
): Verification[] {
  const acts: Verification[] = [];
  for (const result of payload.results) {
    const executedAt = result.at ?? payload.build.startedAt;
    const status = normalizeStatus(result.status);
    const disabled = result.disabled || status === 'ignored';
    acts.push({
      id: actId(payload.build.id, result),
      form: 'automated-test',
      sourceSystem: 'pipeline',
      sourceRef: `pipeline/${payload.build.id}/${result.id ?? result.name}`,
      issueId: payload.issueId,
      ticketKey: payload.ticketKey ?? ticketKeyInName(result.name),
      name: result.name,
      executedAt: executedAt ?? clock.now(),
      status,
      strength: DEFAULT_STRENGTH_BY_FORM['automated-test'] as Strength,
      artifactRef: payload.build.url,
      authorRef: payload.actorRef,
      disabledAt: disabled ? (executedAt ?? clock.now()) : undefined,
      zone: payload.zone ?? payload.repository,
    });
    if (!executedAt) report?.('résultat non daté : daté de l’instant de réception', { name: result.name });
  }
  return acts;
}

/** Les options de l'adaptateur : le journal, injectable. */
export interface PipelineGatewayOptions {
  readonly log?: Logger;
}

/** Fabrique l'adaptateur ; `clock` horodate les actes non datés. */
export function createPipelineGateway(
  clock: Clock,
  options: PipelineGatewayOptions = {},
): PipelineGateway {
  const warn = depsWarning(options.log ?? consoleLogger, 'pipeline');
  return {
    ingest(payload: unknown): Promise<Verification[]> {
      return safe(warn, 'ingest', async () => {
        const validated = validatePayload(payload);
        if (!validated.ok) {
          warn('charge écartée : inutilisable', validated.reason);
          return [];
        }
        return toVerifications(validated.value, clock, warn);
      }, []);
    },
  };
}
