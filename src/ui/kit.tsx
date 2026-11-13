/**
 * La façade UI Kit 2 de Trame — la seule porte d'entrée des primitives.
 *
 * Les écrans n'importent **jamais** `@forge/react` directement, et **jamais**
 * `@forge/ui` (UI Kit 1, déprécié) : ils passent par cette façade, qui
 * exposes deux choses :
 *
 *  - les primitives Atlassian, ré-exportées telles quelles ;
 *  - les briques de trame, écrites **une seule fois** pour les onze écrans :
 *    l'état double-codé (motif + mot), le registre (entête + lignes), la
 *    figure (effectif + dénominateur + refus de conclure) et l'état vide.
 *
 * Deux règles d'affichage, vérifiées par `tests/ui/no-raw-html.test.ts` :
 *
 *  - **jamais de HTML brut** — le moteur de rendu d'Atlassian rejette les
 *    éléments inconnus (« Error rendering app - encountered unknown component
 *    p. ») ; seules les primitives de la façade sont utilisées ;
 *  - **jamais la couleur seule** — un état porte toujours le MOTIF que l'œil
 *    dessine et le MOT que l'écran écrit (§22).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  DynamicTable,
  Form,
  FormFooter,
  FormSection,
  Heading,
  Label,
  Link,
  List,
  ListItem,
  Lozenge,
  ProgressBar,
  RadioGroup,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs as ForgeTabs,
  Text,
  TextArea,
  Textfield,
} from '@forge/react';
import type { Lang } from '../i18n/index';
import { t } from '../i18n/index';
import type { CodedState, Figure, Motif, RegisterRow, TableHead } from '../viewmodel/common';
import { text } from '../viewmodel/labels';

/* Les primitives, ré-exportées telles quelles : un écran ne les cherche pas
   ailleurs, et la façade reste le seul point de contact avec `@forge/react`. */
export {
  Badge,
  Box,
  Button,
  Checkbox,
  DynamicTable,
  Form,
  FormFooter,
  FormSection,
  Heading,
  Label,
  Link,
  List,
  ListItem,
  Lozenge,
  ProgressBar,
  RadioGroup,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextArea,
  Textfield,
};

export const Fragment = React.Fragment;

/* ------------------------------------------------------------ l'état codé */

/**
 * Le MOTIF que l'œil dessine (§22).
 *
 * UI Kit 2 n'offre ni canevas ni SVG : le motif est dessiné par un trait, en
 * caractères de dessin, dans le texte même du badge. Le trait et le mot
 * voyagent toujours ensemble — la couleur n'est jamais le seul signal.
 */
const MOTIF_GLYPH: Record<Motif, string> = {
  solid: '━',
  dashed: '┄',
  dotted: '┈',
  crossed: '╳',
  empty: '□',
  striped: '▨',
};

/** L'apparence du badge, pour le motif donné. */
const MOTIF_APPEARANCE: Record<Motif, 'default' | 'inprogress' | 'new' | 'removed' | 'success'> = {
  solid: 'success',
  dashed: 'default',
  dotted: 'inprogress',
  crossed: 'removed',
  empty: 'default',
  striped: 'new',
};

/** Le trait qui dessine un motif. */
export function motifGlyph(motif: Motif): string {
  return MOTIF_GLYPH[motif] ?? MOTIF_GLYPH.empty;
}

/**
 * Un état double-codé : le motif que l'œil dessine, et le mot que l'écran
 * écrit. C'est la brique unique de tous les états de la trame.
 */
export function StateBadge({ state }: { state: CodedState }): React.ReactElement {
  return (
    <Lozenge appearance={MOTIF_APPEARANCE[state.motif] ?? 'default'}>
      {`${motifGlyph(state.motif)} ${state.word}`}
    </Lozenge>
  );
}

/* --------------------------------------------------------------- registre */

/** Une colonne de registre. */
interface Cell {
  content: React.ReactNode;
  key: string;
}

/** Le mode d'affichage de l'état : en fin de ligne, ou à la place du mot. */
export type StateColumn = 'append' | 'last';

/** Les cellules d'une ligne, complétées à la largeur de l'entête. */
function cellsOf(
  row: RegisterRow,
  width: number,
  mode: StateColumn,
): Cell[] {
  const contents: React.ReactNode[] = [...row.cells];
  while (contents.length < width) contents.push('');
  if (mode === 'append') {
    contents.push(<StateBadge key="state" state={row.state} />);
  } else if (contents.length > 0) {
    contents[contents.length - 1] = <StateBadge key="state" state={row.state} />;
  }
  return contents.map((content, index) => ({ content, key: `c-${index}` }));
}

