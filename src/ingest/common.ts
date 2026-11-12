/**
 * Comportements partagés des adaptateurs Forge (`src/ingest/*`).
 *
 * Discipline commune (§18, §22) :
 * - un droit manquant **vide le résultat sans erreur** : jamais d'exception
 *   brute remontée au domaine, toujours une valeur métier (`null`, `[]`,
 *   `false`) + un avertissement journalisé façon `deps` ;
 * - une sonde de visibilité honnête : `no-right` n'est jamais rapporté comme
 *   un trou — la sonde dit ce que l'app n'a pas pu regarder (§10, §21) ;
 * - aucune preuve n'est recopiée : on référence (§18) ;
 * - **la conversion des statuts est unique** (`normalizeStatus`) : le graphe,
 *   Bitbucket, les commentaires et la CI l'utilisent tous, jamais une copie.
 *
 * C'est le seul endroit où la forme des journaux et des sondes est écrite ;
 * les six adaptateurs la réutilisent (zéro duplication).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Logger } from '../ports.js';
import type { AbsenceKind, VisibilityProbe } from '../types.js';

/** Fabrique d'avertissements « deps-style » : `[trame:deps] <adaptateur> …`. */
export function depsWarning(log: Logger, adapter: string): (message: string, meta?: unknown) => void {
  return (message, meta) => log.log('warn', `[deps] ${adapter}: ${message}`, meta);
}

/** Journal console par défaut (les adaptateurs sans `Logger` injecté). */
export const consoleLogger: Logger = {
  log(level, message, meta) {
    const line = `[trame] ${message}`;
    if (level === 'error') console.error(line, meta ?? '');
    else if (level === 'warn') console.warn(line, meta ?? '');
    else console.log(line, meta ?? '');
  },
};

/** Sonde de visibilité honnête pour un connecteur absent ou sans droit (§22). */
export function absentProbe(
  objectType: string,
  detail: string,
  absence: AbsenceKind = 'no-right',
): VisibilityProbe {
  return { objectType, absence, probeRef: '', readable: false, detail };
}

/**
 * Exécute un appel externe sans jamais lever : toute erreur devient la valeur
 * de repli (`[]`, `null`, `false`) et un avertissement `deps` (§18 — un droit
 * manquant vide le résultat sans erreur).
 */
export async function safe<T>(
  warn: (message: string, meta?: unknown) => void,
  label: string,
  action: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    warn(`${label} : repli sur le vide`, error instanceof Error ? error.message : String(error));
    return fallback;
  }
}

/**
 * Statut d'un acte de vérification : la **même** conversion pour le graphe,
 * Bitbucket, les commentaires et la CI (§7). Un statut inconnu reste
 * `unknown` — jamais un `passed` par défaut : une couverture qui ne dit pas la
 * vérité est pire qu'une couverture absente (§22).
 */
export type VerificationStatus = 'passed' | 'failed' | 'skipped' | 'ignored' | 'unknown';

/**
 * Jetons acceptés, tous sources confondues (`SUCCESSFUL`, `success`,
 * `passed`, `IGNORED`, `not_run`, …). Les jetons inconnus tombent sur
 * `unknown` : l'app ne devine pas l'issue d'un test qu'elle n'a pas lu.
 */
const STATUS_BY_TOKEN: Record<string, VerificationStatus> = {
  passed: 'passed', pass: 'passed', success: 'passed', successful: 'passed', green: 'passed', ok: 'passed',
  failed: 'failed', fail: 'failed', failure: 'failed', failing: 'failed', error: 'failed', broken: 'failed', red: 'failed',
  skipped: 'skipped', skip: 'skipped', pending: 'skipped', blocked: 'skipped',
  stopped: 'skipped', cancelled: 'skipped', canceled: 'skipped', aborted: 'skipped',
  ignored: 'ignored', ignore: 'ignored', disabled: 'ignored', notrun: 'ignored',
};

/**
 * Le jeton d'un statut brut : minuscules, sans séparateur. Partagé pour que
 * la normalisation soit écrite **une seule fois** dans tout le lot.
 */
export function statusToken(raw: string | undefined | null): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

/** Normalise un statut venu d'une source quelconque vers le vocabulaire §7. */
export function normalizeStatus(raw: string | undefined | null): VerificationStatus {
  return STATUS_BY_TOKEN[statusToken(raw)] ?? 'unknown';
}

/**
 * Estimation sobre de jetons pour le budget LLM (§18) : ~4 caractères par
 * jeton. Le budget est tenu même en souche — un appel fantôme reste un appel.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Jour (AAAA-MM-JJ) d'un horodatage ISO : clé du budget quotidien (§18). */
export function dayOf(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}
