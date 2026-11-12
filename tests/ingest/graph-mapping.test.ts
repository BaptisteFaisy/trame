/**
 * §7 / §24 — la conversion pure du graphe en actes de vérification.
 *
 * Ces tests ne touchent jamais le réseau : ils vérifient la **forme**, la
 * **force**, le **statut**, la **date**, la **référence source** et — surtout
 * — qu'un objet incomplet ne devient jamais un acte inventé (§18).
 */
import { describe, expect, it } from 'vitest';
import type { GraphObject } from '../../src/ports.js';
import { DEFAULT_STRENGTH_BY_FORM } from '../../src/defaults.js';
import {
  fromGraphNodes,
  toVerification,
  toVerifications,
} from '../../src/ingest/graph-mapping.js';

/** Un objet du graphe minimal, complet. */
function execution(over: Partial<GraphObject> = {}): GraphObject {
  return {
    objectType: 'test-execution',
    id: 'exec-1',
    name: 'PROJ-12.testShouldRetry',
    status: 'PASSED',
    at: '2026-11-10T08:12:31.000Z',
    workItemId: '10001',
    zone: 'billing',
    ...over,
  };
}

describe('graph → acte de vérification (§7)', () => {
  it('§24.2 — un test automatisé exécuté est compté « machine »', () => {
    const act = toVerification(execution());
    expect(act?.form).toBe('automated-test');
    expect(act?.strength).toBe('machine');
    expect(act?.strength).toBe(DEFAULT_STRENGTH_BY_FORM['automated-test']);
    expect(act?.status).toBe('passed');
  });

  it('§7 — un `test-run` est aussi un test automatisé exécuté', () => {
    const act = toVerification(execution({ objectType: 'test-run' }));
    expect(act?.form).toBe('automated-test');
    expect(act?.strength).toBe('machine');
  });

  it('§7 — la référence source est `test-execution/<id>`', () => {
    expect(toVerification(execution())?.sourceRef).toBe('test-execution/exec-1');
  });

  it('§10 — le ticket rattaché vient du work-item lié', () => {
    const act = toVerification(execution({ raw: { ticketKey: 'PROJ-12' } }));
    expect(act?.issueId).toBe('10001');
    expect(act?.ticketKey).toBe('PROJ-12');
  });

  it('§11 — la zone est le service, ou le dépôt à défaut', () => {
    expect(toVerification(execution())?.zone).toBe('billing');
    expect(toVerification(execution({ zone: undefined, repository: 'ws/service' }))?.zone).toBe(
      'ws/service',
    );
  });

  it('§18 — un objet sans date est écarté, journalisé, jamais inventé', () => {
    const reports: string[] = [];
    const act = toVerification(execution({ at: undefined }), {
      report: (message) => reports.push(message),
    });
    expect(act).toBeNull();
    expect(reports.join(' ')).toMatch(/date/i);
  });

  it('§18 — un objet sans nom est écarté, journalisé, jamais inventé', () => {
    const reports: string[] = [];
    const act = toVerification(execution({ name: '  ' }), {
      report: (message) => reports.push(message),
    });
    expect(act).toBeNull();
    expect(reports.join(' ')).toMatch(/nom/i);
  });

  it('§5 — un `work-item` n’est pas un acte de vérification', () => {
    const act = toVerification(execution({ objectType: 'work-item' }));
    expect(act).toBeNull();
  });

  it('§8.3 — un test ignoré est marqué désactivé', () => {
    const act = toVerification(execution({ status: 'IGNORED' }));
    expect(act?.status).toBe('ignored');
    expect(act?.disabledAt).toBe('2026-11-10T08:12:31.000Z');
  });

  it('§7 — un statut inconnu reste « unknown », jamais « passed »', () => {
    expect(toVerification(execution({ status: 'bizarre' }))?.status).toBe('unknown');
    expect(toVerification(execution({ status: undefined }))?.status).toBe('unknown');
  });

  it('§7 — un déploiement est un acte déclaré, une PR une revue déclarée', () => {
    const deployment = toVerification(
      execution({ objectType: 'deployment', name: '2026.11.2', status: 'SUCCEEDED' }),
    );
    expect(deployment?.form).toBe('deployment');
    expect(deployment?.strength).toBe('declared');
    const review = toVerification(execution({ objectType: 'pull-request', name: 'PR 42' }));
    expect(review?.form).toBe('code-review');
    expect(review?.strength).toBe('declared');
  });

  it('la liste écarte les objets inutilisables sans les perdre de vue', () => {
    const acts = toVerifications([
      execution(),
      execution({ id: 'exec-2', name: '' }),
      execution({ id: 'exec-3', at: '' }),
    ]);
    expect(acts).toHaveLength(1);
    expect(acts[0].sourceRef).toBe('test-execution/exec-1');
  });

  it('le même objet donne toujours le même identifiant d’acte', () => {
    expect(toVerification(execution())?.id).toBe(toVerification(execution())?.id);
  });
});

describe('lecture des nœuds bruts du graphe (§10)', () => {
  it('lit le nom, le statut, la date et le work-item d’un nœud', () => {
    const [object] = fromGraphNodes(
      [
        {
          id: 'exec-1',
          name: 'PROJ-12.testShouldRetry',
          status: 'PASSED',
          executedAt: '2026-11-10T08:12:31.000Z',
          workItem: { id: '10001' },
          repository: 'ws/service',
        },
      ],
      'test-execution',
    );
    expect(object?.name).toBe('PROJ-12.testShouldRetry');
    expect(object?.status).toBe('PASSED');
    expect(object?.at).toBe('2026-11-10T08:12:31.000Z');
    expect(object?.workItemId).toBe('10001');
    expect(object?.repository).toBe('ws/service');
  });

  it('écarte un nœud sans identifiant plutôt que de l’inventer', () => {
    expect(fromGraphNodes([{ name: 'sans id' }], 'test-execution')).toHaveLength(0);
    expect(fromGraphNodes(['pas un objet'], 'test-execution')).toHaveLength(0);
  });
});
