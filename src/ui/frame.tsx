/**
 * Le cadre commun des écrans : le conteneur, le contexte, les trois états,
 * l'en-tête d'un écran et le bloc de couverture.
 *
 * Ces briques sont **partagées** : les onze écrans de §17 ont la même forme
 * (chargement, erreur, donnée), le même en-tête (périmètre, date) et le même
 * bloc de couverture (les trois axes, jamais fusionnés — §8.1, §24.3).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import React, { useState } from 'react';
import type { AsyncState, ScreenContext, ScreenEmpty } from './bridge';
import { isEmptyScreen, useScreenContext } from './bridge';
import { EmptyView, FigureList, Label, RadioGroup, SectionMessage, Spinner, Stack, Text, Textfield, Button, Heading } from './kit';
import type { Lang } from '../i18n/index';
import { t } from '../i18n/index';
import type { ScopeType } from '../types';
import type { AxisLine, CoverageView } from '../viewmodel/common';
import { text } from '../viewmodel/labels';
import { ui } from './labels';

/* ------------------------------------------------------------------ cadre */

/** Le conteneur d'un module : en UI Kit 2, Jira fournit la gouttière. */
export function ScreenFrame({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Stack space="space.200">{children}</Stack>;
}

/* --------------------------------------------------------------- contexte */

/**
 * La porte du contexte : elle attend le contexte de Forge et le passe à
 * l'écran. Jamais d'exception, jamais de page blanche.
 */
export function ContextGate({
  children,
}: {
  children: (context: ScreenContext) => React.ReactNode;
}): React.ReactElement {
  const { state } = useScreenContext();
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') {
    return <SectionMessage appearance="error">{state.message}</SectionMessage>;
  }
  return <>{children(state.data)}</>;
}

/* ------------------------------------------------------------------ états */

/**
 * Les trois états d'un écran : chargement, erreur, ou donnée.
 *
 * La réponse « aucun critère écrit » est un **quatrième** état : l'écran
 * affiche le mot du serveur, jamais « 0 % » (§24.16).
 */
export function AsyncView<T>({
  state,
  empty,
  render,
}: {
  state: AsyncState<T | ScreenEmpty>;
  empty: string;
  render: (data: T) => React.ReactElement;
}): React.ReactElement {
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') {
    return <SectionMessage appearance="error">{state.message}</SectionMessage>;
  }
  if (isEmptyScreen(state.data)) return <EmptyView word={empty} />;
  return render(state.data as T);
}

/* ---------------------------------------------------------------- en-tête */

/** L'en-tête d'un écran : son titre, son périmètre, la date du calcul. */
export function ScreenHeader({
  lang,
  title,
  scope,
  computedAt,
}: {
  lang: Lang;
  title: string;
  scope: string;
  computedAt: string;
}): React.ReactElement {
  return (
    <Stack space="space.050">
      <Heading as="h3">{title}</Heading>
      <Text>{`${text(lang, 'ticket')} · ${scope}`}</Text>
      <Text>{`${text(lang, 'date')} · ${computedAt}`}</Text>
    </Stack>
  );
}

/* -------------------------------------------------------------- couverture */

/** Un axe de la couverture : force, liaison ou fraîcheur. Jamais fusionné. */
function AxisBlock({
  title,
  lines,
}: {
  title: string;
  lines: readonly AxisLine[];
}): React.ReactElement {
  return (
    <Stack space="space.050">
      <Text>{title}</Text>
      {lines.map((line) => (
        <Text key={line.key}>{`${line.label} — ${line.count}`}</Text>
      ))}
    </Stack>
  );
}

/**
 * Le bloc de couverture : les trois axes décomposés et les figures.
 *
 * Un périmètre sans aucun critère écrit n'affiche **aucun** pourcentage : il
 * affiche le mot du serveur (§24.16).
 */
export function CoverageBlock({
  lang,
  coverage,
}: {
  lang: Lang;
  coverage: CoverageView;
}): React.ReactElement {
  return (
    <Stack space="space.150">
      <Heading as="h4">{ui(lang, 'coverage')}</Heading>
      {coverage.noCriterionWritten ? <Text>{coverage.message}</Text> : null}
      <AxisBlock title={t(lang, 'axis.strength')} lines={coverage.byStrength} />
      <AxisBlock title={t(lang, 'axis.link')} lines={coverage.byLink} />
      <AxisBlock title={t(lang, 'axis.freshness')} lines={coverage.byFreshness} />
      <FigureList lang={lang} figures={coverage.figures} />
    </Stack>
  );
}

/* -------------------------------------------------------------- périmètre */

/** Les quatre types de périmètre, et le mot qui les nomme. */
const SCOPE_TYPES: ScopeType[] = ['ticket', 'sprint', 'project', 'version'];

/** Les options du sélecteur de type de périmètre. */
function scopeTypeOptions(lang: Lang): Array<{ name: string; label: string; value: string }> {
  return SCOPE_TYPES.map((type) => ({
    name: 'trame-scope-type',
    label: ui(lang, type),
    value: type,
  }));
}

/**
 * La demande de périmètre : un écran global ou un gadget n'a pas de projet
 * dans son contexte. L'utilisateur saisit ce qu'il veut mesurer — l'app ne
 * l'invente pas.
 */
export function ScopePrompt({
  lang,
  onSubmit,
}: {
  lang: Lang;
  onSubmit: (scope: string, scopeType: ScopeType) => void;
}): React.ReactElement {
  const [value, setValue] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('project');
  const invalid = value.trim() === '';
  return (
    <Stack space="space.150">
      <Text>{ui(lang, 'no-scope')}</Text>
      <Label labelFor="trame-scope">{ui(lang, 'scope')}</Label>
      <Textfield
        id="trame-scope"
        name="trame-scope"
        value={value}
        onChange={(event) => setValue(String(event.target.value ?? ''))}
      />
      <Text>{ui(lang, 'scope-type')}</Text>
      <RadioGroup
        name="trame-scope-type"
        options={scopeTypeOptions(lang)}
        value={scopeType}
        onChange={(event) => setScopeType(String(event.target.value ?? 'project') as ScopeType)}
      />
      <Button
        appearance="primary"
        isDisabled={invalid}
        onClick={() => onSubmit(value.trim(), scopeType)}
      >
        {ui(lang, 'load')}
      </Button>
    </Stack>
  );
}
