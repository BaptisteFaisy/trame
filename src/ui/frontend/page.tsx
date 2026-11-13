/**
 * La page globale de Trame (`jira:globalPage`, ressource `page`).
 *
 * C'est la porte d'entrée de l'app : les onze écrans de §17 s'y retrouvent
 * en onglets, branchés sur le resolver, alimentés par la vraie donnée.
 *
 * La page n'a pas toujours de projet dans son contexte : elle demande alors
 * le périmètre à l'utilisateur — elle ne l'invente pas (§24.16).
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
import { DanglingScreen } from '../screens/dangling';
import { HolesScreen } from '../screens/holes';
import { PerforationsScreen } from '../screens/perforations';
import { TimelineScreen } from '../screens/timeline';
import { ValidationQueueScreen } from '../screens/validation-queue';
import { VisibilityScreen } from '../screens/visibility';
import { WeaveMapScreen } from '../screens/weave-map';

/** La page globale. */
function GlobalPage(): React.ReactElement {
  return (
    <ScreenFrame>
      <ContextGate>{(context) => <GlobalPageBody context={context} />}</ContextGate>
    </ScreenFrame>
  );
}

/** Le périmètre demandé : celui du contexte, ou celui saisi par l'utilisateur. */
interface Chosen {
  scope: string;
  scopeType: ScopeType;
}

/** Le corps de la page : le périmètre, puis les onglets des onze écrans. */
function GlobalPageBody({ context }: { context: ScreenContext }): React.ReactElement {
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const scope = chosen?.scope ?? context.projectKey ?? context.issueKey ?? '';
  const scopeType: ScopeType =
    chosen?.scopeType ?? (context.projectKey ? 'project' : context.issueKey ? 'ticket' : 'project');

  if (scope === '') {
    return (
      <ScopePrompt
        lang={context.locale}
        onSubmit={(value, type) => setChosen({ scope: value, scopeType: type })}
      />
    );
  }
  const lang = context.locale;
  return (
    <Stack space="space.200">
      <Heading as="h2">{t(lang, 'app.name')}</Heading>
      <Text>{t(lang, 'app.tagline')}</Text>
      <Tabs id="trame-page">
        <TabEntry label={label(lang, 'screen', 'weave-map')}>
          <WeaveMapScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'holes')}>
          <HolesScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'perforations')}>
          <PerforationsScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'dangling')}>
          <DanglingScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'bulletin')}>
          <BulletinScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'validation-queue')}>
          <ValidationQueueScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'visibility')}>
          <VisibilityScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
        <TabEntry label={label(lang, 'screen', 'timeline')}>
          <TimelineScreen scope={scope} scopeType={scopeType} lang={lang} />
        </TabEntry>
      </Tabs>
    </Stack>
  );
}

mountScreen(<GlobalPage />);
