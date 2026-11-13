/**
 * Les données de test de la trame (§8.1) — un seul jeu, partagé par les tests
 * de couverture et de bulletin, pour que les deux jugent la même trame.
 *
 * Le périmètre de référence :
 *
 *  - AC-1 → test automatisé exécuté (machine), liaison déclarée, à jour ;
 *  - AC-2 → attestation tierce (attestée), liaison déclarée, à jour ;
 *  - AC-3 → commentaire (déclarée), liaison déclarée, à jour ;
 *  - AC-4 → liaison **dérivée** à 0,91 : couverture **provisoire** ;
 *  - AC-5 → test automatisé, mais le critère a changé depuis : **périmé** ;
 *  - AC-6 → aucun acte : c'est le **trou** ;
 *  - AC-7 → critère **infalsifiable** : ni trou, ni couverture (§8.4).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Criterion, Link, Verification } from '../../src/types.js';
import { makeCriterion, makeLink, makeVerification } from '../helpers/index.js';

/** La date de référence : la date vient des données, jamais de l'horloge. */
export const AT = '2026-11-12T09:00:00.000Z';

/** La date du sprint précédent, pour la comparaison du bulletin (§24.13). */
export const PREVIOUS_AT = '2026-11-05T09:00:00.000Z';

/** Un critère du périmètre, avec son empreinte. */
export function crit(key: string, over: Partial<Criterion> = {}): Criterion {
  return makeCriterion({ id: `crit_${key}`, criterionKey: key, textHash: `hash_${key}`, ...over });
}

/** Un acte de vérification ; la force suit la forme de l'acte (§7). */
export function act(id: string, over: Partial<Verification> = {}): Verification {
  return makeVerification({ id, ...over });
}

/** Une maille : un critère, un acte, un type de liaison. */
export function mesh(
  criterion: Criterion,
  verification: Verification,
  over: Partial<Link> = {},
): Link {
  return makeLink({
    id: `link_${criterion.criterionKey}_${verification.id}`,
    criterionId: criterion.id,
    verificationId: verification.id,
    criterionHashAtLink: criterion.textHash,
    ...over,
  });
}

/** Les entités d'un périmètre, sans la date : la date vient de l'appelant. */
export interface ScopeFixture {
  criteria: Criterion[];
  verifications: Verification[];
  links: Link[];
}

/** Le périmètre de référence : 7 critères écrits, 6 vérifiables, 5 couverts. */
export function referenceScope(): ScopeFixture {
  const ac1 = crit('AC-1');
  const ac2 = crit('AC-2');
  const ac3 = crit('AC-3');
  const ac4 = crit('AC-4');
  const ac5 = crit('AC-5');
  const ac6 = crit('AC-6');
  const ac7 = crit('AC-7', {
    falsifiable: false,
    unfalsifiableReason: '« rapide » n’est pas mesurable',
  });

  const machine = act('ver_machine', { form: 'automated-test' });
  const attested = act('ver_attested', { form: 'third-party' });
  const comment = act('ver_comment', { form: 'declaration' });
  const derivedAct = act('ver_derived', { form: 'automated-test' });
  const staleAct = act('ver_stale', { form: 'automated-test' });

  return {
    criteria: [ac1, ac2, ac3, ac4, ac5, ac6, ac7],
    verifications: [machine, attested, comment, derivedAct, staleAct],
    links: [
      mesh(ac1, machine),
      mesh(ac2, attested),
      mesh(ac3, comment),
      mesh(ac4, derivedAct, { kind: 'derived', path: 'similarity', confidence: 0.91 }),
      mesh(ac5, staleAct, { criterionHashAtLink: 'hash_AC-5_avant' }),
    ],
  };
}

/** Le même périmètre au sprint précédent : AC-3 n’était pas encore couvert. */
export function previousScope(): ScopeFixture {
  const scope = referenceScope();
  const ac3 = scope.criteria[2];
  return {
    criteria: scope.criteria,
    verifications: scope.verifications,
    links: scope.links.filter((link) => link.criterionId !== ac3.id),
  };
}
