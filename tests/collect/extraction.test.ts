/**
 * Tests de l'extraction des critères sur les six origines du §6.
 *
 * Chaque test porte le numéro du point de recette qu'il couvre (§24 ou §6) :
 * « §6.1 le champ donne AC-1 dans l'ordre ».
 *
 * Ce que ces tests prouvent :
 * - les six gîtes sont lus (§6.1 à §6.6) ;
 * - la numérotation est stable et sans trou (§6, §24.18) ;
 * - un doublon est signalé sans être double-compté (§23) ;
 * - un critère infalsifiable ou à moitié écrit est marqué, pas jeté (§8.4,
 *   §23) ;
 * - une pièce jointe n'est jamais décodée (§6.6).
 */
import { describe, expect, it } from 'vitest';
import { COLLECTORS, extractAll, flagSecrets, ORIGIN_TRUST_ORDER } from '../../src/collect/index.js';
import { attachmentReference } from '../../src/collect/attachment.js';
import type { CollectInput, ExtractedCriterion } from '../../src/collect/types.js';

const TICKET = 'PROJ-12';
const ISSUE = '10001';
const DATE = '2026-11-12T08:00:00.000Z';

/** Un matériau d'extraction, avec les valeurs par défaut du lot. */
function material(over: Partial<CollectInput> & Pick<CollectInput, 'origin'>): CollectInput {
  return {
    issueId: ISSUE,
    ticketKey: TICKET,
    rawText: '',
    updatedAt: DATE,
    ...over,
  };
}

/** Les textes des critères, dans l'ordre. */
function textsOf(criteria: ExtractedCriterion[]): string[] {
  return criteria.map((criterion) => criterion.text);
}

describe('§6.1 le champ « critères d’acceptation »', () => {
  const field = material({
    origin: 'acceptance-field',
    rawText: [
      "Critères d'acceptation",
      "- Le système doit refuser un mot de passe vide",
      '[ ] Le journal doit conserver les refus pendant 30 jours',
      '2. L’export CSV respecte la colonne « date »',
      '',
    ].join('\n'),
  });

  it('§6.1 le champ donne AC-1, AC-2, AC-3 dans l’ordre', () => {
    const criteria = COLLECTORS['acceptance-field'](field);
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-2', 'AC-3']);
    expect(textsOf(criteria)).toEqual([
      'Le système doit refuser un mot de passe vide',
      'Le journal doit conserver les refus pendant 30 jours',
      'L’export CSV respecte la colonne « date »',
    ]);
  });

  it('§6.1 le champ ignore la ligne vide et la ligne de titre', () => {
    const criteria = COLLECTORS['acceptance-field'](field);
    expect(textsOf(criteria)).not.toContain("Critères d'acceptation");
    expect(criteria.every((criterion) => criterion.text.length > 0)).toBe(true);
  });

  it('§6.1 le champ vide ne donne aucun critère', () => {
    expect(COLLECTORS['acceptance-field'](material({ origin: 'acceptance-field' }))).toEqual([]);
  });
});

describe('§6.2 la description du ticket', () => {
  const description = material({
    origin: 'description',
    rawText: [
      '## Contexte',
      'Ce ticket comporte un peu de contexte, pas une exigence.',
      '',
      '- Le système doit refuser un mot de passe vide',
      '* [ ] Le journal doit conserver les refus pendant 30 jours',
      '',
      '```',
      'Le code exemple doit compiler',
      '```',
      '',
      'Le tableau de bord doit rester lisible sur un écran 1024 px.',
    ].join('\n'),
  });

  it('§6.2 la description garde les puces et reconstruit la numérotation', () => {
    const criteria = COLLECTORS.description(description);
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-2', 'AC-3']);
    expect(textsOf(criteria)).toEqual([
      'Le système doit refuser un mot de passe vide',
      'Le journal doit conserver les refus pendant 30 jours',
      'Le tableau de bord doit rester lisible sur un écran 1024 px.',
    ]);
  });

  it('§6.2 la description ignore une phrase sans verbe d’exigence', () => {
    const criteria = COLLECTORS.description(description);
    expect(textsOf(criteria)).not.toContain('Ce ticket comporte un peu de contexte, pas une exigence.');
  });

  it('§6.2 la description ignore les titres et les blocs de code', () => {
    const criteria = COLLECTORS.description(description);
    expect(textsOf(criteria)).not.toContain('Contexte');
    expect(textsOf(criteria)).not.toContain('Le code exemple doit compiler');
  });

  it('§6.2 la description accepte les autres verbes d’exigence', () => {
    const criteria = COLLECTORS.description(
      material({
        origin: 'description',
        rawText: [
          '- Le client should receive a confirmation e-mail',
          '- Le service shall refuser une commande annulée',
          "- Le robot est capable de signaler une panne",
          "- Le serveur refuse une requête sans jeton",
        ].join('\n'),
      }),
    );
    expect(criteria).toHaveLength(4);
  });
});

