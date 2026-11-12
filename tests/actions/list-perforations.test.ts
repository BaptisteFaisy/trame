/**
 * `list-perforations` — l'outil MCP qui liste les critères percés (§16).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/list-perforations.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface PerforationLine {
  ticketKey: string;
  criterionKey: string;
  changedAt: string;
  verifiedAt: string;
  ageDays: number;
  klass: string;
  state: string;
}

interface PerforationsResponse {
  perforations: PerforationLine[];
  count: number;
  total: number;
  error?: string;
}

describe('list-perforations — §24.4 le critère percé porte ses deux dates', () => {
  it('§24.4 — un critère modifié après son test est listé (scénario TRAME-1)', async () => {
    const { deps } = await buildScenario();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket' },
      ACTOR,
    )) as PerforationsResponse;
    expect(out.error).toBeUndefined();
    expect(out.perforations.length).toBe(1);
    const perforation = out.perforations[0];
    expect(perforation.criterionKey).toBe('AC-4');
    // Les deux dates : le changement et la vérification (§24.4).
    expect(perforation.changedAt).toBeTruthy();
    expect(perforation.verifiedAt).toBeTruthy();
    // Le classement du graffiti (§8.2).
    expect(perforation.klass).toBe('fresh');
    expect(perforation.ageDays).toBe(3);
  });

  it('§24.4 — le projet de démonstration porte ses perforations', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint' },
      ACTOR,
    )) as PerforationsResponse;
    expect(out.total).toBe(3);
    expect(out.perforations.map((row) => row.criterionKey).sort()).toEqual(['AC-2', 'AC-4', 'AC-4']);
  });

  it('§24.4 — le filtre d’âge garde les perforations assez anciennes', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint', age: 30 },
      ACTOR,
    )) as PerforationsResponse;
    // Seule TRAME-104/AC-2 (34 jours) dépasse 30 jours.
    expect(out.count).toBe(1);
    expect(out.perforations[0].criterionKey).toBe('AC-2');
    expect(out.perforations[0].klass).toBe('dry');
  });
});