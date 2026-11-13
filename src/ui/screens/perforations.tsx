/**
 * Le registre des perforations (§12.2).
 *
 * Chaque ligne porte le critère, **sa version**, la date du dernier
 * changement, la date de la vérification qui tenait la maille et l'écart
 * entre les deux (§24.4). Le classement — fraîche, sèche, multiple — vient du
 * domaine et est affiché tel quel (§8.2).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { PerforationRegistry } from '../../viewmodel/perforations';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, CoverageBlock, ScreenHeader } from '../frame';
import { RegistryTable, Stack, Text } from '../kit';

/** Écran : le registre des perforations. */
export function PerforationsScreen({
  scope,
  scopeType,
  lang,
}: ScreenProps): React.ReactElement {
  const { state } = useScreen<PerforationRegistry>('perforations', {
    scope,
    scopeType,
    language: lang,
  });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <PerforationsBody lang={lang} data={data} />}
    />
  );
}

/** Le compte par classement : fraîche, sèche, multiple. */
function ClassCounts({
  registry,
}: {
  /** Le compte par classement : les libellés viennent du serveur. */
  registry: PerforationRegistry;
}): React.ReactElement {
  return (
    <Stack space="space.050">
      {registry.byClass.map((entry) => (
        <Text key={entry.klass}>{`${entry.label} — ${entry.count}`}</Text>
      ))}
    </Stack>
  );
}

/** Le corps de l'écran : le registre, les classes, puis la trame. */
function PerforationsBody({
  lang,
  data,
}: {
  lang: Lang;
  data: PerforationRegistry;
}): React.ReactElement {
  const title = label(lang, 'screen', 'perforations');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <Text>{`${text(lang, 'perforations')} — ${data.shown} / ${data.total}`}</Text>
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'register-empty')}
      />
      <ClassCounts registry={data} />
      <CoverageBlock lang={lang} coverage={data.coverage} />
    </Stack>
  );
}