describe('§6.3 le tableau de critères', () => {
  const table = material({
    origin: 'table',
    table: {
      columns: ['Mot de passe refusé', '', 'Export CSV au 95ᵉ centile'],
      rows: [
        ['cas nominal', 'cas vide', 'cas lent'],
        ['cas limite', 'cas fusionné'],
      ],
    },
  });

  it('§6.3 le tableau donne un critère par colonne, les lignes sont des cas', () => {
    const criteria = COLLECTORS.table(table);
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-3']);
    expect(textsOf(criteria)).toEqual(['Mot de passe refusé', 'Export CSV au 95ᵉ centile']);
  });

  it('§6.3 une colonne vide ne donne pas de critère', () => {
    const criteria = COLLECTORS.table(table);
    expect(criteria).toHaveLength(2);
    expect(textsOf(criteria)).not.toContain('');
  });

  it('§6.3 les cellules fusionnées sont tolérées', () => {
    const criteria = COLLECTORS.table(table);
    expect(criteria.every((criterion) => criterion.text.length > 0)).toBe(true);
  });
});

describe('§6.4 la page Confluence', () => {
  const page = material({
    origin: 'confluence-page',
    pageId: 'PAGE-7',
    rawText: [
      '# Recette',
      '- [x] Le système doit refuser un mot de passe vide',
      '- [ ] Le journal doit conserver les refus pendant 30 jours',
      '- Une simple puce de contexte',
    ].join('\n'),
  });

  it('§6.4 la page donne un critère par case, cochée ou non', () => {
    const criteria = COLLECTORS['confluence-page'](page);
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-2']);
    expect(textsOf(criteria)).toEqual([
      'Le système doit refuser un mot de passe vide',
      'Le journal doit conserver les refus pendant 30 jours',
    ]);
  });

  it('§6.4 la page est une source indirecte : son identifiant entre dans la clé', () => {
    const criteria = COLLECTORS['confluence-page'](page);
    expect(criteria[0].stableKey).toContain('confluence-page');
    expect(criteria[0].stableKey).toContain('PAGE-7');
  });
});

describe('§6.5 le ticket de test dédié', () => {
  it('§6.5 le titre donne le critère, le résultat ne fait que documenter', () => {
    const criteria = COLLECTORS['test-ticket'](
      material({
        origin: 'test-ticket',
        sourceId: '10002',
        rawText: 'Le mot de passe vide doit être refusé',
        resultText: 'OK — exécuté le 12/11, 3 cas',
      }),
    );
    expect(criteria).toHaveLength(1);
    expect(criteria[0].text).toBe('Le mot de passe vide doit être refusé');
    expect(criteria[0].documentation).toContain('OK');
  });

  it('§6.5 un titre vague est détecté mais marqué non faisable', () => {
    const criteria = COLLECTORS['test-ticket'](
      material({ origin: 'test-ticket', sourceId: '10003', rawText: 'test recette' }),
    );
    expect(criteria).toHaveLength(1);
    expect(criteria[0].unfalsifiableHint).toContain('sans exigence formulée');
  });
});

describe('§6.6 la pièce jointe', () => {
  const attachment = material({
    origin: 'attachment',
    attachmentRef: 'cahier-de-tests.pdf',
    rawText: 'Le système doit refuser un mot de passe vide',
  });

  it('§6.6 la pièce jointe n’est pas décodée', () => {
    expect(COLLECTORS.attachment(attachment)).toEqual([]);
  });

  it('§6.6 la référence déclarée est renvoyée telle quelle', () => {
    expect(attachmentReference(attachment)).toBe('cahier-de-tests.pdf');
    expect(attachmentReference(material({ origin: 'attachment' }))).toBe('');
  });
});

