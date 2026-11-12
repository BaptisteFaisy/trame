/**
 * Le témoin de trame (§4, §12.4).
 *
 * Un témoin est l'état **daté** d'une trame, conservé pour comparer deux sprints,
 * deux versions, deux équipes. Il ne se recalcule pas : une fois posé, il est la
 * mémoire du périmètre à cette époque.
 *
 * Discipline de date (§22) : le témoin porte exactement la date de la couverture
 * qu'il conserve. Deux chiffres ne se comparent que si leurs périmètres et leurs
 * époques coïncident — un témoin daté autrement que sa couverture serait une
 * comparaison menteuse.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type { Coverage, ScopeType, Witness } from '../types.js';

/**
 * Enregistre le témoin d'une couverture et le rend.
 * `computedAt` est celui de la couverture, jamais celui de l'enregistrement.
 */
export async function saveWitness(
  deps: Deps,
  scope: string,
  scopeType: ScopeType,
  period: string,
  coverage: Coverage,
): Promise<Witness> {
  const witness: Witness = {
    id: deps.ids.next('wit'),
    scope,
    scopeType,
    period,
    coverage,
    computedAt: coverage.computedAt,
  };
  await deps.store.putWitness(witness);
  return witness;
}

/**
 * Le témoin précédent d'un périmètre, ou `null` s'il n'y en a pas encore.
 * À lire **avant** d'enregistrer le témoin courant : le dépôt rend le plus
 * récent, et deux témoins du même périmètre ne se distinguent que par leur date.
 */
export async function previousWitness(
  deps: Deps,
  scope: string,
  scopeType: ScopeType,
): Promise<Witness | null> {
  return deps.store.lastWitness(scope, scopeType);
}

/**
 * Vrai si le témoin et la couverture portent le même périmètre, donc si la
 * comparaison a un sens (§22 : périmètre stable).
 */
export function comparableTo(previous: Witness | null, coverage: Coverage): boolean {
  if (!previous) return false;
  return previous.scope === coverage.scope && previous.scopeType === coverage.scopeType;
}
