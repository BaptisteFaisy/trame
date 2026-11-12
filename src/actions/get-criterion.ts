import type { ActorContext, Deps } from '../ports.js';
import type { Criterion, Link, Strength, Verification } from '../types.js';
import { detectPerforations } from '../domain/perforations.js';
import { STRENGTH_RANK } from '../defaults.js';
import {
  blindSpotsOf,
  envelope,
  loadCriterion,
  readPersonFilter,
  say,
} from './common.js';

/** Une liaison, telle qu'elle apparaît dans l'historique du critère. */
function linkLine(link: Link, currentHash: string): Record<string, unknown> {
  return {
    id: link.id,
    kind: link.kind,
    path: link.path,
    confidence: link.confidence,
    establishedAt: link.establishedAt,
    confirmedAt: link.confirmedAt,
    /** La maille est-elle à jour avec le texte courant du critère ? */
    fresh: link.criterionHashAtLink === currentHash,
  };
}

/** Un acte de vérification : sa forme, sa force, sa date (§7). */
function verificationLine(act: Verification): Record<string, unknown> {
  return {
    id: act.id,
    name: act.name,
    form: act.form,
    strength: act.strength,
    status: act.status,
    executedAt: act.executedAt,
    sourceSystem: act.sourceSystem,
    sourceRef: act.sourceRef,
    zone: act.zone,
  };
}

/** Les forces qui couvrent le critère, de la plus forte à la plus faible. */
function strengthsOf(links: readonly Link[], verifications: readonly Verification[]): Strength[] {
  const byId = new Map(verifications.map((act) => [act.id, act]));
  const found = new Set<Strength>();
  for (const link of links) {
    const act = byId.get(link.verificationId);
    if (act) found.add(act.strength);
  }
  return [...found].sort((left, right) => STRENGTH_RANK[right] - STRENGTH_RANK[left]);
}

/** Les perforations de ce critère : le texte a bougé depuis la vérification. */
async function perforationsOf(
  deps: Deps,
  criterion: Criterion,
  links: readonly Link[],
  verifications: readonly Verification[],
) {
  const versions = await deps.store.listVersions(criterion.id);
  return detectPerforations({
    criteria: [criterion],
    versions,
    links,
    verifications,
    now: deps.clock.now(),
  });
}

/** Les propositions qui attendent une décision humaine sur ce critère. */
async function proposalsOf(deps: Deps, criterionId: string) {
  const open = await deps.store.listProposals('open');
  return open
    .filter((row) => row.criterionId === criterionId)
    .map((row) => ({ id: row.id, type: row.type, state: row.state, createdAt: row.createdAt }));
}

/**
 * Un critère : empreinte, actes, forces, fraîcheur (§16).
 *
 * La fiche cite le critère et sa source (le gîte où il a été trouvé), liste
 * les mailles qui le couvrent avec leur type de liaison et leur confiance, et
 * dit si le texte a changé depuis la vérification (§24.8 : une liaison dérivée
 * confirmée devient déclarée et apparaît dans cet historique).
 *
 * Entrées : ticketKey, criterionId — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = await loadCriterion(deps, payload);
  if (!read.ok) return read.refusal;
  const { criterion, links, verifications } = read.target;
  const now = deps.clock.now();
  const perforations = await perforationsOf(deps, criterion, links, verifications);
  const proposals = await proposalsOf(deps, criterion.id);
  return {
    ...envelope({ scope: criterion.ticketKey, scopeType: 'ticket' }, now),
    criterion: {
      id: criterion.id,
      ticketKey: criterion.ticketKey,
      criterionKey: criterion.criterionKey,
      text: criterion.text,
      textHash: criterion.textHash,
      kind: criterion.kind,
      origin: criterion.origin,
      falsifiable: criterion.falsifiable,
      unfalsifiableReason: criterion.unfalsifiableReason,
      version: criterion.version,
      createdAt: criterion.createdAt,
      changedAt: criterion.changedAt,
    },
    links: links.map((link) => linkLine(link, criterion.textHash)),
    linkCount: links.length,
    verifications: verifications.map(verificationLine),
    strengths: strengthsOf(links, verifications),
    fresh: links.some((link) => link.criterionHashAtLink === criterion.textHash),
    perforations: perforations.map((row) => ({
      id: row.id,
      verificationId: row.verificationId,
      changedAt: row.changedAt,
      verifiedAt: row.verifiedAt,
      ageDays: row.ageDays,
      klass: row.klass,
      state: row.state,
    })),
    proposals,
    blindSpots: await blindSpotsOf(deps),
    messages: [say(deps, 'msg.dated-scope')],
  };
}
