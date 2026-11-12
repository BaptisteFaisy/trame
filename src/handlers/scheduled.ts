import type { Deps } from '../ports.js';

/**
 * Déclencheur planifié nocturne (§18).
 *
 * Souche : le lot L10 y mettra le recalcul des perforations et des fils
 * détendus, puis la génération du bulletin — jamais l'extraction des critères
 * (trop coûteuse pour une fenêtre planifiée). Contrainte plateforme : cinq
 * déclencheurs planifiés au plus par app, un seul à 5 minutes (§21).
 */
export async function onScheduledTick(payload: Record<string, unknown>, deps: Deps): Promise<void> {
  deps.log.log('info', 'scheduledTrigger : recalcul nocturne', { payload });
}
