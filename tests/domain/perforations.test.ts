/**
 * Les perforations (§8.2) — le registre des mailles qui ne tiennent plus.
 *
 * Recette du cahier des charges :
 *  - §24.4 : un critère modifié après son test est listé en perforation, avec
 *    les deux dates et son classement ;
 *  - §24.5 : un test désactivé fait disparaître sa couverture du chiffre
 *    affiché (côté fils détendus) ;
 *  - §23 : un critère modifié puis rétabli à l'identique — perforation
 *    « refermée » ;
 *  - §8.2 : perforation fraîche, sèche, multiple.
 *
 * L'anchor de l'âge : `ageDays` mesure le **dernier changement** du critère
 * depuis `now` (`src/defaults.ts` : « A criterion changed less than this many
 * days ago » pour la perforation fraîche). La classe sèche exige en plus
 * que le critère n'ait jamais été re-vérifié depuis.
 */
import { describe, expect, it } from 'vitest';
import { detectPerforations } from '../../src/domain/perforations.js';
import {
  TICKET,
  TODAY,
  buildScenario,
  daysAgo,
  makeCriterion,
  makeLink,
  makeVerification,
} from '../helpers/index.js';

describe('perforations — la maille percée (§8.2, §24.4)', () => {
  it('§24.4 — un critère modifié après son test est listé avec les deux dates et son classement', () => {
    const criterion = makeCriterion({
      id: 'crit_AC-1',
      criterionKey: 'AC-1',
      textHash: 'hash_2',
      version: 2,
      changedAt: daysAgo(2),
    });
    const verification = makeVerification({ id: 'ver_1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'link_1',
      criterionId: criterion.id,
      verificationId: verification.id,
      criterionHashAtLink: 'hash_1',
    });

    const perforations = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforations).toHaveLength(1);
    expect(perforations[0].criterionId).toBe('crit_AC-1');
    expect(perforations[0].criterionKey).toBe('AC-1');
    expect(perforations[0].ticketKey).toBe(TICKET);
    expect(perforations[0].verificationId).toBe('ver_1');
    expect(perforations[0].criterionVersionNo).toBe(2);
    expect(perforations[0].changedAt).toBe(daysAgo(2));
    expect(perforations[0].verifiedAt).toBe(daysAgo(10));
    expect(perforations[0].ageDays).toBe(2);
    expect(perforations[0].klass).toBe('fresh');
    expect(perforations[0].state).toBe('open');
  });

  it('§22 — les deux dates sont toujours présentes (explicabilité)', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(2) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });

    const [perforation] = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforation.changedAt).not.toBe('');
    expect(perforation.verifiedAt).not.toBe('');
    // La perforation, c'est précisément le changement APRÈS la vérification.
    expect(Date.parse(perforation.changedAt)).toBeGreaterThan(
      Date.parse(perforation.verifiedAt),
    );
    expect(perforation.ageDays).toBe(2);
  });

  it('la maille qui tient encore n’est pas une perforation', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_1', changedAt: daysAgo(2) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });

    const perforations = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforations).toHaveLength(0);
  });

  it('un critère modifié avant sa vérification n’est pas une perforation', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(20) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });

    const perforations = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforations).toHaveLength(0);
  });

  it('une liaison rejetée ne perce rien', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(2) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
      rejectedAt: daysAgo(1),
    });

    const perforations = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforations).toHaveLength(0);
  });

  it('le calcul part de `now`, jamais de l’horloge du système', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(2) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });
    const input = { criteria: [criterion], versions: [], links: [link], verifications: [verification] };

    const now = detectPerforations({ ...input, now: TODAY });
    const later = detectPerforations({ ...input, now: daysAgo(-40) });

    expect(now[0].ageDays).toBe(2);
    expect(later[0].ageDays).toBe(42);
  });
});

describe('perforations — le graffiti (§8.2)', () => {
  it('§8.2 — perforation fraîche : le critère a changé il y a moins de 7 jours', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(6) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });

    const [perforation] = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforation.klass).toBe('fresh');
    expect(perforation.ageDays).toBe(6);
  });

  it('§8.2 — perforation sèche : plus de 30 jours, jamais re-vérifiée depuis', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(40) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(60) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });

    const [perforation] = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforation.klass).toBe('dry');
    expect(perforation.ageDays).toBe(40);
  });

  it('§8.2 — perforation multiple : trois changements sans re-vérification', () => {
    const criterion = makeCriterion({
      id: 'c1',
      textHash: 'hash_4',
      version: 4,
      changedAt: daysAgo(10),
    });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(60) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });
    const versions = [1, 2, 3].map((versionNo) => ({
      id: `v${versionNo}`,
      criterionId: 'c1',
      versionNo,
      textHash: `hash_${versionNo + 1}`,
      changedAt: daysAgo(60 - versionNo * 15),
      changeKind: 'edited' as const,
    }));

    const [perforation] = detectPerforations({
      criteria: [criterion],
      versions,
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforation.klass).toBe('multiple');
  });

  it('un critère re-vérifié depuis son changement n’est pas une perforation sèche', () => {
    const criterion = makeCriterion({ id: 'c1', textHash: 'hash_2', changedAt: daysAgo(40) });
    const stale = makeVerification({ id: 'v_old', executedAt: daysAgo(60) });
    const fresh = makeVerification({ id: 'v_new', executedAt: daysAgo(5) });
    const links = [
      makeLink({
        id: 'l_old',
        criterionId: 'c1',
        verificationId: stale.id,
        criterionHashAtLink: 'hash_1',
      }),
      makeLink({
        id: 'l_new',
        criterionId: 'c1',
        verificationId: fresh.id,
        criterionHashAtLink: 'hash_2',
      }),
    ];

    const perforations = detectPerforations({
      criteria: [criterion],
      versions: [],
      links,
      verifications: [stale, fresh],
      now: TODAY,
    });

    expect(perforations).toHaveLength(1);
    expect(perforations[0].state).toBe('reverified');
  });
});

