import type { ActorContext, Deps } from '../ports';
import { buildCertificate, certificateToMarkdown } from '../domain/certificate';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
  readText,
  refusal,
} from './common';

/**
 * Action interne : génère la page Confluence du certificat (§12.5).
 *
 * La page est **opposable** : datée, scopée, elle liste ce qui a été vérifié
 * — à quelle force, par quel acte, à quelle date — et, tout aussi
 * explicitement, ce qui ne l'est pas (`notCovered`). Elle est publiée par le
 * port Confluence ; la référence de page revient, jamais une copie de preuve.
 *
 * Entrées : scope, spaceKey — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = readScope(payload);
  if (!read.ok) return read.refusal;
  const spaceKey = readText(payload.spaceKey) || 'TRA';
  const data = await loadScope(deps, read.request);
  const coverage = await coverageOf(deps, data);
  const issuedAt = deps.clock.now();
  const certificate = buildCertificate({
    scope: read.request.scope,
    scopeType: read.request.scopeType,
    issuedAt,
    coverage,
    criteria: data.criteria,
    verifications: data.verifications,
    links: data.links,
    perforations: data.perforations,
    dangling: data.dangling,
  });
  const title = `Certificat de trame — ${read.request.scope}`;
  const markdown = certificateToMarkdown(certificate);
  const pageRef = await deps.confluence.publishCertificate(spaceKey, title, markdown);
  if (!pageRef) {
    return refusal(
      'publication impossible',
      `Confluence n'a pas écrit la page « ${title} » dans l'espace ${spaceKey} (§12.5)`,
    );
  }
  const figures = figuresOf(coverage);
  return {
    ...envelope(read.request, issuedAt),
    pageRef,
    title,
    spaceKey,
    characters: markdown.length,
    notCoveredCount: certificate.notCovered.length,
    figures,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.dated-scope']),
  };
}