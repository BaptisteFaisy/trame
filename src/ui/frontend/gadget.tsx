/**
 * Le gadget de tableau de bord de Trame (`jira:dashboardGadget`, ressource
 * `gadget`).
 *
 * Le contexte d'un gadget ne porte pas de projet : le gadget demande donc le
 * périmètre, puis montre le **bulletin** — la couverture d'un coup d'œil,
 * datée, avec ses effectifs.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React, { useState } from 'react';
import { t } from '../../i18n/index';
import type { ScopeType } from '../../types';
import type { ScreenContext } from '../bridge';
import { ContextGate, ScreenFrame, ScopePrompt } from '../frame';
import { Heading, Stack, Text } from '../kit';
import { mountScreen } from '../mount';
import { BulletinScreen } from '../screens/bulletin';

/** Le gadget. */
function BulletinGadget(): React.ReactElement {
  return (
    <ScreenFrame>
      <ContextGate>{(context) => <GadgetBody context={context} />}</ContextGate>
    </ScreenFrame>
  );
}

/** Le corps du gadget : le périmètre demandé, puis le bulletin. */
function GadgetBody({ context }: { context: ScreenContext }): React.ReactElement {
  const [chosen, setChosen] = useState<{ scope: string; scopeType: ScopeType } | null>(null);
  const scope = chosen?.scope ?? context.projectKey ?? '';
  const scopeType: ScopeType = chosen?.scopeType ?? 'project';
  const lang = context.locale;

  if (scope === '') {
    return (
      <ScopePrompt
        lang={lang}
        onSubmit={(value, type) => setChosen({ scope: value, scopeType: type })}
      />
    );
  }
  return (
    <Stack space="space.150">
      <Heading as="h3">{t(lang, 'app.name')}</Heading>
      <Text>{t(lang, 'app.tagline')}</Text>
      <BulletinScreen scope={scope} scopeType={scopeType} lang={lang} />
    </Stack>
  );
}

mountScreen(<BulletinGadget />);
