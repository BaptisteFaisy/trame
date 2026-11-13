/**
 * La file de validation (§12.6).
 *
 * Tout y est un **brouillon** : les liaisons dérivées à confirmer, les tests
 * proposés, les reformulations proposées. Rien n'est appliqué sans une
 * décision humaine — la file le dit, et chaque ligne porte son motif.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { ValidationQueue } from '../../viewmodel/validation-queue';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, ScreenHeader } from '../frame';
import { RegistryTable, Stack, Text } from '../kit';

/** Écran : la file de validation. */
export function ValidationQueueScreen({
  scope,
  scopeType,
  lang,
}: ScreenProps): React.ReactElement {
  const { state } = useScreen<ValidationQueue>('validation-queue', {
    scope,
    scopeType,
    language: lang,
  });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'file-empty')}
      render={(data) => <ValidationQueueBody lang={lang} data={data} />}
    />
  );
}

/** Le corps de la file : les compteurs, puis le registre des brouillons. */
function ValidationQueueBody({
  lang,
  data,
}: {
  lang: Lang;
  data: ValidationQueue;
}): React.ReactElement {
  const title = label(lang, 'screen', 'validation-queue');
  return (
    <Stack space="space.150">
      <ScreenHeader lang={lang} title={title} scope={data.scope} computedAt={data.computedAt} />
      <Text>{`${text(lang, 'derived-links')} — ${data.counts.derived}`}</Text>
      <Text>{`${text(lang, 'proposed-test')} — ${data.counts.proposals}`}</Text>
      <RegistryTable
        lang={lang}
        head={data.head}
        rows={data.rows}
        caption={title}
        empty={text(lang, 'file-empty')}
      />
    </Stack>
  );
}
