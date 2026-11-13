/**
 * L'historique de trame (§17) : les témoins successifs d'un périmètre.
 *
 * Deux témoins ne se comparent que si leurs périmètres et leurs époques
 * coïncident (§22) ; sinon l'écran refuse la comparaison, il ne l'approximme
 * pas.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { TimelineView } from '../../viewmodel/timeline';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, ScreenHeader } from '../frame';
import { RegistryTable, Stack } from '../kit';

/** Écran : l'historique de trame. */
export function TimelineScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<TimelineView>('timeline', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'history-empty')}
      render={(data) => <TimelineBody lang={lang} data={data} />}
    />
  );
}

/** Le corps de l'écran : le registre des témoins, du plus récent au plus ancien. */
function TimelineBody({
  lang,
  data,
}: {
  lang: Lang;
  data: TimelineView;
}): React.ReactElement {
  const title = label(lang, 'screen', 'timeline');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'history-empty')}
      />
    </Stack>
  );
}
