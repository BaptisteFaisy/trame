/**
 * La page de projet de Trame (`jira:projectPage`, ressource `project`).
 *
 * Elle montre la trame du projet : la carte, les zones à risque et le
 * bulletin. Le projet vient du contexte ; s'il n'y est pas, la page demande
 * le périmètre — elle ne l'invente pas.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React, { useState } from 'react';
import { label, t } from '../../i18n/index';
import type { ScopeType } from '../../types';
import type { ScreenContext } from '../bridge';
import { ContextGate, ScreenFrame, ScopePrompt } from '../frame';
import { Heading, Stack, TabEntry, Tabs, Text } from '../kit';
import { mountScreen } from '../mount';
import { BulletinScreen } from '../screens/bulletin';
import { WeaveMapScreen } from '../screens/weave-map';
import { ZoneRisksScreen } from '../screens/zone-risks';

/** La page de projet. */
function ProjectPage(): React.ReactElement {
  return (
    <ScreenFrame>
      <ContextGate>{(context) => <ProjectPageBody context={context} />}</ContextGate>
    </ScreenFrame>
  );
}

/** Le corps de la page : le projet, puis les trois écrans du projet. */
function ProjectPageBody({ context }: { context: ScreenContext }): React.ReactElement {
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
    <Stack space="space.200">
      <Heading as="h2">{t(lang, 'app.name')}</Heading>
      <Text>{`${t(lang, 'app.tagline')} — ${scope}`}</Text>
      <Tabs id="trame-project">
        <TabEntry label={label(lang, 'screen', 'weave-map')}>
          <WeaveMapScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'zone-risks')}>
          <ZoneRisksScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'bulletin')}>
          <BulletinScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
      </Tabs>
    </Stack>
  );
}

mountScreen(<ProjectPage />);
