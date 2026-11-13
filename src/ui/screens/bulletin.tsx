/**
 * Le bulletin de trame (§12.4).
 *
 * Le bulletin est **daté** et **comparable au témoin précédent**. Deux
 * chiffres ne se comparent que si leurs périmètres et leurs époques coïncident
 * (§22) : sinon la comparaison est refusée, pas approximée. Sous l'effectif
 * minimal, l'app refuse de conclure.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { BulletinComparison, WeaveBulletin } from '../../viewmodel/bulletin';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, CoverageBlock, ScreenHeader } from '../frame';
import { FigureList, List, ListItem, Stack, Text } from '../kit';
import { ui } from '../labels';

/** Écran : le bulletin de trame. */
export function BulletinScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<WeaveBulletin>('bulletin', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <BulletinBody lang={lang} data={data} />}
    />
  );
}

/** La comparaison au témoin précédent — ou son refus. */
function Comparison({
  lang,
  comparison,
}: {
  lang: Lang;
  comparison: BulletinComparison | null;
}): React.ReactElement | null {
  if (comparison === null) return null;
  return (
    <Stack space="space.050">
      <Text>{ui(lang, 'comparison')}</Text>
      <Text>{`${text(lang, 'witness')} — ${comparison.previousComputedAt}`}</Text>
      <Text>{`${text(lang, 'covered-declared')} : ${comparison.coveredDeclaredDelta}`}</Text>
      <Text>{`${text(lang, 'proven')} : ${comparison.provenDelta}`}</Text>
      {comparison.comparable ? null : <Text>{comparison.conclusion}</Text>}
    </Stack>
  );
}

/** Les messages du bulletin : ce qu'il faut savoir avant de lire les chiffres. */
function Messages({ data }: { data: WeaveBulletin }): React.ReactElement {
  return (
    <List type="unordered">
      {data.messages.map((message) => (
        <ListItem key={message}>{message}</ListItem>
      ))}
    </List>
  );
}

/** Les trous prioritaires du bulletin. */
function TopHoles({ lang, data }: { lang: Lang; data: WeaveBulletin }): React.ReactElement {
  return (
    <Stack space="space.050">
      <Text>{ui(lang, 'holes')}</Text>
      <List type="unordered">
        {data.topHoles.map((hole) => (
          <ListItem key={hole.id}>
            {`${hole.ticketKey} ${hole.criterionKey} — ${hole.priorityLabel}`}
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

/** Le corps du bulletin : la couverture, les compteurs, la comparaison. */
function BulletinBody({
  lang,
  data,
}: {
  lang: Lang;
  data: WeaveBulletin;
}): React.ReactElement {
  return (
    <Stack space="space.150">
      <ScreenHeader
        lang={lang}
        title={label(lang, 'screen', 'bulletin')}
        scope={data.scope}
        computedAt={data.computedAt}
      />
      <Messages data={data} />
      <CoverageBlock lang={lang} coverage={data.coverage} />
      <FigureList
        lang={lang}
        figures={[data.perforations, data.dangling, data.unfalsifiable, data.added]}
      />
      <Comparison lang={lang} comparison={data.comparison} />
      <TopHoles lang={lang} data={data} />
    </Stack>
  );
}
