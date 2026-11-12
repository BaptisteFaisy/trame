/**
 * Adaptateur Teamwork Graph — souche honnête L0 (§10, §21).
 *
 * La lecture réelle passera par **Cypher persisté uniquement** : le Cypher
 * brut est refusé aux nouvelles apps (§21). Un droit est requis **par type
 * d'objet** (`test-plan`, `test-run`, `test-execution`, …) et la lecture se
 * fait au nom d'un utilisateur : un droit manquant **vide le résultat sans
 * erreur** — d'où la sonde `probe`, qui distingue « pas de droit » (`no-right`)
 * de « pas de données » sur un cas dont la réponse est connue (§18, §22).
 *
 * Tant que le connecteur n'est pas câblé (lot L2), `query` retourne `[]` et
 * `probe` déclare honnêtement `no-right` : l'app n'affichera pas de trous
 * « test-* » là où elle n'a simplement pas regardé (§23).
 *
 * Signature exigée par src/deps.ts : `createGraphGateway(log)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { GraphGateway, GraphObject, Logger } from '../ports.js';
import type { ScopeRef, VisibilityProbe } from '../types.js';
import { absentProbe, depsWarning } from './common.js';

/** Détail unique de la sonde : une seule implémentation, réutilisée (L2). */
export const GRAPH_NOT_WIRED = 'connecteur Teamwork Graph non câblé';

export function createGraphGateway(log: Logger): GraphGateway {
  const warn = depsWarning(log, 'graph');
  return {
    query(objectType: string, _scope: ScopeRef, _since?: string): Promise<GraphObject[]> {
      warn(`query(${objectType}) : résultat vide`, GRAPH_NOT_WIRED);
      return Promise.resolve([]);
    },
    probe(objectType: string): Promise<VisibilityProbe> {
      return Promise.resolve(absentProbe(objectType, GRAPH_NOT_WIRED, 'no-right'));
    },
  };
}