/** L'entête d'un registre, colonnes de l'app + colonne d'état. */
function headOf(head: TableHead, lang: Lang, mode: StateColumn): Cell[] {
  const cells = head.cells.map((content, index) => ({ content, key: `h-${index}` }));
  if (mode === 'append') cells.push({ content: text(lang, 'state'), key: 'h-state' });
  return cells;
}

/**
 * Le registre : un tableau d'entête et de lignes, avec l'état de chaque ligne.
 *
 * C'est la seule façon de montrer une liste de lignes dans l'app (les trous,
 * les perforations, les fils détendus, les zones, les témoins…) : une
 * implémentation, onze écrans.
 *
 * `stateColumn="last"` : l'état remplace le dernier mot de la ligne — pour
 * les registres dont l'entête porte déjà une colonne d'état.
 */
export function RegistryTable({
  lang,
  head,
  rows,
  caption,
  empty,
  stateColumn = 'append',
}: {
  lang: Lang;
  head: TableHead;
  rows: RegisterRow[];
  caption: string;
  empty: string;
  stateColumn?: StateColumn;
}): React.ReactElement {
  const width = head.cells.length;
  return (
    <DynamicTable
      head={{ cells: headOf(head, lang, stateColumn) }}
      rows={rows.map((row, index) => ({
        key: `r-${index}-${row.state.word}`,
        cells: cellsOf(row, width, stateColumn),
      }))}
      caption={caption}
      label={caption}
      emptyView={<Text>{empty}</Text>}
    />
  );
}

/* ---------------------------------------------------------------- figures */

/**
 * Une figure : l'effectif, son dénominateur, et le verdict de l'app.
 *
 * Le pourcentage n'apparaît que s'il existe (un périmètre sans critère écrit
 * n'est pas « 0 % », §24.16) et le refus de conclure est écrit sous le chiffre
 * quand l'effectif est trop petit.
 */
export function FigureView({ lang, figure }: { lang: Lang; figure: Figure }): React.ReactElement {
  return (
    <Stack space="space.050">
      <Text>{figure.label}</Text>
      <Text>{`${figure.count} / ${figure.total}`}</Text>
      {figure.percent === undefined ? null : <Text>{`${figure.percent} %`}</Text>}
      {figure.conclusion === 'not-enough-history' ? (
        <Text>{t(lang, 'msg.not-enough-history')}</Text>
      ) : null}
    </Stack>
  );
}

/** Une liste de figures : les effectifs d'un écran, les uns sous les autres. */
export function FigureList({
  lang,
  figures,
}: {
  lang: Lang;
  figures: readonly Figure[];
}): React.ReactElement {
  return (
    <Stack space="space.150">
      {figures.map((figure) => (
        <FigureView key={figure.label} lang={lang} figure={figure} />
      ))}
    </Stack>
  );
}

/* ------------------------------------------------------------ états vides */

/** Un registre sans rien à montrer : il le dit, il ne montre pas de ligne. */
export function EmptyView({ word }: { word: string }): React.ReactElement {
  return <SectionMessage appearance="information">{word}</SectionMessage>;
}

/* ----------------------------------------------------------------- onglets */

/** Le contenu d'un onglet, déclaré dans la JSX du parent. */
export function TabEntry({
  children,
}: {
  /** Le libellé de l'onglet — lu par `Tabs`, qui parcourt ses enfants. */
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return <React.Fragment>{children}</React.Fragment>;
}

/**
 * Les onglets UI Kit 2.
 *
 * Les onglets inactifs ne sont pas montés (`shouldUnmountTabPanelOnChange`) :
 * une page à huit onglets ne demande qu'un écran au resolver, pas huit.
 */
export function Tabs({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}): React.ReactElement {
  const entries: Array<{ label: string; body: React.ReactNode }> = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as { label?: string; children?: React.ReactNode };
    entries.push({ label: props.label ?? '', body: props.children });
  });
  return (
    <ForgeTabs id={id} shouldUnmountTabPanelOnChange>
      <TabList>
        {entries.map((entry, index) => (
          <Tab key={`t-${index}`}>{entry.label}</Tab>
        ))}
      </TabList>
      {entries.map((entry, index) => (
        <TabPanel key={`p-${index}`}>{entry.body}</TabPanel>
      ))}
    </ForgeTabs>
  );
}
