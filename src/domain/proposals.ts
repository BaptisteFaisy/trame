/**
 * Les propositions et la file de validation (§12.6, §22).
 *
 * Trois propositions, comme le cahier des charges les nomme :
 *  - **test à écrire** : pour un trou prioritaire, un brouillon de cas de
 *    test — texte, forme attendue (« test automatisé » vs « recette
 *    manuelle »), composant suggéré, et le critère que le test couvrirait ;
 *  - **reformulation** : pour un critère infalsifiable, un critère vérifiable
 *    et la mesure proposée ;
 *  - **re-tissage** : pour une perforation, la liste des actes à rejouer ;
 *  - **re-lien** : pour des actes qui ne sont plus liés, la raison du re-lien.
 *
 * **Rien n'est appliqué.** `enqueueProposal` n'écrit que dans le store des
 * propositions, en état `open` : ni le critère, ni le test, ni le lien ne
 * bougent. Toute proposition passe par la file de validation, donc par une
 * décision humaine (§12.6, §22 réversibilité).
 *
 * Le gabarit de reformulation vit dans `reformulation.ts` : il n'est pas
 * réécrit ici (docs/CONTRACTS.md §1.2, zéro duplication).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports';
import type {
  Criterion,
  CriterionKind,
  Perforation,
  Proposal,
  ProposalPayload,
  VerificationForm,
} from '../types';
import { falsifiabilityOf } from './falsifiability';
import { proposeReformulation } from './reformulation';

/** Les critères dont la vérification est technique : un test automatisé suffit. */
const TECHNICAL_KINDS: readonly CriterionKind[] = [
  'functional',
  'edge-case',
  'non-regression',
  'security',
  'performance',
];

/** Le composant suggéré par type de critère — une suggestion, pas une vérité. */
const ZONE_BY_KIND: Record<CriterionKind, string> = {
  security: 'security',
  performance: 'performance',
  'non-regression': 'regression',
  'edge-case': 'edge-cases',
  functional: 'functional',
  documentation: 'docs',
  experience: 'ux',
};

/* ------------------------------------------------------------------ outils */

