import type { Deps } from '../ports.js';

/**
 * Trigger `avi:jira:updated:issue` (§18).
 *
 * Souche : le lot L10 y branchera l'extraction incrémentale des critères du
 * ticket modifié (avec empreinte, §6), la détection immédiate d'une perforation
 * (le critère a changé après sa dernière vérification, §8.2) et la mise en file
 * d'un recalcul borné par le curseur (§18 : 25 s par fonction standard).
 *
 * Un événement illisible ne lève jamais : il est journalisé et ignoré.
 */
export async function onJiraEvent(payload: Record<string, unknown>, deps: Deps): Promise<void> {
  const issueId = String(payload['issueId'] ?? payload['issueKey'] ?? '');
  deps.log.log('info', 'trigger jira:updated:issue', { issueId });
}