describe('§6 l’extraction multi-origine', () => {
  it('§6 les six origines sont enregistrées', () => {
    expect(Object.keys(COLLECTORS).sort()).toEqual([
      'acceptance-field',
      'attachment',
      'confluence-page',
      'description',
      'table',
      'test-ticket',
    ]);
  });

  it('§6 la numérotation est stable et sans trou sur un ticket', () => {
    const criteria = extractAll([
      material({ origin: 'acceptance-field', rawText: '- Le système doit refuser un mot de passe vide' }),
      material({
        origin: 'description',
        rawText: '- Le journal doit conserver les refus pendant 30 jours',
      }),
      material({
        origin: 'table',
        table: { columns: ['Export CSV disponible'], rows: [] },
      }),
    ]);
    expect(criteria.map((criterion) => criterion.criterionKey)).toEqual(['AC-1', 'AC-2', 'AC-3']);
  });

  it('§6 l’ordre de confiance est le champ, la description, le tableau, le test, Confluence, la pièce', () => {
    expect(ORIGIN_TRUST_ORDER).toEqual([
      'acceptance-field',
      'description',
      'table',
      'test-ticket',
      'confluence-page',
      'attachment',
    ]);
  });
});

describe('§23 les doublons', () => {
  const duplicated = 'Le système doit refuser un mot de passe vide';

  it('§23 un doublon est signalé sans être double-compté', () => {
    const criteria = extractAll([
      material({ origin: 'acceptance-field', rawText: `- ${duplicated}` }),
      material({ origin: 'description', rawText: `- ${duplicated}` }),
    ]);
    expect(criteria).toHaveLength(1);
    expect(criteria[0].origin).toBe('acceptance-field');
    expect(criteria[0].duplicateRefs).toHaveLength(1);
  });

  it('§23 le doublon écarté garde une clé stable distincte', () => {
    const criteria = extractAll([
      material({ origin: 'acceptance-field', rawText: `- ${duplicated}` }),
      material({ origin: 'description', rawText: `- ${duplicated}` }),
    ]);
    const kept = criteria[0].stableKey;
    expect(criteria[0].duplicateRefs?.[0]).not.toBe(kept);
  });

  it('§23 deux tickets distincts ne sont pas dédoublonnés entre eux', () => {
    const criteria = extractAll([
      material({ origin: 'acceptance-field', rawText: `- ${duplicated}` }),
      material({
        origin: 'acceptance-field',
        issueId: '10002',
        ticketKey: 'PROJ-13',
        rawText: `- ${duplicated}`,
      }),
    ]);
    expect(criteria).toHaveLength(2);
  });
});

describe('§8.4 et §23 les critères infalsifiables', () => {
  it('§8.4 un adjectif non vérifiable est marqué d’un indice', () => {
    const criteria = extractAll([
      material({
        origin: 'acceptance-field',
        rawText: '- Le tableau de bord doit être rapide sur un écran 1024 px',
      }),
    ]);
    expect(criteria[0].unfalsifiableHint).toContain('rapide');
  });

  it('§23 un texte à moitié écrit est marqué, pas jeté', () => {
    const criteria = extractAll([
      material({ origin: 'acceptance-field', rawText: '- Le système doit' }),
    ]);
    expect(criteria).toHaveLength(1);
    expect(criteria[0].unfalsifiableHint).toContain('à moitié écrit');
  });

  it('§23 un texte vide est ignoré', () => {
    const criteria = extractAll([material({ origin: 'acceptance-field', rawText: '-   \n-  ' })]);
    expect(criteria).toEqual([]);
  });
});

describe('§5 et §24.20 les secrets', () => {
  const withKey = '- Le système doit refuser le jeton AKIAIOSFODNN7EXAMPLE';

  it('§24.20 un critère contenant une clé n’est pas retourné', () => {
    const criteria = extractAll([material({ origin: 'acceptance-field', rawText: withKey })]);
    expect(criteria).toEqual([]);
  });

  it('§24.20 le secret est signalé par sa famille, jamais par sa valeur', () => {
    const signals = flagSecrets([material({ origin: 'acceptance-field', rawText: withKey })]);
    expect(signals).toHaveLength(1);
    expect(signals[0].secretFlag).toContain('clé AWS');
    expect(signals[0].secretFlag).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });
});
