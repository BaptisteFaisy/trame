/**
 * Le retricotage (§9.4) — confirmer ou refuser une liaison, et en apprendre.
 *
 * Une décision humaine est écrite dans le store (`Link.confirmedAt`,
 * `Link.rejectedAt` + la raison du refus) **et** elle apprend : les jetons
 * partagés entre le critère et l'acte sont renforcés par une confirmation,
 * affaiblis par un refus. Les poids restent dans leurs bornes, et un refus
 * **avec raison** affaiblit la suggestion suivante du même type : les
 * liaisons dérivées du même chemin portent désormais ces poids (§9.4, §24.9).
 *
 * Rien n'est appliqué au critère ni à l'acte : la décision porte sur la
 * maille, et la trame est recalculée ailleurs.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type { Criterion, Link, Verification } from '../types.js';
import { learnFrom, sharedTerms, tokenize } from '../domain/confidence.js';
import { readText, refusal } from './common.js';
import type { Refusal } from './common.js';

/** La décision : confirmer, ou refuser. */
export type Decision = 'confirm' | 'reject';

/** Ce que la décision produit, et ce qu'elle a appris. */
export interface LinkDecision {
  link: Link;
  criterion: Criterion;
  verification: Verification;
  /** Les poids après la décision. */
  weights: Record<string, number>;
  /** Les jetons dont le poids a bougé, avec leur poids. */
  learned: { token: string; weight: number }[];
  /** Les liaisons du même type qui portent désormais ces poids. */
  affected: string[];
}

/** La lecture d'une décision : faite, ou refusée avec sa raison. */
export type DecisionRead =
  | { ok: true; decision: LinkDecision }
  | { ok: false; refusal: Refusal };

/** La maille visée : le critère, l'acte, et le lien qui les relie. */
interface Target {
  criterion: Criterion;
  verification: Verification;
  link: Link;
}

/** L'acte désigné : par son identifiant, ou par sa référence source. */
async function findVerification(
  deps: Deps,
  verificationRef: string,
  links: readonly Link[],
): Promise<Verification | null> {
  const direct = await deps.store.getVerification(verificationRef);
  if (direct) return direct;
  for (const link of links) {
    const act = await deps.store.getVerification(link.verificationId);
    if (act && (act.sourceRef === verificationRef || act.name === verificationRef)) return act;
  }
  return null;
}

/** La maille visée par le couple critère × acte. */
async function findTarget(
  deps: Deps,
  criterionId: string,
  verificationRef: string,
): Promise<Target | null> {
  const criterion = await deps.store.getCriterion(criterionId);
  if (!criterion) return null;
  const links = await deps.store.listLinks(criterion.id);
  const verification = await findVerification(deps, verificationRef, links);
  if (!verification) return null;
  const link = links.find((row) => row.verificationId === verification.id);
  if (!link) return null;
  return { criterion, verification, link };
}

/** Les jetons partagés entre le critère et l'acte : ce que la décision pèse. */
function termsOf(criterion: Criterion, verification: Verification) {
  return sharedTerms(tokenize(criterion.text), tokenize(verification.name));
}

/**
 * Les liaisons dérivées du même chemin, dans le périmètre du critère : ce sont
 * elles qui portent la suggestion suivante du même type (§9.4).
 */
async function siblingsOf(
  deps: Deps,
  criterion: Criterion,
  path: Link['path'],
): Promise<Link[]> {
  const found = new Map<string, Link>();
  for (const ref of criterion.scopeRefs) {
    const criteria = await deps.store.listCriteria(ref);
    for (const row of criteria) {
      for (const link of await deps.store.listLinks(row.id)) {
        if (link.kind === 'derived' && link.path === path) found.set(link.id, link);
      }
    }
  }
  return [...found.values()];
}

/** Apporte les poids appris aux suggestions du même type. */
async function propagate(
  deps: Deps,
  criterion: Criterion,
  path: Link['path'],
  weights: Record<string, number>,
  exceptId: string,
): Promise<string[]> {
  const affected: string[] = [];
  for (const link of await siblingsOf(deps, criterion, path)) {
    if (link.id === exceptId) continue;
    const merged = { ...link.weights, ...weights };
    await deps.store.putLink({ ...link, weights: merged });
    affected.push(link.id);
  }
  return affected;
}

/** La décision écrite dans le store : confirmée ou refusée, avec sa date. */
function decidedLink(
  link: Link,
  decision: Decision,
  now: string,
  weights: Record<string, number>,
  reason: string,
): Link {
  if (decision === 'confirm') {
    return { ...link, kind: 'confirmed', confirmedAt: now, weights };
  }
  return { ...link, rejectedAt: now, rejectReason: reason, weights };
}

/** La trace d'audit : qui a décidé, sur quelle maille (§5, piste d'audit). */
async function recordEvent(
  deps: Deps,
  scope: string,
  decision: Decision,
  link: Link,
): Promise<void> {
  await deps.store.putEvent({
    id: deps.ids.next('evt'),
    scope,
    event: decision === 'confirm' ? 'link-confirmed' : 'link-rejected',
    at: deps.clock.now(),
    payload: { linkId: link.id, criterionId: link.criterionId, verificationId: link.verificationId },
  });
}

/**
 * Applique une décision de retricotage.
 *
 * La décision est **écrite**, pas appliquée : ni le critère ni l'acte ne
 * bougent. Seule la maille change de nature — confirmée ou refusée — et les
 * poids appris sont portés par la suggestion suivante du même type.
 */
export async function decideLink(
  deps: Deps,
  payload: Record<string, unknown>,
  decision: Decision,
): Promise<DecisionRead> {
  const criterionId = readText(payload.criterionId) || readText(payload.criterionKey);
  const verificationRef = readText(payload.verificationRef) || readText(payload.verificationId);
  if (!criterionId || !verificationRef) {
    return {
      ok: false,
      refusal: refusal(
        'maille non désignée',
        'criterionId et verificationRef sont obligatoires pour confirmer ou refuser une liaison',
      ),
    };
  }
  const reason = readText(payload.reason);
  if (decision === 'reject' && !reason) {
    return {
      ok: false,
      refusal: refusal('raison manquante', 'un refus sans raison n\'apprend rien (§9.4)'),
    };
  }
  const target = await findTarget(deps, criterionId, verificationRef);
  if (!target) {
    return {
      ok: false,
      refusal: refusal(
        'maille introuvable',
        `aucune liaison vivante entre le critère ${criterionId} et l'acte ${verificationRef}`,
      ),
    };
  }
  return applyDecision(deps, target, decision, reason);
}

/** Écrit la décision, apprend les poids, et touche les suggestions du même type. */
async function applyDecision(
  deps: Deps,
  target: Target,
  decision: Decision,
  reason: string,
): Promise<DecisionRead> {
  const terms = termsOf(target.criterion, target.verification);
  const weights = learnFrom(terms, decision === 'confirm', target.link.weights ?? {});
  const now = deps.clock.now();
  const link = decidedLink(target.link, decision, now, weights, reason);
  await deps.store.putLink(link);
  const affected = await propagate(deps, target.criterion, link.path, weights, link.id);
  await recordEvent(deps, target.criterion.ticketKey, decision, link);
  const learned = terms.map((term) => ({
    token: term.token,
    weight: weights[term.token] ?? term.weight,
  }));
  return {
    ok: true,
    decision: {
      link,
      criterion: target.criterion,
      verification: target.verification,
      weights,
      learned,
      affected,
    },
  };
}
