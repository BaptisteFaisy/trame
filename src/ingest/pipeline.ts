/**
 * Adaptateur pipeline (web trigger signé) — souche L0 (§7 forme 1, §18).
 *
 * Le pont réel : une CI externe pousse ses résultats de tests vers le web
 * trigger signé de l'app, qui les convertit en `Verification` de force
 * **machine** par défaut (`automated-test`, §7 forme 1) — la seule force qui
 * prouve (§4). La signature du pont et le schéma du payload arrivent en L2 ;
 * `ingest` retourne `[]` tant qu'aucun payload n'est validé, sans jamais
 * lever (§18).
 *
 * Signature exigée par src/deps.ts : `createPipelineGateway(clock)`.
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Clock, PipelineGateway } from '../ports.js';
import type { Verification } from '../types.js';

export function createPipelineGateway(clock: Clock): PipelineGateway {
  return {
    ingest(_payload: unknown): Promise<Verification[]> {
      // `clock` horodatera chaque vérification ingérée en L2 (executedAt).
      void clock;
      return Promise.resolve([]);
    },
  };
}
