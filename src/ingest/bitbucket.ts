/**
 * Adaptateur Bitbucket — souche honnête L0 (§7 formes 1 et 4, §10).
 *
 * Même discipline que le graphe : la lecture réelle (tests d'un dépôt avec
 * leur fichier/zone, builds et leur état, mentions de critères dans les PR)
 * arrive au lot L2 ; en attendant, chaque méthode retourne le vide et la
 * sonde déclare `no-right` sans erreur (§18) — un dépôt illisible n'est jamais
 * rapporté comme un dépôt sans test (§22, §23).
 *
 * Signature exigée par src/deps.ts : `createBitbucketGateway(log)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { BitbucketGateway, BuildRef, Logger, PullMention, TestFile } from '../ports.js';
import type { VisibilityProbe } from '../types.js';
import { absentProbe, depsWarning } from './common.js';

/** Détail unique de la sonde Bitbucket (réutilisé par les quatre méthodes). */
export const BITBUCKET_NOT_WIRED = 'connecteur Bitbucket non câblé';

export function createBitbucketGateway(log: Logger): BitbucketGateway {
  const warn = depsWarning(log, 'bitbucket');
  return {
    listTests(repository: string): Promise<TestFile[]> {
      warn(`listTests(${repository}) : résultat vide`, BITBUCKET_NOT_WIRED);
      return Promise.resolve([]);
    },
    listBuilds(repository: string, _since: string): Promise<BuildRef[]> {
      warn(`listBuilds(${repository}) : résultat vide`, BITBUCKET_NOT_WIRED);
      return Promise.resolve([]);
    },
    pullRequestMentions(repository: string, _since: string): Promise<PullMention[]> {
      warn(`pullRequestMentions(${repository}) : résultat vide`, BITBUCKET_NOT_WIRED);
      return Promise.resolve([]);
    },
    probe(repository: string): Promise<VisibilityProbe> {
      return Promise.resolve(absentProbe(repository, BITBUCKET_NOT_WIRED, 'no-right'));
    },
  };
}
