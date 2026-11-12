/**
 * Adaptateur Confluence — souche honnête L0 (§6 origine 4, §12.5, §21).
 *
 * `readChecklist` (cases à cocher d'une page, matière des critères d'origine
 * Confluence et des vérifications tracées §7 forme 2) arrive au lot L2 :
 * en attendant elle retourne le vide, sans erreur.
 *
 * `publishCertificate` retourne `null` et le journalise : si l'écriture
 * Confluence se révèle impossible (droit `write:content` manquant, page
 * protégée), le repli du §21 s'applique — **le certificat est généré dans
 * l'app puis exporté manuellement**. Un `null` ici n'est jamais une erreur,
 * c'est le repli déclaré (§18).
 *
 * Signature exigée par src/deps.ts : `createConfluenceGateway(log)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ConfluenceGateway, Logger } from '../ports.js';
import type { VisibilityProbe } from '../types.js';
import { absentProbe, depsWarning } from './common.js';

/** Détail unique de la sonde Confluence. */
export const CONFLUENCE_NOT_WIRED = 'connecteur Confluence non câblé';

export function createConfluenceGateway(log: Logger): ConfluenceGateway {
  const warn = depsWarning(log, 'confluence');
  return {
    readChecklist(pageId: string): Promise<{ text: string; checked: boolean; at?: string }[]> {
      warn(`readChecklist(${pageId}) : résultat vide`, CONFLUENCE_NOT_WIRED);
      return Promise.resolve([]);
    },
    probe(pageId: string): Promise<VisibilityProbe> {
      return Promise.resolve(absentProbe(pageId, CONFLUENCE_NOT_WIRED, 'no-right'));
    },
    publishCertificate(spaceKey: string, _title: string, _body: string): Promise<string | null> {
      warn(`publishCertificate(${spaceKey}) : non publié`, 'repli §21 : certificat généré dans l’app puis exporté');
      return Promise.resolve(null);
    },
  };
}
