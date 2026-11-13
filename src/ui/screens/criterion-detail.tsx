/**
 * La fiche d'un critère (§12, TR-14) : ce qui le couvre, à quelle force, ce
 * qui l'a perforé, ce qui attend une décision.
 *
 * L'état de couverture propre du critère est double-codé : le motif que l'œil
 * dessine et le mot que l'écran écrit (§22). Un critère infalsifiable le dit
 * aussi — jamais « couvert », jamais « 0 % ».
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { CriterionSheet } from '../../viewmodel/criterion-detail';
import { text } from '../../viewmodel/labels';
import { useScreen } from '../bridge';
import { AsyncView, CoverageBlock, ScreenHeader } from '../frame';
import { FigureList, List, ListItem, RegistryTable, Stack, StateBadge, Text } from '../kit';
import { ui } from '../labels';
import { forcesRegister, perforationRegister } from './registers';

/** Ce qu'un écran doit savoir pour montrer une fiche critère. */
export interface CriterionProps {
  /** Le ticket qui porte le critère. */
  ticketKey: string;
  /** L'identifiant stable du critère dans le ticket. */
  criterionId: string;
  /** La langue de l'écran. */
  lang: Lang;
}

/** Écran : la fiche d'un critère. */
export function CriterionDetailScreen({
  ticketKey,
  criterionId,
  lang,
}: CriterionProps): React.ReactElement {
  const { state } = useScreen<CriterionSheet>('criterion-detail', {
    ticketKey,
    criterionId,
    language: lang,
  });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <CriterionBody lang={lang} data={data} />}
    />
  );
}

/** La tête du critère : son texte, son origine, son état. */
function CriterionHead({
  lang,
  data,
}: {
  lang: Lang;
  data: CriterionSheet;
}): React.ReactElement {
  const head = data.criterion;
  return (
    <Stack space="space.050">
      <Text>{`${head.ticketKey} ${head.criterionKey}`}</Text>
      <Text>{head.text}</Text>
      <Text>{`${head.kindLabel} — ${head.originLabel}`}</Text>
      <Text>{`${text(lang, 'version')} ${head.version}`}</Text>
      <StateBadge state={head.state} />
      {head.unfalsifiableReason === undefined ? null : <Text>{head.unfalsifiableReason}</Text>}
    </Stack>
  );
}

/** La couverture propre du critère : couvert, à quelle force, frais ou pas. */
function OwnCoverage({
  lang,
  data,
}: {
  lang: Lang;
  data: CriterionSheet;
}): React.ReactElement {
  const coverage = data.coverage;
  return (
    <Stack space="space.050">
      <Text>{`${text(lang, 'force')} — ${coverage.strengthLabel}`}</Text>
      <Text>{coverage.freshLabel}</Text>
      <StateBadge state={coverage.state} />
    </Stack>
  );
}

/** Les propositions qui attendent une décision humaine. */
function Proposals({
  lang,
  data,
}: {
  lang: Lang;
  data: CriterionSheet;
}): React.ReactElement {
  if (data.proposals.length === 0) return <Text>{text(lang, 'file-empty')}</Text>;
  return (
    <List type="unordered">
      {data.proposals.map((proposal) => (
        <ListItem key={proposal.id}>
          {`${proposal.typeLabel} — ${proposal.summary} — ${proposal.status}`}
        </ListItem>
      ))}
    </List>
  );
}

/** Le corps de la fiche : la tête, la couverture, les forces, les propositions. */
function CriterionBody({
  lang,
  data,
}: {
  lang: Lang;
  data: CriterionSheet;
}): React.ReactElement {
  const forces = forcesRegister(lang, data.forces);
  const perforations = perforationRegister(lang, data.perforations);
  return (
    <Stack space="space.150">
      <ScreenHeader
        lang={lang}
        title={label(lang, 'screen', 'criterion-detail')}
        scope={data.scope}
        computedAt={data.computedAt}
      />
      <CriterionHead lang={lang} data={data} />
      <OwnCoverage lang={lang} data={data} />
      <Text>{ui(lang, 'forces')}</Text>
      <RegistryTable
        lang={lang}
        head={forces.head}
        rows={forces.rows}
        caption={ui(lang, 'forces')}
        empty={text(lang, 'nothing-linked')}
      />
      <Text>{text(lang, 'perforations')}</Text>
      <RegistryTable
        lang={lang}
        head={perforations.head}
        rows={perforations.rows}
        caption={text(lang, 'perforations')}
        empty={text(lang, 'register-empty')}
      />
      <Text>{ui(lang, 'proposals')}</Text>
      <Proposals lang={lang} data={data} />
      <FigureList lang={lang} figures={data.figures} />
      <CoverageBlock lang={lang} coverage={data.scopeCoverage} />
    </Stack>
  );
}
