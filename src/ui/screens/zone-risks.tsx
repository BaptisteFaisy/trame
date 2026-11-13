/**
 * Les zones à risque (§11) : la matière observée qui nourrit le métré.
 *
 * Une zone sans antécédent n'apparaît pas : elle n'est pas un risque, et la
 * ligne vide n'existe pas.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { ZoneRisksView } from '../../viewmodel/zone-risks';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, ScreenHeader } from '../frame';
import { RegistryTable, Stack } from '../kit';

/** Écran : les zones à risque. */
export function ZoneRisksScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<ZoneRisksView>('zone-risks', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-zone')}
      render={(data) => <ZoneRisksBody lang={lang} data={data} />}
    />
  );
}

/** Le corps de l'écran : le registre des zones mesurées. */
function ZoneRisksBody({
  lang,
  data,
}: {
  lang: Lang;
  data: ZoneRisksView;
}): React.ReactElement {
  const title = label(lang, 'screen', 'zone-risks');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'no-zone')}
      />
    </Stack>
  );
}
