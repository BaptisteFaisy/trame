/**
 * La démo vivante : le moteur, les données semées, et deux listes pour
 * choisir ce qu'on regarde (un ticket, un critère).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Section } from '../components/section.js';
import { buildCriterionSheet, buildScopeView } from '../demo/engine.js';
import type { DemoState, ScopeView } from '../demo/engine.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';
import { criterionText } from '../i18n/gloss.js';
import {
  Axes,
  Bulletin,
  Certificate,
  Counters,
  DanglingTable,
  HolesTable,
  PerforationsTable,
} from './demo-panels.js';
import { DemoSheet } from './demo-sheet.js';

export interface DemoProps {
  lang: Lang;
  state: DemoState;
}

interface PickerProps {
  lang: Lang;
  state: DemoState;
  view: ScopeView;
  ticket: string;
  criterionId: string;
  onTicket: (value: string) => void;
  onCriterion: (value: string) => void;
}

/** Les deux listes de choix : le ticket, puis le critère. */
function Picker({
  lang,
  state,
  view,
  ticket,
  criterionId,
  onTicket,
  onCriterion,
}: PickerProps): ReactElement {
  return (
    <div className="demo__controls">
      <label className="field">
        <span className="field__label">{t(lang, 'demo.ticket.label')}</span>
        <select value={ticket} onChange={(event) => onTicket(event.target.value)}>
          <option value="">{t(lang, 'demo.ticket.all')}</option>
          {state.project.issues.map((issue) => (
            <option key={issue.key} value={issue.key}>
              {issue.key} — {issue.summary}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">{t(lang, 'demo.criterion.label')}</span>
        <select value={criterionId} onChange={(event) => onCriterion(event.target.value)}>
          <option value="">—</option>
          {view.criteria.map((criterion) => (
            <option key={criterion.id} value={criterion.id}>
              {criterion.ticketKey} / {criterion.criterionKey} —{' '}
              {criterionText(lang, criterion.id, criterion.text)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function Demo({ lang, state }: DemoProps): ReactElement {
  const [ticket, setTicket] = useState('');
  const [criterionId, setCriterionId] = useState('');
  const view = useMemo(() => buildScopeView(state, ticket || undefined), [state, ticket]);
  const sheet = useMemo(
    () => (criterionId ? buildCriterionSheet(state, criterionId) : null),
    [state, criterionId],
  );
  return (
    <Section id="demo" title={t(lang, 'demo.title')} lead={t(lang, 'demo.lead')}>
      <Picker
        lang={lang}
        state={state}
        view={view}
        ticket={ticket}
        criterionId={criterionId}
        onTicket={(value) => {
          setTicket(value);
          setCriterionId('');
        }}
        onCriterion={setCriterionId}
      />
      <p className="demo__note">{t(lang, 'demo.source.note')}</p>
      <h3>{t(lang, 'demo.counters.title')}</h3>
      <Counters lang={lang} view={view} />
      <Axes lang={lang} view={view} />
      <HolesTable lang={lang} view={view} />
      <PerforationsTable lang={lang} view={view} />
      <DanglingTable lang={lang} view={view} />
      <div className="demo__columns">
        <Bulletin lang={lang} view={view} />
        <Certificate lang={lang} view={view} />
      </div>
      <div className="demo__sheet">
        {sheet ? (
          <DemoSheet lang={lang} sheet={sheet} />
        ) : (
          <p className="demo__hint">{t(lang, 'demo.criterion.pick')}</p>
        )}
      </div>
    </Section>
  );
}