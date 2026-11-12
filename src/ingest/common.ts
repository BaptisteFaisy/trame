/**
 * Comportements partagés des adaptateurs Forge (`src/ingest/*`).
 *
 * Discipline commune (§18, §22) :
 * - un droit manquant **vide le résultat sans erreur** : jamais d'exception
 *   brute remontée au domaine, toujours une valeur métier (`null`, `[]`,
 *   `false`) + un avertissement journalisé façon `deps` ;
 * - une sonde de visibilité honnête : `no-right` n'est jamais rapporté comme
 *   un trou — la sonde dit ce que l'app n'a pas pu regarder (§10, §21) ;
 * - aucune preuve n'est recopiée : on référence (§18).
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