describe('perforations — les cas limites (§23)', () => {
  it('§23 — un critère rétabli à l’identique : la perforation est refermée', () => {
    const criterion = makeCriterion({
      id: 'c1',
      textHash: 'hash_1',
      version: 3,
      changedAt: daysAgo(5),
    });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(15) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });
    const versions = [
      {
        id: 'v1',
        criterionId: 'c1',
        versionNo: 1,
        textHash: 'hash_1',
        changedAt: daysAgo(20),
        changeKind: 'created' as const,
      },
      {
        id: 'v2',
        criterionId: 'c1',
        versionNo: 2,
        textHash: 'hash_2',
        changedAt: daysAgo(10),
        changeKind: 'edited' as const,
      },
      {
        id: 'v3',
        criterionId: 'c1',
        versionNo: 3,
        textHash: 'hash_1',
        changedAt: daysAgo(5),
        changeKind: 'restored' as const,
      },
    ];

    const perforations = detectPerforations({
      criteria: [criterion],
      versions,
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforations).toHaveLength(1);
    expect(perforations[0].state).toBe('reopened');
    expect(perforations[0].changedAt).toBe(daysAgo(10));
    expect(perforations[0].verifiedAt).toBe(daysAgo(15));
    expect(perforations[0].criterionVersionNo).toBe(3);
  });

  it('§23 — un critère supprimé ne perce plus : c’est le fil détendu qui parle', () => {
    const criterion = makeCriterion({
      id: 'c1',
      textHash: 'hash_2',
      changedAt: daysAgo(2),
      deletedAt: daysAgo(1),
    });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(10) });
    const link = makeLink({
      id: 'l1',
      criterionId: 'c1',
      verificationId: 'v1',
      criterionHashAtLink: 'hash_1',
    });

    const perforations = detectPerforations({
      criteria: [criterion],
      versions: [],
      links: [link],
      verifications: [verification],
      now: TODAY,
    });

    expect(perforations).toHaveLength(0);
  });
});

describe('perforations — le scénario de démonstration TRAME-1', () => {
  it('§24.4 — le critère perforé du scénario est listé avec ses deux dates', async () => {
    const scenario = await buildScenario();
    const scope = { scopeType: 'ticket' as const, scope: TICKET };
    const criteria = await scenario.store.listCriteria(scope);
    const verifications = await scenario.store.listVerifications(scope);
    const links = (await Promise.all(criteria.map((c) => scenario.store.listLinks(c.id)))).flat();
    const versions = (await Promise.all(criteria.map((c) => scenario.store.listVersions(c.id)))).flat();

    const perforations = detectPerforations({ criteria, versions, links, verifications, now: TODAY });

    const perforated = perforations.filter((one) => one.criterionKey === 'AC-4');
    expect(perforated).toHaveLength(1);
    expect(perforated[0].verificationId).toBe(scenario.ids.perforatedTest);
    expect(perforated[0].state).toBe('open');
    expect(perforated[0].verifiedAt).toBe(daysAgo(40));
    expect(perforated[0].changedAt).toBe(daysAgo(3));
    expect(perforated[0].ageDays).toBe(3);
  });

  it('les mailles qui tiennent ne sont pas listées', async () => {
    const scenario = await buildScenario();
    const scope = { scopeType: 'ticket' as const, scope: TICKET };
    const criteria = await scenario.store.listCriteria(scope);
    const verifications = await scenario.store.listVerifications(scope);
    const links = (await Promise.all(criteria.map((c) => scenario.store.listLinks(c.id)))).flat();
    const versions = (await Promise.all(criteria.map((c) => scenario.store.listVersions(c.id)))).flat();

    const perforations = detectPerforations({ criteria, versions, links, verifications, now: TODAY });

    expect(perforations.map((one) => one.criterionKey)).toEqual(['AC-4']);
  });
});