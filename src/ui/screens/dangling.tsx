/**
 * La file des fils détendus (§12.3).
 *
 * Un fil détendu est un acte de vérification qui ne couvre plus rien : la
 * raison vient du dictionnaire (§8.3) et l'**impact est chiffré** — combien
 * de mailles il retire de la couverture (§24.5).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { DanglingQueue } from '../../viewmodel/dangling';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, CoverageBlock, ScreenHeader } from '../frame';
import { FigureView, RegistryTable, Stack, Text } from '../kit';

/** Écran : la file des fils détendus. */
export function DanglingScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<DanglingQueue>('dangling', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <DanglingBody lang={lang} data={data} />}
    />
  );
}

/** Le corps de l'écran : la file, l'impact chiffré, puis la trame. */
function DanglingBody({
  lang,
  data,
}: {
  lang: Lang;
  data: DanglingQueue;
}): React.ReactElement {
  const title = label(lang, 'screen', 'dangling');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <Text>{`${text(lang, 'dangling')} — ${data.shown} / ${data.total}`}</Text>
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'queue-empty')}
        stateColumn="last"
      />
      <FigureView lang={lang} figure={data.impact} />
      <CoverageBlock lang={lang} coverage={data.coverage} />
    </Stack>
  );
}
