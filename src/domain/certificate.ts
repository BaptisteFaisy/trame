/**
 * The weave certificate (§12.5): a dated page, opposable to an auditor or a
 * client, that says what was verified — at which strength, by which act, on
 * which date — and, just as explicitly, what was NOT.
 *
 * A certificate without its gaps is a compliment, not a proof: the `notCovered`
 * list is the heart of the document.
 *
 * Pure: the builder takes entities, it reads nothing.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type {
  Certificate,
  CertificateLine,
  Coverage,
  Criterion,
  Dangling,
  Link,
  Perforation,
  Verification,
} from '../types.js';

export interface CertificateInput {
  scope: string;
  scopeType: Certificate['scopeType'];
  issuedAt: string;
  coverage: Coverage;
  criteria: readonly Criterion[];
  verifications: readonly Verification[];
  links: readonly Link[];
  perforations?: readonly Perforation[];
  dangling?: readonly Dangling[];
  /** The page written in Confluence, when it was written. */
  confluencePageRef?: string;
}

/** The lines of the certificate: one per woven criterion, ticket by ticket. */
export function certificateLines(
  criteria: readonly Criterion[],
  verifications: readonly Verification[],
  links: readonly Link[],
): CertificateLine[] {
  const acts = new Map(verifications.map((act) => [act.id, act]));
  const lines: CertificateLine[] = [];
  for (const link of links) {
    if (link.rejectedAt) continue;
    const criterion = criteria.find((row) => row.id === link.criterionId);
    const act = acts.get(link.verificationId);
    if (!criterion || !act || act.disabledAt) continue;
    lines.push({
      criterionKey: criterion.criterionKey,
      ticketKey: criterion.ticketKey,
      form: act.form,
      strength: act.strength,
      executedAt: act.executedAt,
      linkPath: link.path,
      actorRef: act.authorRef,
    });
  }
  return lines.sort((left, right) => {
    if (left.ticketKey !== right.ticketKey) return left.ticketKey.localeCompare(right.ticketKey);
    return left.criterionKey.localeCompare(right.criterionKey);
  });
}

/** The criteria that no act covers any more: the explicit holes of the page. */
export function notCovered(
  criteria: readonly Criterion[],
  verifications: readonly Verification[],
  links: readonly Link[],
): Criterion[] {
  const acts = new Map(verifications.map((act) => [act.id, act]));
  return criteria.filter((criterion) => {
    if (!criterion.falsifiable) return false;
    return !links.some((link) => {
      if (link.criterionId !== criterion.id || link.rejectedAt) return false;
      const act = acts.get(link.verificationId);
      return Boolean(act && !act.disabledAt);
    });
  });
}

/** The criteria that nothing can verify: counted apart, never as coverage. */
export function unfalsifiable(criteria: readonly Criterion[]): Criterion[] {
  return criteria.filter((criterion) => !criterion.falsifiable);
}

/** Builds the certificate. */
export function buildCertificate(input: CertificateInput): Certificate {
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    issuedAt: input.issuedAt,
    coverage: input.coverage,
    verifications: certificateLines(input.criteria, input.verifications, input.links),
    perforations: [...(input.perforations ?? [])],
    dangling: [...(input.dangling ?? [])],
    unfalsifiable: unfalsifiable(input.criteria),
    notCovered: notCovered(input.criteria, input.verifications, input.links),
    confluencePageRef: input.confluencePageRef,
  };
}

/** The readable page of the certificate, as published in Confluence (§12.5). */
export function certificateToMarkdown(certificate: Certificate): string {
  const lines: string[] = [];
  lines.push(`# Certificat de trame — ${certificate.scope}`);
  lines.push('');
  lines.push(`Périmètre : ${certificate.scope} (${certificate.scopeType})`);
  lines.push(`Date : ${certificate.issuedAt}`);
  lines.push('');
  lines.push('## Couverture');
  lines.push('');
  lines.push(`- Critères vérifiables : ${certificate.coverage.criteriaFalsifiable} / ${certificate.coverage.criteriaTotal}`);
  lines.push(`- Couverts (liaison déclarée) : ${certificate.coverage.coveredDeclared}`);
  lines.push(`- Couverts provisoirement (liaison dérivée, non comptée) : ${certificate.coverage.coveredProvisional}`);
  lines.push(`- Force : ${certificate.coverage.byStrength.machine} machine, ${certificate.coverage.byStrength.attested} attestée, ${certificate.coverage.byStrength.declared} déclarée`);
  lines.push(`- Fraîcheur : ${certificate.coverage.byFreshness.current} à jour, ${certificate.coverage.byFreshness.stale} périmée`);
  lines.push(`- Prouvés (fort + à jour + déclaré) : ${certificate.coverage.proven}`);
  lines.push('');
  lines.push('## Actes de vérification');
  lines.push('');
  lines.push('| Ticket | Critère | Forme | Force | Date | Liaison |');
  lines.push('|---|---|---|---|---|---|');
  for (const line of certificate.verifications) {
    lines.push(
      `| ${line.ticketKey} | ${line.criterionKey} | ${line.form} | ${line.strength} | ${line.executedAt} | ${line.linkPath} |`,
    );
  }
  lines.push('');
  lines.push('## Perforations ouvertes');
  lines.push('');
  if (certificate.perforations.length === 0) lines.push('- aucune');
  for (const perforation of certificate.perforations) {
    lines.push(`- ${perforation.ticketKey}/${perforation.criterionKey} : modifié le ${perforation.changedAt}, vérifié le ${perforation.verifiedAt} (${perforation.ageDays} jours, ${perforation.klass})`);
  }
  lines.push('');
  lines.push('## Fils détendus ouverts');
  lines.push('');
  if (certificate.dangling.length === 0) lines.push('- aucun');
  for (const thread of certificate.dangling) {
    lines.push(`- ${thread.verificationName} : ${thread.reason} (${thread.impact} maille(s) retirée(s))`);
  }
  lines.push('');
  lines.push('## Critères infalsifiables');
  lines.push('');
  if (certificate.unfalsifiable.length === 0) lines.push('- aucun');
  for (const criterion of certificate.unfalsifiable) {
    lines.push(`- ${criterion.ticketKey}/${criterion.criterionKey} : ${criterion.unfalsifiableReason ?? 'non vérifiable'}`);
  }
  lines.push('');
  lines.push('## Ce qui n’est PAS couvert');
  lines.push('');
  if (certificate.notCovered.length === 0) lines.push('- aucun critère vérifiable sans acte de vérification');
  for (const criterion of certificate.notCovered) {
    lines.push(`- ${criterion.ticketKey}/${criterion.criterionKey} : ${criterion.text}`);
  }
  lines.push('');
  return lines.join('\n');
}
