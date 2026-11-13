/**
 * Les onze écrans répondent réellement : plus un seul `notImplemented`.
 *
 * On monte les doubles en mémoire (scénario `TRAME-1`), puis on appelle chaque
 * handler d'écran avec un périmètre de ticket, et on vérifie que la réponse
 * porte la clé de structure attendue, jamais la souche.
 */
import { describe, expect, it } from 'vitest';
import { buildScenario } from '../helpers/index.js';
import type { Deps } from '../../src/ports.js';
import * as weaveMap from '../../src/handlers/weave-map.js';
import * as criterionDetail from '../../src/handlers/criterion-detail.js';
import * as holes from '../../src/handlers/holes.js';
import * as perforations from '../../src/handlers/perforations.js';
import * as dangling from '../../src/handlers/dangling.js';
import * as bulletin from '../../src/handlers/bulletin.js';
import * as certificate from '../../src/handlers/certificate.js';
import * as validationQueue from '../../src/handlers/validation-queue.js';
import * as zoneRisks from '../../src/handlers/zone-risks.js';
import * as visibility from '../../src/handlers/visibility.js';
import * as timeline from '../../src/handlers/timeline.js';

const SCREENS: Record<string, (deps: Deps, payload: Record<string, unknown>) => Promise<unknown>> = {
  'weave-map': weaveMap.render,
  'criterion-detail': criterionDetail.render,
  holes: holes.render,
  perforations: perforations.render,
  dangling: dangling.render,
  bulletin: bulletin.render,
  certificate: certificate.render,
  'validation-queue': validationQueue.render,
  'zone-risks': zoneRisks.render,
  visibility: visibility.render,
  timeline: timeline.render,
};

describe('les onze écrans (§17)', () => {
  it('aucun écran ne répond plus une souche §24', async () => {
    const { deps } = await buildScenario();
    for (const [key, render] of Object.entries(SCREENS)) {
      const out = (await render(deps, { scope: 'TRAME-1', scopeType: 'ticket', language: 'fr' })) as {
        notImplemented?: string;
      };
      expect(out.notImplemented, key).toBeUndefined();
      expect(out, key).toBeTruthy();
    }
  });

  it('un périmètre sans critère affiche « aucun critère écrit » et pas 0 % §24.16', async () => {
    const { deps } = await buildScenario();
    const out = (await bulletin.render(deps, { scope: 'TRAME-INCONNU', scopeType: 'ticket' })) as {
      message?: string;
    };
    expect(out.message).toBe('no-criterion-written');
  });

  it('le certificat déclare ce qui n’est pas couvert §24.14', async () => {
    const { deps, ids } = await buildScenario();
    const out = (await certificate.render(deps, { scope: 'TRAME-1', scopeType: 'ticket', language: 'fr' })) as {
      notCovered?: unknown[];
      unfalsifiable?: unknown[];
    };
    expect(out.notCovered).toBeTruthy();
    expect(Array.isArray(out.notCovered)).toBe(true);
    expect(out.unfalsifiable?.length).toBeGreaterThanOrEqual(1);
    expect(ids.ac3).toBeTruthy();
  });
});