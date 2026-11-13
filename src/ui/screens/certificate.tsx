/**
 * Le certificat de trame (§12.5).
 *
 * Un certificat sans ses manques est un compliment, pas une preuve : la liste
 * **explicite** de ce qui n'est pas couvert est le cœur du document (§24.14).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React from 'react';
import type { Lang } from '../../i18n/index';
import { label } from '../../i18n/index';
import type { WeaveCertificateView } from '../../viewmodel/certificate';
import { text } from '../../viewmodel/labels';
import type { ScreenProps } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, CoverageBlock, ScreenHeader } from '../frame';
import { List, ListItem, RegistryTable, Stack, Text } from '../kit';
import { ui } from '../labels';
import { danglingRegister, perforationRegister } from './registers';

/** Écran : le certificat de trame. */
export function CertificateScreen({ scope, scopeType, lang }: ScreenProps): React.ReactElement {
  const { state } = useScreen<WeaveCertificateView>('certificate', {
    scope,
    scopeType,
    language: lang,
  });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => <CertificateBody lang={lang} data={data} />}
    />
  );
}

/** Ce qui n'est PAS couvert : la déclaration qui rend le certificat. */
function NotCovered({
  lang,
  data,
}: {
  lang: Lang;
  data: WeaveCertificateView;
}): React.ReactElement {
  return (
    <Stack space="space.050">
      <Text>{`${text(lang, 'not-covered')} — ${data.declaration.count}`}</Text>
      <List type="unordered">
        {data.notCovered.map((line) => (
          <ListItem key={`${line.ticketKey}-${line.criterionKey}`}>
            {`${line.ticketKey} ${line.criterionKey} — ${line.text}`}
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

/** Les critères que rien ne peut vérifier. */
function Unfalsifiable({
  lang,
  data,
}: {
  lang: Lang;
  data: WeaveCertificateView;
}): React.ReactElement {
  return (
    <Stack space="space.050">
      <Text>{text(lang, 'unfalsifiable')}</Text>
      <List type="unordered">
        {data.unfalsifiable.map((line) => (
          <ListItem key={`${line.ticketKey}-${line.criterionKey}`}>
            {`${line.ticketKey} ${line.criterionKey} — ${line.reason}`}
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

/** Le corps du certificat : les actes, les manques, les perforations. */
function CertificateBody({
  lang,
  data,
}: {
  lang: Lang;
  data: WeaveCertificateView;
}): React.ReactElement {
  const perforations = perforationRegister(lang, data.perforations);
  const dangling = danglingRegister(lang, data.dangling);
  return (
    <Stack space="space.150">
      <ScreenHeader
        lang={lang}
        title={label(lang, 'screen', 'certificate')}
        scope={data.scope}
        computedAt={data.issuedAt}
      />
      <CoverageBlock lang={lang} coverage={data.coverage} />
      <Text>{ui(lang, 'acts')}</Text>
      <RegistryTable
        lang={lang}
        head={data.actHead}
        rows={data.actRows}
        caption={ui(lang, 'acts')}
        empty={text(lang, 'nothing-linked')}
      />
      <NotCovered lang={lang} data={data} />
      <Unfalsifiable lang={lang} data={data} />
      <Text>{text(lang, 'perforations')}</Text>
      <RegistryTable
        lang={lang}
        head={perforations.head}
        rows={perforations.rows}
        caption={text(lang, 'perforations')}
        empty={text(lang, 'register-empty')}
      />
      <Text>{text(lang, 'dangling')}</Text>
      <RegistryTable
        lang={lang}
        head={dangling.head}
        rows={dangling.rows}
        caption={text(lang, 'dangling')}
        empty={text(lang, 'queue-empty')}
      />
    </Stack>
  );
}