/** Le texte nettoyé : espaces aux bouts, espaces multiples réduits. */
function trimmed(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Les premiers mots d'un texte, pour un titre lisible. */
function summary(text: string, max = 60): string {
  const clean = trimmed(text);
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/** La date d'un brouillon : celle de sa source ; l'enfilage la remplace. */
function draftDate(...dates: (string | undefined)[]): string {
  return dates.find((date) => typeof date === 'string' && date.length > 0) ?? '';
}

/** La forme de vérification attendue : automatisée ou recette manuelle. */
function expectedFormFor(kind: CriterionKind): VerificationForm {
  return TECHNICAL_KINDS.includes(kind) ? 'automated-test' : 'manual-case';
}

/** Ce que le test doit observer, une fois le critère reformulé si besoin. */
function expectedOutcome(criterion: Criterion): string {
  const verdict = falsifiabilityOf(criterion.text);
  if (verdict.falsifiable) return `le critère est vérifié : « ${trimmed(criterion.text)} »`;
  const reformulation = proposeReformulation(criterion.text, verdict.reason ?? '');
  return `le critère est reformulé avant d’être vérifié : « ${reformulation.after} » (mesure : ${reformulation.measure})`;
}

/** Le corps du brouillon : GIVEN / WHEN / THEN, le critère cité (§12.6). */
function draftBody(criterion: Criterion): string {
  const given = `GIVEN : le ticket ${criterion.ticketKey}, le critère ${criterion.criterionKey} (« ${trimmed(criterion.text)} »)`;
  const when = 'WHEN  : le comportement décrit par le critère est exercé dans son contexte nominal';
  const then = `THEN  : ${expectedOutcome(criterion)}`;
  return [given, when, then].join('\n');
}

/* -------------------------------------------------------------- brouillons */

/**
 * Le brouillon de cas de test d'un trou prioritaire (§12.6, TR-09).
 *
 * Le brouillon **cite** le critère qu'il couvrirait et dit la forme de
 * vérification attendue ; il n'écrit rien dans le code et ne crée aucun test.
 */
export function draftTest(criterion: Criterion, zone?: string): Proposal {
  const payload: ProposalPayload = {
    kind: 'test-draft',
    title: `${criterion.ticketKey}.${criterion.criterionKey} — ${summary(criterion.text)}`,
    body: draftBody(criterion),
    expectedForm: expectedFormFor(criterion.kind),
    zone: zone ?? ZONE_BY_KIND[criterion.kind],
  };
  return {
    id: `draft-test-${criterion.id}`,
    type: 'test-draft',
    criterionId: criterion.id,
    payload,
    createdAt: draftDate(criterion.changedAt, criterion.createdAt),
    state: 'open',
  };
}

/**
 * La proposition de reformulation d'un critère infalsifiable (§8.4, §24.10).
 *
 * Elle porte le texte d'origine (`before`), le texte proposé (`after`) et la
 * mesure qui rend le critère tranchable.
 */
export function draftReformulation(criterion: Criterion, reason: string): Proposal {
  const reformulation = proposeReformulation(criterion.text, reason);
  const payload: ProposalPayload = {
    kind: 'reformulation',
    before: criterion.text,
    after: reformulation.after,
    measure: reformulation.measure,
  };
  return {
    id: `draft-reformulation-${criterion.id}`,
    type: 'reformulation',
    criterionId: criterion.id,
    payload,
    createdAt: draftDate(criterion.changedAt, criterion.createdAt),
    state: 'open',
  };
}

/**
 * La proposition de re-tissage d'une perforation : la liste des actes à
 * rejouer (§12.6). Les perforations portent chacune l'acte concerné
 * (`verificationId`) : la proposition pointe vers elles.
 */
export function draftRetest(perforations: readonly Perforation[]): Proposal {
  const payload: ProposalPayload = {
    kind: 'retest',
    perforationIds: perforations.map((perforation) => perforation.id),
  };
  return {
    id: `draft-retest-${perforations.map((p) => p.id).join('-')}`,
    type: 'retest',
    criterionId: perforations[0]?.criterionId ?? '',
    payload,
    createdAt: draftDate(...perforations.map((perforation) => perforation.changedAt)),
    state: 'open',
  };
}

/** La proposition de re-lien : les actes à relier et la raison du re-lien. */
export function draftRelink(verificationIds: readonly string[], reason: string): Proposal {
  const payload: ProposalPayload = {
    kind: 'relink',
    verificationIds: [...verificationIds],
    reason,
  };
  return {
    id: `draft-relink-${verificationIds.join('-')}`,
    type: 'relink',
    criterionId: '',
    payload,
    createdAt: '',
    state: 'open',
  };
}

/* --------------------------------------------------------------- la file */

/**
 * Enfile une proposition : elle est **enregistrée**, pas appliquée (§12.6).
 *
 * Le store des propositions reçoit la seule écriture de cette fonction : ni
 * le critère, ni la vérification, ni le lien ne sont touchés. L'identifiant
 * et la date viennent du domaine (horloge injectée, jamais l'horloge système).
 */
export async function enqueueProposal(deps: Deps, proposal: Proposal): Promise<Proposal> {
  const queued: Proposal = {
    ...proposal,
    id: deps.ids.next('prop'),
    createdAt: deps.clock.now(),
    state: 'open',
  };
  await deps.store.putProposal(queued);
  return queued;
}

/**
 * La file des propositions à valider : ce qui attend une décision humaine.
 *
 * Les propositions décidées (`accepted`, `rejected`) sortent de la file ; les
 * autres attendent. Ordre d'arrivée (les plus anciennes d'abord), pour qu'une
 * proposition ne soit jamais repoussée indéfiniment.
 */
export async function validationQueue(deps: Deps, limit: number): Promise<Proposal[]> {
  const open = await deps.store.listProposals('open');
  const byArrival = [...open].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  return byArrival.slice(0, Math.max(0, limit));
}
