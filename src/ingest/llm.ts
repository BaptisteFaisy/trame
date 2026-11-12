/**
 * Adaptateur LLM — souche honnête L0 avec le vrai cache et le vrai budget
 * (§18, §22).
 *
 * La souche ne ment pas : `suggestLinks` ne propose rien, `classifyKind`
 * répond `functional` par défaut, `unfalsifiableReason` répond `null`, et les
 * contenus générés (`proposeReformulation`, `draftTest`) renvoient du vide
 * marqué `notImplemented` — jamais un texte qui aurait l'air généré.
 *
 * Ce qui est déjà réel, parce que la sobriété ne se branche pas plus tard :
 * - **cache par empreinte de critère (§18)** : la clé de cache est
 *   `fingerprint(text)` (src/collect/fingerprint.ts) ; un texte inchangé ne
 *   rappelle jamais le modèle, la similarité ne recalcule que ce qui a changé ;
 * - **budget tenu (§18, §22)** : chaque appel effectif (cache manqué)
 *   incrémente `store.addBudget(jour, 1, jetons, 0)` — un appel fantôme en
 *   souche reste un appel compté, et le jet d'or du budget est affiché.
 *
 * Signature exigée par src/deps.ts : `createLlmGateway(store, clock)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Clock, LlmGateway, SimilarityProposal, TrameStore } from '../ports.js';
import type { Criterion, CriterionKind, Verification } from '../types.js';
import { fingerprint } from '../collect/fingerprint.js';
import { dayOf, estimateTokens } from './common.js';

/** Marque explicite des contenus non générés (honnêteté §22). */
export const NOT_IMPLEMENTED = 'notImplemented';

export function createLlmGateway(store: TrameStore, clock: Clock): LlmGateway {
  /** Cache en mémoire indexé par empreinte : une clé par opération (§18). */
  const cache = new Map<string, unknown>();

  /**
   * Discipline commune : cache d'abord ; en cas de manque, appel (ici simulé)
   * puis budget `addBudget(jour, 1, jetons, 0)` — même en souche (§18).
   */
  async function cached<T>(operation: string, text: string, compute: () => Promise<T>): Promise<T> {
    const key = `${operation}:${fingerprint(text)}`;
    if (cache.has(key)) return cache.get(key) as T;
    const result = await compute();
    cache.set(key, result);
    await store.addBudget(dayOf(clock.now()), 1, estimateTokens(text), 0);
    return result;
  }

  return {
    suggestLinks(criteria: readonly Criterion[], tests: readonly Verification[]): Promise<SimilarityProposal[]> {
      const material = [...criteria.map((c) => c.text), ...tests.map((t) => t.name)].join('\n');
      // Souche : aucune proposition — un lien dérivé non confirmé ne compte
      // jamais comme couverture (§9.2), et rien n'est encore calculé.
      return cached('suggestLinks', material, () => Promise.resolve([]));
    },
    classifyKind(text: string): Promise<CriterionKind> {
      return cached('classifyKind', text, () => Promise.resolve<CriterionKind>('functional'));
    },
    unfalsifiableReason(text: string): Promise<string | null> {
      return cached('unfalsifiableReason', text, () => Promise.resolve<string | null>(null));
    },
    proposeReformulation(text: string, reason: string): Promise<{ after: string; measure: string }> {
      return cached(`reformulation:${reason}`, text, () =>
        Promise.resolve({ after: '', measure: NOT_IMPLEMENTED }),
      );
    },
    draftTest(criterion: Criterion, zone?: string): Promise<{ title: string; body: string }> {
      return cached(`draftTest:${zone ?? ''}`, criterion.text, () =>
        Promise.resolve({ title: '', body: NOT_IMPLEMENTED }),
      );
    },
  };
}
