/**
 * Tests des zones à risque — l'entrée observable du métré (§11).
 *
 * Les tests portent le numéro de recette du §24 : chaque exigence testée est
 * nommée, pour que la recette se lise dans les titres.
 */
import { describe, expect, it } from 'vitest';
import { computeZoneRisks, findZoneRisk } from '../../src/domain/zones.js';
import type { ZoneInput } from '../../src/domain/zones.js';
import { AT, daysBefore } from './metre-fixtures.js';

/** Un périmètre de zones, sans date : la date vient de l'appelant. */
function zones(over: Partial<ZoneInput> = {}): ZoneInput {
  return {
    scope: 'TRAME-1',
    defects: [],
    openIncidents: [],
    now: AT,
    ...over,
  };
}

describe('zones à risque — les faits observés', () => {
  it('un défaut par zone, avec la date du dernier', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [
          { zone: 'src/pay', at: daysBefore(10), resolvedAfterDelivery: false },
          { zone: 'src/pay', at: daysBefore(2), resolvedAfterDelivery: false },
          { zone: 'src/web', at: daysBefore(5), resolvedAfterDelivery: false },
        ],
      }),
    );
    const pay = risks.find((row) => row.zone === 'src/pay');
    expect(pay?.defectCount).toBe(2);
    expect(pay?.lastDefectAt).toBe(daysBefore(2));
  });

  it('les incidents ouverts sont comptés à part des défauts', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [{ zone: 'src/pay', at: daysBefore(1), resolvedAfterDelivery: false }],
        openIncidents: [{ zone: 'src/pay' }, { zone: 'src/pay' }],
      }),
    );
    const pay = risks.find((row) => row.zone === 'src/pay');
    expect(pay?.defectCount).toBe(1);
    expect(pay?.openIncidentCount).toBe(2);
  });

  it('le score est normalisé dans [0, 1]', () => {
    const risks = computeZoneRisks(
      zones({
        defects: Array.from({ length: 12 }, () => ({
          zone: 'src/pay',
          at: daysBefore(1),
          resolvedAfterDelivery: false,
        })),
      }),
    );
    const pay = risks.find((row) => row.zone === 'src/pay');
    expect(pay?.score).toBeGreaterThan(0);
    expect(pay?.score).toBeLessThanOrEqual(1);
  });

  it('la zone est datée et scopée', () => {
    const risks = computeZoneRisks(
      zones({ defects: [{ zone: 'src/pay', at: daysBefore(1), resolvedAfterDelivery: false }] }),
    );
    expect(risks[0].scope).toBe('TRAME-1');
    expect(risks[0].computedAt).toBe(AT);
  });
});

describe('zones à risque — les zones sans antécédent n’apparaissent pas', () => {
  it('aucune zone sans défaut ni incident ne donne de ligne', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [{ zone: 'src/pay', at: daysBefore(1), resolvedAfterDelivery: false }],
        openIncidents: [],
      }),
    );
    expect(risks.map((row) => row.zone)).toEqual(['src/pay']);
    expect(risks.some((row) => row.score === 0)).toBe(false);
  });

  it('un périmètre sans aucun antécédent ne donne aucune zone', () => {
    expect(computeZoneRisks(zones())).toEqual([]);
  });
});

describe('zones à risque — l’ancienneté compte (§11)', () => {
  it('un défaut récent pèse plus qu’un défaut ancien', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [
          { zone: 'src/recent', at: daysBefore(1), resolvedAfterDelivery: false },
          { zone: 'src/ancien', at: daysBefore(180), resolvedAfterDelivery: false },
        ],
      }),
    );
    const recent = risks.find((row) => row.zone === 'src/recent');
    const ancien = risks.find((row) => row.zone === 'src/ancien');
    expect(recent?.score).toBeGreaterThan(ancien?.score ?? 0);
  });

  it('un défaut échappé après la livraison pèse plus qu’un défaut rattrapé', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [
          { zone: 'src/escaped', at: daysBefore(3), resolvedAfterDelivery: true },
          { zone: 'src/rattrape', at: daysBefore(3), resolvedAfterDelivery: false },
        ],
      }),
    );
    const escaped = risks.find((row) => row.zone === 'src/escaped');
    const rattrape = risks.find((row) => row.zone === 'src/rattrape');
    expect(escaped?.score).toBeGreaterThan(rattrape?.score ?? 0);
  });
});

describe('zones à risque — le tri et la recherche', () => {
  it('les zones sont triées par score décroissant', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [
          { zone: 'src/calme', at: daysBefore(120), resolvedAfterDelivery: false },
          { zone: 'src/casse', at: daysBefore(1), resolvedAfterDelivery: true },
          { zone: 'src/moyen', at: daysBefore(20), resolvedAfterDelivery: false },
        ],
      }),
    );
    const scores = risks.map((row) => row.score);
    expect(scores).toEqual([...scores].sort((left, right) => right - left));
    expect(risks[0].zone).toBe('src/casse');
  });

  it('la recherche de zone renvoie le risque du périmètre demandé', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [{ zone: 'src/pay', at: daysBefore(1), resolvedAfterDelivery: false }],
      }),
    );
    expect(findZoneRisk(risks, 'src/pay', 'TRAME-1')?.zone).toBe('src/pay');
    expect(findZoneRisk(risks, 'src/inconnue', 'TRAME-1')).toBeUndefined();
    expect(findZoneRisk(risks, undefined, 'TRAME-1')).toBeUndefined();
  });
});

describe('zones à risque — le module est pur', () => {
  it('la date vient des données : rien n’est lu dans l’horloge', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [{ zone: 'src/pay', at: daysBefore(1), resolvedAfterDelivery: false }],
        now: daysBefore(0, daysBefore(10)),
      }),
    );
    expect(risks[0].computedAt).toBe(daysBefore(0, daysBefore(10)));
  });

  it('un défaut daté dans le futur ne pèse pas plus qu’un défaut d’aujourd’hui', () => {
    const risks = computeZoneRisks(
      zones({
        defects: [
          { zone: 'src/futur', at: daysBefore(-30), resolvedAfterDelivery: false },
          { zone: 'src/aujourdhui', at: AT, resolvedAfterDelivery: false },
        ],
      }),
    );
    const futur = risks.find((row) => row.zone === 'src/futur');
    const aujourdhui = risks.find((row) => row.zone === 'src/aujourdhui');
    expect(futur?.score).toBe(aujourdhui?.score);
  });
});
