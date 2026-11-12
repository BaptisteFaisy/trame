/**
 * Les fils détendus (§8.3) — les actes de vérification qui ne couvrent plus rien.
 *
 * Recette du cahier des charges :
 *  - §24.5 : un test désactivé fait disparaître sa couverture du chiffre
 *    affiché (le fil détendu porte l'impact : le nombre de mailles retirées) ;
 *  - §24.6 : un critère supprimé fait apparaître un fil détendu avec sa raison ;
 *  - §8.3 : les quatre raisons (désactivé, renommé, critère supprimé, build
 *    qui ne tourne plus) ;
 *  - §23 : un test désactivé le jour de la release est vu au recalcul.
 */
import { describe, expect, it } from 'vitest';
import { detectDangling } from '../../src/domain/dangling.js';
import {
  TICKET,
  TODAY,
  buildScenario,
  daysAgo,
  makeCriterion,
  makeLink,
  makeVerification,
} from '../helpers/index.js';

describe('fils détendus — le test qui ne prouve plus rien (§8.3)', () => {
  it('§24.5 — un test désactivé fait disparaître sa couverture du chiffre affiché', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({
      id: 'v1',
      status: 'ignored',
      disabledAt: daysAgo(1),
      executedAt: daysAgo(12),
    });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].reason).toBe('test-disabled');
    expect(dangling[0].verificationId).toBe('v1');
    expect(dangling[0].verificationName).toBe(verification.name);
    expect(dangling[0].impact).toBe(1);
    expect(dangling[0].detectedAt).toBe(TODAY);
    expect(dangling[0].state).toBe('open');
  });

  it('§24.5 — l’impact est le nombre de mailles que le fil retire', () => {
    const first = makeCriterion({ id: 'c1' });
    const second = makeCriterion({ id: 'c2' });
    const verification = makeVerification({ id: 'v1', status: 'skipped' });
    const links = [
      makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' }),
      makeLink({ id: 'l2', criterionId: 'c2', verificationId: 'v1' }),
    ];

    const dangling = detectDangling({
      verifications: [verification],
      links,
      criteria: [first, second],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].impact).toBe(2);
  });

  it('§24.6 — un critère supprimé fait apparaître un fil détendu avec sa raison', () => {
    const criterion = makeCriterion({ id: 'c1', deletedAt: daysAgo(1) });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(12) });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].reason).toBe('criterion-deleted');
    expect(dangling[0].impact).toBe(1);
  });

  it('§24.6 — un critère supprimé ne retire que sa propre maille', () => {
    const deleted = makeCriterion({ id: 'c1', deletedAt: daysAgo(1) });
    const alive = makeCriterion({ id: 'c2' });
    const verification = makeVerification({ id: 'v1', executedAt: daysAgo(12) });
    const links = [
      makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' }),
      makeLink({ id: 'l2', criterionId: 'c2', verificationId: 'v1' }),
    ];

    const dangling = detectDangling({
      verifications: [verification],
      links,
      criteria: [deleted, alive],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].reason).toBe('criterion-deleted');
    expect(dangling[0].impact).toBe(1);
  });

  it('§8.3 — un test renommé : la source ne désigne plus le nom de l’acte', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({
      id: 'v1',
      sourceSystem: 'bitbucket',
      sourceRef: 'src/weave/OldNameTest.java',
      name: 'WeaveTest.testShouldRetry',
      executedAt: daysAgo(12),
    });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].reason).toBe('test-renamed');
  });

  it('§8.3 — un test dont la source et le nom concordent n’est pas renommé', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({
      id: 'v1',
      sourceSystem: 'bitbucket',
      sourceRef: 'src/weave/WeaveTest.java',
      name: 'WeaveTest.testShouldRetry',
      executedAt: daysAgo(12),
    });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(0);
  });

  it('§8.3 — un build qui ne tourne plus laisse un fil détendu', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({
      id: 'v1',
      sourceSystem: 'pipeline',
      status: 'unknown',
      executedAt: daysAgo(12),
    });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].reason).toBe('build-not-running');
  });

  it('un acte qui couvre encore son critère n’est pas un fil détendu', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({ id: 'v1', status: 'passed', executedAt: daysAgo(3) });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(0);
  });

  it('§23 — un test désactivé le jour de la release est vu au recalcul', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({
      id: 'v1',
      status: 'passed',
      disabledAt: TODAY,
      executedAt: daysAgo(12),
    });
    const link = makeLink({ id: 'l1', criterionId: 'c1', verificationId: 'v1' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [link],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].reason).toBe('test-disabled');
    expect(dangling[0].detectedAt).toBe(TODAY);
  });

  it('un test qui n’a jamais rien couvert n’est pas un fil détendu', () => {
    const criterion = makeCriterion({ id: 'c1' });
    const verification = makeVerification({ id: 'v1', status: 'ignored' });

    const dangling = detectDangling({
      verifications: [verification],
      links: [],
      criteria: [criterion],
      now: TODAY,
    });

    expect(dangling).toHaveLength(0);
  });
});

describe('fils détendus — le scénario de démonstration TRAME-1', () => {
  it('§24.5 — le test désactivé du scénario est dans la file, avec son impact', async () => {
    const scenario = await buildScenario();
    const scope = { scopeType: 'ticket' as const, scope: TICKET };
    const criteria = await scenario.store.listCriteria(scope);
    const verifications = await scenario.store.listVerifications(scope);
    const links = (await Promise.all(criteria.map((c) => scenario.store.listLinks(c.id)))).flat();

    const dangling = detectDangling({ verifications, links, criteria, now: TODAY });

    expect(dangling).toHaveLength(1);
    expect(dangling[0].verificationId).toBe(scenario.ids.disabledTest);
    expect(dangling[0].reason).toBe('test-disabled');
    expect(dangling[0].impact).toBe(1);
    expect(dangling[0].verificationName).toBe(`${TICKET}.testShouldCountHoles`);
  });
});
