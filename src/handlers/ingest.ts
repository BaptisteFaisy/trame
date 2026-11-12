import type { Deps } from '../ports.js';

/** Requête du web trigger (urlFormat v2) : corps brut, pour la signature. */
export interface CiWebRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  query: Record<string, string>;
}

export interface CiWebResponse {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Web trigger `ci-results` (§18) : le pont signé depuis les pipelines, source
 * de la force « machine » (§7, forme 1).
 *
 * Souche : le lot L10 vérifiera la signature AVANT d'indexer quoi que ce soit,
 * convertira les résultats en actes de vérification datés, puis déclenchera un
 * recalcul borné. Une requête non signée est refusée, jamais interprétée.
 */
export async function handleCiResults(request: CiWebRequest, deps: Deps): Promise<CiWebResponse> {
  deps.log.log('warn', 'webtrigger ci-results non implémenté', { path: request.path });
  return { status: 501, body: { error: 'not-implemented' } };
}
