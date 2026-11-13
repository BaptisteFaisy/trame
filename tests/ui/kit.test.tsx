/**
 * La façade UI Kit 2 : les briques d'affichage écrites une seule fois.
 *
 * `@forge/react` est simulé : chaque primitive rend un élément portant son
 * nom, ce qui rend l'arbre inspectable sans navigateur. Le rendu réel est
 * vérifié à part, dans Jira — un test de rendu HTML ne prouve rien de
 * l'affichage, il prouve la forme.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@forge/react', async () => {
  const React = await import('react');
  const names = [
    'Badge', 'Box', 'Button', 'Checkbox', 'DynamicTable', 'Form', 'FormFooter',
    'FormSection', 'Heading', 'Label', 'Link', 'List', 'ListItem', 'Lozenge',
    'ProgressBar', 'RadioGroup', 'SectionMessage', 'Select', 'Spinner', 'Stack',
    'Tab', 'TabList', 'TabPanel', 'Tabs', 'Text', 'TextArea', 'Textfield',
  ];
  const mod: Record<string, unknown> = { default: { render: () => undefined } };
  for (const name of names) {
    // Chaque primitive rend son nom, ses enfants, son `emptyView`, et la
    // trace JSON de ses autres props : l'arbre reste inspectable.
    mod[name] = (props: Record<string, unknown>) => {
      const { children, emptyView, ...rest } = props;
      const trace = JSON.stringify(rest, (_key, value) =>
        typeof value === 'function' ? undefined : value,
      );
      const kids: React.ReactNode[] = [
        (children ?? null) as React.ReactNode,
        (emptyView ?? null) as React.ReactNode,
        trace,
      ];
      return React.createElement(name, null, ...kids);
    };
  }
  return mod;
});

import {
  FigureView,
  RegistryTable,
  StateBadge,
  motifGlyph,
} from '../../src/ui/kit.js';
import type { CodedState, Figure, Motif, RegisterRow, TableHead } from '../../src/viewmodel/common.js';

const MOTIFS: Motif[] = ['solid', 'dashed', 'dotted', 'crossed', 'empty', 'striped'];

describe('l’état double-codé (§22)', () => {
  it('chaque motif a un trait qui lui est propre', () => {
    const glyphs = MOTIFS.map((motif) => motifGlyph(motif));
    expect(new Set(glyphs).size).toBe(MOTIFS.length);
    for (const glyph of glyphs) expect(glyph.length).toBeGreaterThan(0);
  });

  it('le badge porte le trait ET le mot — jamais la couleur seule', () => {
    const state: CodedState = { motif: 'crossed', word: 'perforé' };
    const html = renderToStaticMarkup(<StateBadge state={state} />);
    expect(html).toContain(motifGlyph('crossed'));
    expect(html).toContain('perforé');
  });
});

describe('le registre', () => {
  const head: TableHead = { cells: ['Ticket', 'Critère'] };
  const rows: RegisterRow[] = [
    { cells: ['TRAME-1', 'AC-2'], state: { motif: 'crossed', word: 'perforé' } },
    { cells: ['TRAME-1', 'AC-3'], state: { motif: 'empty', word: 'trou' } },
  ];

  it('rend l’entête, chaque ligne et son mot', () => {
    const html = renderToStaticMarkup(
      <RegistryTable lang="fr" head={head} rows={rows} caption="Perforations" empty="aucune" />,
    );
    expect(html).toContain('Ticket');
    expect(html).toContain('AC-2');
    expect(html).toContain('perforé');
    expect(html).toContain('trou');
  });

  it('un registre sans ligne dit le mot vide', () => {
    const html = renderToStaticMarkup(
      <RegistryTable lang="fr" head={head} rows={[]} caption="Trous" empty="aucun trou" />,
    );
    expect(html).toContain('aucun trou');
  });
});

describe('la figure (§24.16)', () => {
  it('porte toujours son effectif', () => {
    const figure: Figure = {
      label: 'couverts',
      count: 13,
      total: 18,
      percent: 72,
      conclusion: 'conclusive',
    };
    const html = renderToStaticMarkup(<FigureView lang="fr" figure={figure} />);
    expect(html).toContain('13 / 18');
    expect(html).toContain('72 %');
  });

  it('pas de pourcentage quand le dénominateur est nul — « aucun critère écrit »', () => {
    const figure: Figure = {
      label: 'couverts',
      count: 0,
      total: 0,
      conclusion: 'conclusive',
    };
    const html = renderToStaticMarkup(<FigureView lang="fr" figure={figure} />);
    expect(html).not.toContain('%');
    expect(html).toContain('0 / 0');
  });

  it('écrit le refus de conclure quand l’effectif manque', () => {
    const figure: Figure = {
      label: 'couverts',
      count: 1,
      total: 2,
      percent: 50,
      conclusion: 'not-enough-history',
    };
    const html = renderToStaticMarkup(<FigureView lang="fr" figure={figure} />);
    expect(html).toContain('pas assez de recul');
  });
});
