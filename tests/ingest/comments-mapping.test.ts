/**
 * §7 formes 3, 5 et 7 — les commentaires Jira comme actes de vérification.
 *
 * Trois formes, trois forces, et une seule table de force
 * (`DEFAULT_STRENGTH_BY_FORM`) : un commentaire est **déclaré** (une
 * affirmation), une checklist cochée est une **vérification tracée** (déclarée),
 * un commentaire qui cite un **artefact** est une **attestation tierce**
 * (attestée). Jamais l'inverse : une affirmation n'est pas une preuve (§7).
 */
import { describe, expect, it } from 'vitest';
import type { IssueComment } from '../../src/ports.js';
import { DEFAULT_STRENGTH_BY_FORM } from '../../src/defaults.js';
import { toVerification, toVerifications } from '../../src/ingest/comments-mapping.js';

/** Un commentaire de test, complet. */
function comment(over: Partial<IssueComment> = {}): IssueComment {
  return {
    id: '90001',
    issueId: '10001',
    body: 'Vérifié à la main.',
    createdAt: '2026-11-11T10:00:00.000Z',
    authorRef: 'user-1',
    ...over,
  };
}

describe('commentaire → acte de vérification (§7)', () => {
  it('§24.2 — un commentaire est compté « déclarée »', () => {
    const act = toVerification(comment());
    expect(act?.form).toBe('declaration');
    expect(act?.strength).toBe('declared');
    expect(act?.strength).toBe(DEFAULT_STRENGTH_BY_FORM.declaration);
  });

  it('§24.2 — une attestation (artefact cité) est comptée « attestée »', () => {
    const act = toVerification(
      comment({ body: 'Vérifié, rapport de scan : https://ci.example/scan-42' }),
    );
    expect(act?.form).toBe('third-party');
    expect(act?.strength).toBe('attested');
    expect(act?.strength).toBe(DEFAULT_STRENGTH_BY_FORM['third-party']);
  });

  it('§7 forme 5 — un commentaire daté + checklist exécutée est une vérification tracée', () => {
    const act = toVerification(
      comment({ body: '- [x] le scénario de reprise passe\n- [x] le délai reste sous 2 s' }),
    );
    expect(act?.form).toBe('traced-manual');
    expect(act?.strength).toBe('declared');
    expect(act?.name).toContain('le scénario de reprise passe');
  });

  it('§18 — l’artefact est référencé, jamais recopié', () => {
    const act = toVerification(
      comment({ body: 'Vérifié, rapport : https://ci.example/scan-42' }),
    );
    expect(act?.artifactRef).toBe('https://ci.example/scan-42');
  });

  it('§7 — un commentaire qui ne prouve rien ne devient pas un acte', () => {
    expect(toVerification(comment({ body: 'Je regarde demain.' }))).toBeNull();
    expect(toVerification(comment({ body: '' }))).toBeNull();
  });

  it('§18 — un commentaire sans date est écarté : on n’invente jamais de date', () => {
    const reports: string[] = [];
    const act = toVerification(comment({ createdAt: '' }), {
      report: (message) => reports.push(message),
    });
    expect(act).toBeNull();
    expect(reports.join(' ')).toMatch(/date/i);
  });

  it('§7 — la référence source est le commentaire, dans son ticket', () => {
    const act = toVerification(comment());
    expect(act?.sourceRef).toBe('comment/10001/90001');
    expect(act?.sourceSystem).toBe('jira');
    expect(act?.issueId).toBe('10001');
  });

  it('§5 — l’auteur est une référence d’audit, jamais un score', () => {
    expect(toVerification(comment())?.authorRef).toBe('user-1');
  });

  it('§7 — un commentaire qui dit l’échec est un acte en échec', () => {
    const act = toVerification(comment({ body: 'Échec : la reprise ne fonctionne pas.' }));
    expect(act?.status).toBe('failed');
  });

  it('une liste de commentaires donne une liste d’actes, sans les objets écartés', () => {
    const acts = toVerifications([
      comment(),
      comment({ id: '90002', body: 'Je regarde demain.' }),
      comment({ id: '90003', createdAt: '' }),
    ]);
    expect(acts).toHaveLength(1);
    expect(acts[0].sourceRef).toBe('comment/10001/90001');
  });

  it('la clé du ticket est reprise quand on la connaît', () => {
    expect(toVerification(comment(), { ticketKey: 'PROJ-12' })?.ticketKey).toBe('PROJ-12');
  });
});
