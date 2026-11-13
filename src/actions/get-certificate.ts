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
} from './common';

/**
 * Contenu du certificat de trame, destiné à Confluence (§12.5).
 *
 * Un certificat sans ses manques est un compliment, pas une preuve : la liste
 * `notCovered` — les critères vérifiables qu'aucun acte ne couvre plus — est
 * le cœur du document. Le certificat porte aussi les perforations, les fils
 * détendus, les critères infalsifiables, et la couverture avec ses trois axes
 * (§24.14).
 *
 * L'outil renvoie le certificat structuré **et** la page markdown prête à
 * publier ; la publication elle-même est l'action interne
 * `publish-certificate`.
 *
 * Entrées : scope — lot L8.
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
  const figures = figuresOf(coverage);
  return {
    ...envelope(read.request, issuedAt),
    issuedAt,
    certificate,
    markdown: certificateToMarkdown(certificate),
    /** Le cœur du certificat : ce qui n'est PAS couvert (§24.14). */
    notCoveredCount: certificate.notCovered.length,
    figures,
    blindSpots: coverage.blindSpots,
    messages: messagesOf(deps, figures, ['msg.dated-scope']),
  };
}