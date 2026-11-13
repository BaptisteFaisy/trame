/**
 * La page de certificats de Trame dans Confluence
 * (`confluence:globalPage`, ressource `certificates`).
 *
 * Le certificat de trame (§12.5) est un document qui **déclare** ce qui a
 * été vérifié et, explicitement, ce qui ne l'a pas été. Le contexte d'une
 * page Confluence ne porte pas de projet : la page demande le périmètre.
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
import { CertificateScreen } from '../screens/certificate';

/** La page de certificats. */
function CertificatesPage(): React.ReactElement {
  return (
    <ScreenFrame>
      <ContextGate>{(context) => <CertificatesBody context={context} />}</ContextGate>
    </ScreenFrame>
  );
}

/** Le corps de la page : le périmètre demandé, puis le certificat. */
function CertificatesBody({ context }: { context: ScreenContext }): React.ReactElement {
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
      <Heading as="h2">{t(lang, 'app.name')}</Heading>
      <Text>{t(lang, 'app.tagline')}</Text>
      <CertificateScreen scope={scope} scopeType={scopeType} lang={lang} />
    </Stack>
  );
}

mountScreen(<CertificatesPage />);
