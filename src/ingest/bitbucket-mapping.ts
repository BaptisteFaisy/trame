/**
 * Conversion **pure** des réponses brutes de Bitbucket en objets du port
 * (`TestFile`, `BuildRef`, `PullMention`) — §7 formes 1 et 4, §10.
 *
 * Bitbucket ne dit pas « voici les tests » : il dit « voici les fichiers »,
 * « voici les builds », « voici les pull requests ». C'est donc ici que se
 * décide ce qui ressemble à un test — et c'est ici, et nulle part ailleurs,
 * que se reconnaissent :
 * - la **zone** : le dossier du dépôt qui porte le fichier (§11) ;
 * - la **clé de ticket dans le nom** : `PROJ-12.testShouldRetry` → `PROJ-12`
 *   (§10 chemin 2, déterministe — §24.17) ;
 * - les **références de critère** : les `AC-n` cités (§10 chemin 1) ;
 * - le **désactivé** : `@Ignore`, `@Disabled`, `skip` — un test désactivé doit
 *   rester visible, sinon sa couverture ne baisse jamais (§8.3).
 *
 * Module **pur** : ni réseau, ni horloge, ni Forge.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { BuildRef, PullMention, TestFile } from '../ports';
import { normalizeStatus, statusToken } from './common';
import { criterionRefsInName, ticketKeyInName as ticketKeyOf, ticketKeysIn } from './refs';

/** Ce qui est journalisé quand un objet est écarté. */
export type BitbucketReport = (message: string, meta?: unknown) => void;

/** Les options de la conversion : quoi journaliser, et c'est tout. */
export interface BitbucketMappingOptions {
  /** Journal des objets écartés ; absent = aucun journal. */
  readonly report?: BitbucketReport;
}

/** Un objet brut de l'API Bitbucket : la forme est ouverte. */
type RawRecord = Record<string, unknown>;

/** Le premier texte non vide parmi plusieurs noms de champs possibles. */
function firstText(source: RawRecord, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

/** Un objet brut imbriqué (`raw.author.uuid`). */
function nested(source: RawRecord, parent: string): RawRecord | undefined {
  const value = source[parent];
  return value && typeof value === 'object' ? (value as RawRecord) : undefined;
}

/**
 * Un test est **désactivé** quand son nom porte `@Ignore`, `@Disabled` ou
 * `skip` : c'est le fil détendu du §8.3. La détection est faite sur le nom et
 * sur le chemin, jamais sur une correspondance de fichier entier.
 */
const DISABLED_MARKER = /@(ignore|disabled)\b|\b(skip|skipped|ignore|ignored|disabled)\b/i;

/** Vrai si le nom ou le chemin porte la marque d'un test désactivé. */
export function isDisabled(name: string, path: string): boolean {
  return DISABLED_MARKER.test(`${name} ${path}`);
}

/** Le dossier du dépôt qui porte le fichier : la zone (§11). */
export function zoneOf(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const cut = normalized.lastIndexOf('/');
  return cut <= 0 ? '' : normalized.slice(0, cut);
}

/**
 * Un `TestFile` depuis un nom de test et son chemin.
 *
 * - la **zone** est le dossier du dépôt ;
 * - `ticketKeyInName` est la clé trouvée dans le nom (§10 chemin 2) ;
 * - `criterionRefs` sont les `AC-n` cités dans le nom (§10 chemin 1) ;
 * - `disabled` dit qu'un test ne tourne plus (§8.3).
 *
 * Un test sans chemin n'a pas de zone : il est écarté et journalisé — on
 * n'invente pas une zone.
 */
export function toTestFile(
  name: string,
  path: string,
  options: BitbucketMappingOptions = {},
): TestFile | null {
  const cleanName = name.trim();
  const cleanPath = path.trim();
  if (cleanPath.length === 0) {
    options.report?.('test écarté : chemin manquant', { name: cleanName });
    return null;
  }
  const ticketKeyInName = ticketKeyOf(cleanName);
  return {
    name: cleanName,
    path: cleanPath,
    zone: zoneOf(cleanPath),
    disabled: isDisabled(cleanName, cleanPath),
    ticketKeyInName,
    criterionRefs: criterionRefsInName(cleanName),
  };
}

/** L'état d'un build : le vocabulaire du port, jamais celui de l'API. */
function buildState(raw: RawRecord): BuildRef['state'] {
  const state = nested(raw, 'state');
  const result = state ? nested(state, 'result') : undefined;
  const token =
    statusToken(result ? firstText(result, ['name']) : undefined) ||
    statusToken(state ? firstText(state, ['name']) : undefined) ||
    statusToken(firstText(raw, ['state', 'result', 'name']));
  if (token === 'expired') return 'expired';
  const status = normalizeStatus(token);
  if (status === 'passed') return 'successful';
  if (status === 'failed') return 'failed';
  if (status === 'skipped' || status === 'ignored') return 'stopped';
  return 'unknown';
}

/**
 * Un `BuildRef` depuis un build de pipeline.
 *
 * `pipelineEnabled` dit si le build **tourne dans un pipeline** : un build qui
 * ne tourne plus est un fil détendu (§8.3, chemin « le build ne tourne plus »).
 */
export function toBuildRef(
  raw: unknown,
  repository: string,
  options: BitbucketMappingOptions = {},
): BuildRef | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as RawRecord;
  const id = firstText(record, ['uuid', 'id', 'build_number']);
  if (!id) {
    options.report?.('build écarté : identifiant manquant', { repository });
    return null;
  }
  const startedAt = firstText(record, ['created_on', 'started_on', 'createdOn']);
  if (!startedAt) {
    options.report?.('build écarté : date de début manquante', { id, repository });
    return null;
  }
  const pipelineEnabled =
    record['build_number'] !== undefined || nested(record, 'pipeline') !== undefined;
  return {
    id,
    repository,
    state: buildState(record),
    startedAt,
    pipelineEnabled,
  };
}

/**
 * Une `PullMention` depuis une pull request : les mentions de critères et les
 * clés de tickets du titre et de la description (§9.1, §7 forme 4).
 *
 * Une PR **non fusionnée** n'est pas un acte de vérification : elle est
 * renvoyée sans date de fusion, et c'est l'appelant qui décide.
 */
export function toPullMention(
  raw: unknown,
  options: BitbucketMappingOptions = {},
): PullMention | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as RawRecord;
  const id = firstText(record, ['id', 'uuid']);
  if (!id) {
    options.report?.('pull request écartée : identifiant manquant');
    return null;
  }
  const title = firstText(record, ['title']) ?? '';
  if (title.length === 0) {
    options.report?.('pull request écartée : titre manquant', { id });
    return null;
  }
  const description = firstText(record, ['description']) ?? '';
  const merged = statusToken(firstText(record, ['state'])) === 'merged';
  const author = nested(record, 'author');
  const mentions = `${title}\n${description}`;
  return {
    pullRequestId: id,
    title,
    description,
    mergedAt: merged ? firstText(record, ['updated_on', 'merged_on']) : undefined,
    authorRef: author ? firstText(author, ['uuid', 'account_id', 'nickname']) : undefined,
    criterionRefs: criterionRefsInName(mentions),
    ticketKeys: ticketKeysIn(mentions),
  };
}
