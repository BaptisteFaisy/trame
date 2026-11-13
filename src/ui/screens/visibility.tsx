/**
 * L'écran de couverture (§17, §18) : ce que l'app voit, et ce qu'elle ne
 * voit pas.
 *
 * Les quatre absences sont **distinguées**, jamais confondues (§22) :
 * `no-right` (pas de droit), `no-data` (pas de données), `no-test` (pas de
 * test), `no-criterion` (pas de critère). Un angle mort de l'app (pas de
 * droit) n'est jamais affiché comme un trou du projet.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { VisibilityView } from '../../viewmodel/visibility';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, ScreenHeader } from '../frame';
import { List, ListItem, RegistryTable, Stack, Text } from '../kit';
import { ui } from '../labels';

/** Écran : ce que Trame voit. */
export function VisibilityScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<VisibilityView>('visibility', { scope, scopeType, language: lang });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-probe')}
      render={(data) => <VisibilityBody lang={lang} data={data} />}
    />
  );
}

/** Les quatre absences, avec le mot qui distingue chacune. */
function Distinctions({ lang, data }: { lang: Lang; data: VisibilityView }): React.ReactElement {
  return (
    <Stack space="space.050">
      <Text>{ui(lang, 'absences')}</Text>
      <List type="unordered">
        {data.distinctions.map((entry) => (
          <ListItem key={entry.absence}>{`${entry.absence} — ${entry.word}`}</ListItem>
        ))}
      </List>
    </Stack>
  );
}

/** Le corps de l'écran : les sondes, puis les absences distinguées. */
function VisibilityBody({
  lang,
  data,
}: {
  lang: Lang;
  data: VisibilityView;
}): React.ReactElement {
  const title = label(lang, 'screen', 'visibility');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'no-probe')}
      />
      <Distinctions lang={lang} data={data} />
    </Stack>
  );
}
