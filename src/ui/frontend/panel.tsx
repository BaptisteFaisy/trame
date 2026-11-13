/**
 * Le panneau de ticket de Trame (`jira:issuePanel`, ressource `panel`).
 *
 * Le panneau montre la **fiche d'un critère** du ticket (TR-14) : ce qui le
 * couvre, à quelle force, ce qui l'a perforé, ce qui attend une décision.
 *
 * Il commence par la liste des critères du ticket — tirée de la carte de
 * trame, qui est la seule chose qui les connaît tous — puis la fiche de celui
 * que l'utilisateur choisit.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React, { useState } from 'react';
import type { Lang } from '../../i18n/index';
import { text } from '../../viewmodel/labels';
import type { WeaveMap } from '../../viewmodel/weave-map';
import type { ScreenContext } from '../bridge';
import { useScreen } from '../bridge';
import { AsyncView, ContextGate, ScreenFrame } from '../frame';
import { Button, Stack, Text } from '../kit';
import { ui } from '../labels';
import { mountScreen } from '../mount';
import { CriterionDetailScreen } from '../screens/criterion-detail';

/** Le panneau du ticket. */
function IssuePanel(): React.ReactElement {
  return (
    <ScreenFrame>
      <ContextGate>{(context) => <PanelBody context={context} />}</ContextGate>
    </ScreenFrame>
  );
}

/** La liste des critères du ticket : elle vient de la carte de trame. */
function CriterionPicker({
  ticketKey,
  lang,
  onPick,
}: {
  ticketKey: string;
  lang: Lang;
  onPick: (criterionId: string) => void;
}): React.ReactElement {
  const { state } = useScreen<WeaveMap>('weave-map', {
    scope: ticketKey,
    scopeType: 'ticket',
    language: lang,
  });
  return (
    <AsyncView
      state={state}
      empty={text(lang, 'no-criterion-written')}
      render={(data) => (
        <Stack space="space.100">
          <Text>{ui(lang, 'criteria')}</Text>
          <Text>{ui(lang, 'select-criterion')}</Text>
          {data.threads.map((thread) => (
            <Button key={thread.criterionId} onClick={() => onPick(thread.criterionId)}>
              {`${thread.criterionKey} — ${thread.text}`}
            </Button>
          ))}
        </Stack>
      )}
    />
  );
}

/** Le corps du panneau : la liste des critères, puis la fiche choisie. */
function PanelBody({ context }: { context: ScreenContext }): React.ReactElement {
  const [criterionId, setCriterionId] = useState('');
  if (context.issueKey === '') {
    return <Text>{ui(context.locale, 'no-scope')}</Text>;
  }
  if (criterionId === '') {
    return (
      <CriterionPicker
        ticketKey={context.issueKey}
        lang={context.locale}
        onPick={setCriterionId}
      />
    );
  }
  return (
    <Stack space="space.150">
      <Button onClick={() => setCriterionId('')}>{ui(context.locale, 'criteria')}</Button>
      <CriterionDetailScreen
        ticketKey={context.issueKey}
        criterionId={criterionId}
        lang={context.locale}
      />
    </Stack>
  );
}

mountScreen(<IssuePanel />);
