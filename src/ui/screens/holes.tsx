/**
 * L'explorateur des trous (§12.1, §11).
 *
 * Le registre montre chaque trou avec le **calcul** qui l'a classé : la
 * priorité et ses termes (§22 explicabilité, §24.11). La trame du périmètre
 * suit, avec ses effectifs et ses trois axes.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { HoleExplorer } from '../../viewmodel/holes';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, CoverageBlock, ScreenHeader } from '../frame';
import { RegistryTable, Stack, Text } from '../kit';

/** Écran : l'explorateur des trous. */
export function HolesScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<HoleExplorer>('holes', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <HolesBody lang={lang} data={data} />}
    />
  );
}

/** Le corps de l'écran : le registre, puis la trame du périmètre. */
function HolesBody({
  lang,
  data,
}: {
  lang: Lang;
  data: HoleExplorer;
}): React.ReactElement {
  const title = label(lang, 'screen', 'holes');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <Text>{`${text(lang, 'holes')} — ${data.shown} / ${data.total}`}</Text>
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'register-empty')}
      />
      <CoverageBlock lang={lang} coverage={data.coverage} />
    </Stack>
  );
}
