/**
 * Trigger `avi:jira:updated:issue` (§18).
 *
 * Un ticket modifié, c'est un critère qui peut avoir changé : on relit les six
 * origines (§6), on empainte les textes, et si l'empreinte a bougé on inscrit
 * une NOUVELLE VERSION du critère (§19) — c'est ce qui rendra la perforation
 * détectable plus tard (§8.2).
 *
 * Un critère qui porte un secret n'est jamais indexé : le matériau est écarté
 * et signalé, jamais recopié (§5).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Deps } from '../ports.js';
import type { IssueRef } from '../ports.js';
import type { Criterion, CriterionOrigin, ScopeRef } from '../types.js';
import { extractAll, flagSecrets } from '../collect/index.js';
import type { CollectInput, ExtractedCriterion } from '../collect/types.js';
import { fingerprint } from '../collect/fingerprint.js';
import { detectPerforations } from '../domain/perforations.js';
import { falsifiabilityOf } from '../domain/falsifiability.js';

/** Les matériaux des six origines pour un ticket (§6). */
export function materialsOf(issue: IssueRef): CollectInput[] {
  const materials: CollectInput[] = [];
  if (issue.acceptanceField) {
    materials.push({
      issueId: issue.id,
      ticketKey: issue.key,
      origin: 'acceptance-field',
      rawText: issue.acceptanceField,
      updatedAt: issue.updatedAt,
    });
  }
  if (issue.description) {
    materials.push({
      issueId: issue.id,
      ticketKey: issue.key,
      origin: 'description',
      rawText: issue.description,
      updatedAt: issue.updatedAt,
    });
  }
  for (const table of issue.tables ?? []) {
    materials.push({
      issueId: issue.id,
      ticketKey: issue.key,
      origin: 'table',
      rawText: '',
      table,
      updatedAt: issue.updatedAt,
    });
  }
  return materials;
}

/** Les périmètres auxquels un ticket appartient (§8.1). */
export function scopesOf(issue: IssueRef): ScopeRef[] {
  const scopes: ScopeRef[] = [{ scopeType: 'ticket', scope: issue.key }];
  if (issue.sprint) scopes.push({ scopeType: 'sprint', scope: issue.sprint });
  if (issue.fixVersion) scopes.push({ scopeType: 'version', scope: issue.fixVersion });
  return scopes;
}

/** Le critère du domaine correspondant à un critère extrait. */
export function toCriterion(
  issue: IssueRef,
  extracted: ExtractedCriterion,
  textHash: string,
  version: number,
  createdAt: string,
  changedAt: string,
): Criterion {
  const verdict = falsifiabilityOf(extracted.text);
  return {
    id: `crit_${issue.id}_${extracted.criterionKey}`,
    issueId: issue.id,
    ticketKey: issue.key,
    criterionKey: extracted.criterionKey,
    text: extracted.text,
    textHash,
    kind: extracted.kind ?? 'functional',
    origin: extracted.origin,
    falsifiable: verdict.falsifiable && extracted.unfalsifiableHint === undefined,
    unfalsifiableReason: verdict.reason ?? extracted.unfalsifiableHint,
    version,
    createdAt,
    changedAt,
    scopeRefs: scopesOf(issue),
  };
}

/** Inscrit (ou met à jour) les critères extraits d'un ticket. */
export async function storeCriteria(
  deps: Deps,
  issue: IssueRef,
  materials: CollectInput[],
): Promise<Criterion[]> {
  const now = deps.clock.now();
  const extracted = extractAll(materials);
  const stored: Criterion[] = [];
  for (const item of extracted) {
    const textHash = fingerprint(item.text);
    const existing = await deps.store.findCriterion(issue.id, item.criterionKey);
    const version = existing ? existing.version + 1 : 1;
    const criterion = toCriterion(
      issue,
      item,
      textHash,
      version,
      existing?.createdAt ?? now,
      now,
    );
    await deps.store.putCriterion(criterion);
    stored.push(criterion);
    if (!existing || existing.textHash !== textHash) {
      await deps.store.putCriterionVersion({
        id: deps.ids.next('cver'),
        criterionId: criterion.id,
        versionNo: version,
        textHash,
        changedAt: now,
        changeKind: existing ? 'edited' : 'created',
      });
      await deps.store.putEvent({
        id: deps.ids.next('evt'),
        scope: issue.key,
        event: existing ? 'criterion-changed' : 'criterion-added',
        at: now,
        payload: { criterionId: criterion.id, version },
      });
    }
  }
  return stored;
}

/** Re-détecte les perforations d'un ticket : un critère a changé (§8.2). */
export async function refreshPerforations(
  deps: Deps,
  issue: IssueRef,
  now: string,
): Promise<number> {
  const scope = { scopeType: 'ticket' as const, scope: issue.key };
  const criteria = await deps.store.listCriteria(scope);
  const links = (await Promise.all(criteria.map((criterion) => deps.store.listLinks(criterion.id)))).flat();
  const verifications = await deps.store.listVerifications(scope);
  const versions = (
    await Promise.all(criteria.map((criterion) => deps.store.listVersions(criterion.id)))
  ).flat();
  const perforations = detectPerforations({ criteria, versions, links, verifications, now });
  for (const perforation of perforations) await deps.store.putPerforation(perforation);
  return perforations.length;
}

/** Le trigger : un ticket modifié. */
export async function onJiraEvent(payload: Record<string, unknown>, deps: Deps): Promise<void> {
  const key = String(payload['issueKey'] ?? payload['issueId'] ?? '');
  if (!key) {
    deps.log.log('warn', 'trigger jira:updated:issue sans ticket');
    return;
  }
  const issue = await deps.jira.getIssue(key);
  if (!issue) {
    deps.log.log('warn', 'trigger jira:updated:issue : ticket illisible', { issueKey: key });
    return;
  }
  const materials = materialsOf(issue);
  for (const signal of flagSecrets(materials)) {
    deps.log.log('warn', 'matériau écarté : il porte un secret', {
      ticketKey: signal.ticketKey,
      origin: signal.origin,
      secretFlag: signal.secretFlag,
    });
  }
  const criteria = await storeCriteria(deps, issue, materials);
  const perforations = await refreshPerforations(deps, issue, deps.clock.now());
  deps.log.log('info', 'trigger jira:updated:issue traité', {
    issueKey: issue.key,
    criteria: criteria.length,
    perforations,
  });
  await deps.queue.publish({ scope: issue.key, scopeType: 'ticket', mode: 'measures' });
}

/** L'origine d'un critère extrait, pour la piste d'audit. */
export function originOf(extracted: ExtractedCriterion): CriterionOrigin {
  return extracted.origin;
}
