/**
 * `publish-certificate` — la page Confluence du certificat (§12.5).
 */
import { describe, expect, it } from 'vitest';
import { run } from '../../src/actions/publish-certificate.js';
import { buildScenario } from '../helpers/index.js';
import { ACTOR, seedDemoProject } from './fixtures.js';

interface PublishResponse {
  pageRef: string;
  title: string;
  spaceKey: string;
  characters: number;
  notCoveredCount: number;
  error?: string;
}

describe('publish-certificate — §24.14 la page Confluence est générée', () => {
  it('§24.14 — la page est publiée et porte les manques', async () => {
    const { deps, store, confluence } = await buildScenario();
    await seedDemoProject(store);
    const out = (await run(
      deps,
      { scope: 'Sprint 42', scopeType: 'sprint', spaceKey: 'TRA' },
      ACTOR,
    )) as PublishResponse;
    expect(out.error).toBeUndefined();
    expect(out.pageRef).toBe('TRA/Certificat de trame — Sprint 42');
    expect(out.notCoveredCount).toBe(3);
    expect(confluence.published).toHaveLength(1);
    expect(confluence.published[0].body).toContain('Ce qui n’est PAS couvert');
  });

  it('§24.14 — une publication impossible est un refus, pas une page vide', async () => {
    const { deps, confluence } = await buildScenario();
    confluence.denyRead();
    const out = (await run(
      deps,
      { scope: 'TRAME-1', scopeType: 'ticket', spaceKey: 'TRA' },
      ACTOR,
    )) as PublishResponse;
    expect(out.error).toBe('publication impossible');
    expect(out.pageRef).toBeUndefined();
  });
});