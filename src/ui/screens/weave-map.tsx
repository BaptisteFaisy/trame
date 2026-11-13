/**
 * La carte de trame (§17) : la chaîne (les critères), la trame (les actes),
 * les mailles (les liaisons vivantes), les trous et les perforations.
 *
 * UI Kit 2 n'offre ni canevas ni SVG : la carte est une **matrice**. Une
 * ligne est un fil de chaîne (un critère), une colonne est un passage de
 * trame (un acte), et la case est la maille. Le motif de la case dit ce qu'est
 * la maille — trait plein pour une liaison déclarée, pointillé pour une
 * liaison dérivée, vide pour un trou — et la légende écrit ce que chaque
 * motif veut dire (§22 : jamais la couleur seule).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { CodedState, Motif } from '../../viewmodel/common';
import { text } from '../../viewmodel/labels';
import type { Mesh, WarpThread, WeftPass, WeaveMap } from '../../viewmodel/weave-map';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, ScreenHeader } from '../frame';
import { DynamicTable, List, ListItem, Stack, StateBadge, Text, motifGlyph } from '../kit';
import { ui } from '../labels';

/** Écran : la carte de trame. */
export function WeaveMapScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<WeaveMap>('weave-map', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <WeaveMapBody lang={lang} data={data} />}
    />
  );
}

/* ------------------------------------------------------------------ états */

/** La nature d'un passage de trame : il existe, il prouve, ou il ne couvre plus rien. */
function passState(pass: WeftPass, lang: Lang): CodedState {
  if (pass.dangling) return { motif: 'crossed', word: text(lang, 'dangling') };
  if (pass.declaration) return { motif: 'dashed', word: text(lang, 'covered-declared') };
  return { motif: 'solid', word: text(lang, 'covered') };
}

/** L'état d'un fil de chaîne : perforé, infalsifiable, couvert, ou trou. */
function threadState(thread: WarpThread, woven: boolean, lang: Lang): CodedState {
  if (thread.perforated) return { motif: 'crossed', word: text(lang, 'perforations') };
  if (!thread.falsifiable) return { motif: 'dashed', word: text(lang, 'unfalsifiable') };
  if (woven) return { motif: 'solid', word: text(lang, 'covered') };
  return { motif: 'empty', word: text(lang, 'holes') };
}

/** Le motif d'une maille : pleine pour une liaison déclarée, pointillée pour une dérivée. */
function meshMotif(mesh: Mesh | undefined): Motif {
  if (mesh === undefined) return 'empty';
  return mesh.provisional ? 'dotted' : 'solid';
}

/* ----------------------------------------------------------------- la carte */

/** La légende : chaque motif, avec le mot qui le dit. */
function Legend({ lang }: { lang: Lang }): React.ReactElement {
  const entries: Array<[Motif, string]> = [
    ['solid', text(lang, 'covered')],
    ['dotted', text(lang, 'covered-provisional')],
    ['dashed', text(lang, 'covered-declared')],
    ['empty', text(lang, 'holes')],
  ];
  return (
    <Stack space="space.025">
      {entries.map(([motif, word]) => (
        <Text key={motif}>{`${motifGlyph(motif)} ${word}`}</Text>
      ))}
    </Stack>
  );
}

/** La tête d'une colonne : le nom du passage, et ce qu'il est. */
function passHead(pass: WeftPass, lang: Lang): React.ReactElement {
  const state = passState(pass, lang);
  return (
    <Stack space="space.025">
      <Text>{pass.name}</Text>
      <Text>{`${motifGlyph(state.motif)} ${state.word}`}</Text>
    </Stack>
  );
}

/** La tête d'une ligne : le critère, son texte, et son état. */
function threadHead(
  thread: WarpThread,
  state: CodedState,
  hole: { priorityLabel: string; size: number } | undefined,
): React.ReactElement {
  return (
    <Stack space="space.025">
      <Text>{`${thread.ticketKey} ${thread.criterionKey} — ${thread.kindLabel}`}</Text>
      <Text>{thread.text}</Text>
      <StateBadge state={state} />
      {hole === undefined ? null : (
        <Text>{`${motifGlyph('empty').repeat(hole.size)} ${hole.priorityLabel}`}</Text>
      )}
    </Stack>
  );
}

/** La carte : une ligne par critère, une colonne par acte. */
function WeaveTable({
  lang,
  data,
}: {
  lang: Lang;
  data: WeaveMap;
}): React.ReactElement {
  const holes = new Map(data.holes.map((hole) => [hole.criterionId, hole]));
  const head = {
    cells: [
      { content: text(lang, 'criterion'), key: 'h-criterion' },
      ...data.passes.map((pass) => ({
        content: passHead(pass, lang),
        key: `h-${pass.verificationId}`,
      })),
    ],
  };
  const rows = data.threads.map((thread) => {
    const woven = data.meshes.some((mesh) => mesh.criterionId === thread.criterionId);
    const hole = holes.get(thread.criterionId);
    return {
      key: `r-${thread.criterionId}`,
      cells: [
        {
          content: threadHead(
            thread,
            threadState(thread, woven, lang),
            hole === undefined ? undefined : { priorityLabel: hole.priorityLabel, size: hole.size },
          ),
          key: 'c-criterion',
        },
        ...data.passes.map((pass) => {
          const mesh = data.meshes.find(
            (row) => row.criterionId === thread.criterionId && row.verificationId === pass.verificationId,
          );
          return { content: motifGlyph(meshMotif(mesh)), key: `c-${pass.verificationId}` };
        }),
      ],
    };
  });
  return <DynamicTable head={head} rows={rows} caption={label(lang, 'screen', 'weave-map')} label={label(lang, 'screen', 'weave-map')} />;
}

/** Les trous de la carte : le métré décide de leur taille. */
function HoleList({ lang, data }: { lang: Lang; data: WeaveMap }): React.ReactElement {
  if (data.holes.length === 0) return <Text>{text(lang, 'register-empty')}</Text>;
  return (
    <List type="unordered">
      {data.holes.map((hole) => (
        <ListItem key={hole.criterionId}>
          {`${hole.criterionKey} — ${motifGlyph('empty').repeat(hole.size)} ${hole.priorityLabel}`}
        </ListItem>
      ))}
    </List>
  );
}

/** Le corps de l'écran : les compteurs, la légende, la carte, les trous. */
function WeaveMapBody({
  lang,
  data,
}: {
  lang: Lang;
  data: WeaveMap;
}): React.ReactElement {
  return (
    <Stack space="space.150">
      <ScreenHeader
        lang={lang}
        title={label(lang, 'screen', 'weave-map')}
        scope={data.scope}
        computedAt={data.computedAt}
      />
      <Stack space="space.100">
        <Text>{`${ui(lang, 'threads')} — ${data.threads.length}`}</Text>
        <Text>{`${ui(lang, 'passes')} — ${data.passes.length}`}</Text>
        <Text>{`${ui(lang, 'meshes')} — ${data.meshes.length}`}</Text>
      </Stack>
      <Legend lang={lang} />
      <WeaveTable lang={lang} data={data} />
      <Stack space="space.050">
        <Text>{ui(lang, 'holes')}</Text>
        <HoleList lang={lang} data={data} />
      </Stack>
    </Stack>
  );
}
