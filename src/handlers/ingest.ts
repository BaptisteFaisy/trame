/**
 * Web trigger `ci-results` (§18) : le pont signé depuis les pipelines.
 *
 * C'est la source de la force « machine » (§7, forme 1) : un test exécuté dans
 * une CI et poussé ici devient un acte de vérification daté. La signature est
 * vérifiée AVANT toute lecture : une charge non signée est refusée, jamais
 * interprétée.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Deps } from '../ports';
import type { Verification } from '../types';

/** Requête du web trigger (urlFormat v2) : corps brut, pour la signature. */
export interface CiWebRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  query: Record<string, string>;
}

export interface CiWebResponse {
  status: number;
  body: Record<string, unknown>;
}

/** En-tête qui porte la signature du corps. */
export const SIGNATURE_HEADER = 'x-trame-signature';

/** Une exécution de test telle que la pousse un pipeline. */
export interface CiTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'ignored';
  finishedAt: string;
  ticketKey?: string;
  durationMs?: number;
}

/** La charge utile acceptée par le pont. */
export interface CiPayload {
  repository: string;
  buildId: string;
  zone?: string;
  tests: CiTestResult[];
}

/** La signature attendue : HMAC-SHA256 du corps, en hexadécimal. */
export function expectedSignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

/** Comparaison à temps constant : la signature ne se devine pas. */
export function signatureMatches(body: string, signature: string, secret: string): boolean {
  const expected = expectedSignature(body, secret);
  const left = Buffer.from(expected, 'utf8');
  const right = Buffer.from(signature ?? '', 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Lit la charge utile : un JSON invalide est écarté, jamais deviné. */
export function parsePayload(body: string): CiPayload | null {
  try {
    const parsed = JSON.parse(body) as Partial<CiPayload>;
    if (typeof parsed.repository !== 'string' || !Array.isArray(parsed.tests)) return null;
    return {
      repository: parsed.repository,
      buildId: String(parsed.buildId ?? ''),
      zone: parsed.zone,
      tests: parsed.tests.filter((test) => typeof test?.name === 'string'),
    };
  } catch {
    return null;
  }
}

/** Les actes de vérification que la charge utile représente. */
export function toVerifications(payload: CiPayload): Verification[] {
  return payload.tests.map((test) => ({
    id: `ver_${payload.buildId}_${test.name}`,
    form: 'automated-test' as const,
    sourceSystem: 'pipeline' as const,
    sourceRef: `pipeline/${payload.buildId}/${test.name}`,
    ticketKey: test.ticketKey,
    name: test.name,
    executedAt: test.finishedAt,
    status: test.status,
    strength: 'machine' as const,
    zone: payload.zone,
  }));
}

/**
 * Le pont : on vérifie la signature, on convertit, on met en file le recalcul.
 */
export async function handleCiResults(request: CiWebRequest, deps: Deps): Promise<CiWebResponse> {
  const secret = process.env['TRAME_WEBHOOK_SECRET'] ?? '';
  if (!secret) {
    deps.log.log('warn', 'webtrigger ci-results : aucun secret configuré');
    return { status: 503, body: { error: 'not-configured' } };
  }
  const signature = request.headers[SIGNATURE_HEADER] ?? request.headers[SIGNATURE_HEADER.toLowerCase()] ?? '';
  if (!signatureMatches(request.body, signature, secret)) {
    deps.log.log('warn', 'webtrigger ci-results : signature invalide');
    return { status: 401, body: { error: 'invalid-signature' } };
  }
  const payload = parsePayload(request.body);
  if (!payload) {
    return { status: 400, body: { error: 'invalid-payload' } };
  }
  const verifications = toVerifications(payload);
  for (const verification of verifications) await deps.store.putVerification(verification);
  await deps.queue.publish({
    scope: payload.repository,
    scopeType: 'project',
    mode: 'links',
  });
  deps.log.log('info', 'webtrigger ci-results : actes reçus', {
    repository: payload.repository,
    build: payload.buildId,
    count: verifications.length,
  });
  return { status: 202, body: { accepted: verifications.length } };
}
