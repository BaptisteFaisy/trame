/**
 * `get-certificate` — le certificat de trame, avec ses manques (§12.5).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/get-certificate.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface CertificateResponse {
  issuedAt: string;
  certificate: {
    scope: string;
    notCovered: { ticketKey: string; criterionKey: string; text: string }[];
    unfalsifiable: { ticketKey: string; criterionKey: string }[];
    verifications: unknown[];
    perforations: unknown[];
    dangling: unknown[];
  };
  markdown: string;
  notCoveredCount: number;
  error?: string;
}

describe('get-certificate — §24.14 le certificat déclare les manques', () => {
  it('§24.14 — le certificat liste explicitement ce qui n’est pas couvert', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint' },
      ACTOR,
    )) as CertificateResponse;
    expect(out.error).toBeUndefined();
    expect(out.notCoveredCount).toBe(3);
    const keys = out.certificate.notCovered.map((row) => `${row.ticketKey}/${row.criterionKey}`);
    expect(keys.sort()).toEqual(['TRAME-101/AC-4', 'TRAME-104/AC-1', 'TRAME-104/AC-4']);
  });

  it('§24.14 — la page Confluence porte les manques, et elle est datée', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint' },
      ACTOR,
    )) as CertificateResponse;
    expect(out.markdown).toContain('Ce qui n’est PAS couvert');
    expect(out.markdown).toContain('TRAME-101/AC-4');
    expect(out.markdown).toContain('Sprint 42');
    expect(out.issuedAt).toBe('2026-11-12T09:00:00.000Z');
  });

  it('§24.14 — les critères infalsifiables sont comptés à part, pas comme des manques', async () => {
    const { deps, store } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint' },
      ACTOR,
    )) as CertificateResponse;
    expect(out.certificate.unfalsifiable.length).toBe(4);
    const missing = out.certificate.notCovered.map((row) => row.criterionKey);
    expect(missing).not.toContain('AC-3');
  });
});