/**
 * La fiche d'un critère : ses liens, ses actes, son état — et pourquoi.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Badge } from '../components/badge.js';
import type { BadgeTone } from '../components/badge.js';
import { Table } from '../components/table.js';
import type { TableColumn, TableRow } from '../components/table.js';
import { label } from '../../../src/i18n/index.js';
import type { CriterionSheet } from '../demo/engine.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';
import { criterionText } from '../i18n/gloss.js';
import { isoDate } from './demo-panels.js';

/** Le badge de l'état d'un critère : un mot et un motif, jamais la couleur. */
const STATE_TONE: Record<CriterionSheet['state'], BadgeTone> = {
  hole: 'hole',
  perforated: 'perforation',
  covered: 'covered',
  unfalsifiable: 'unfalsifiable',
  deleted: 'deleted',
};

export interface DemoSheetProps {
  lang: Lang;
  sheet: CriterionSheet;
}

/** La phrase qui dit pourquoi le critère est dans cet état. */
function reasonOf(lang: Lang, sheet: CriterionSheet): string {
  if (sheet.state === 'hole') {
    return sheet.cause === 'never'
      ? t(lang, 'demo.criterion.noLink')
      : t(lang, 'demo.criterion.deadLink');
  }
  if (sheet.state === 'perforated') return t(lang, 'demo.criterion.stale');
  if (sheet.state === 'covered') return t(lang, 'demo.criterion.fresh');
  return t(lang, 'demo.criterion.unfalsifiable');
}

/** Le mot de l'état, dans la langue du site. */
function stateWord(lang: Lang, sheet: CriterionSheet): string {
  if (sheet.state === 'hole') return t(lang, 'demo.counters.holes');
  if (sheet.state === 'perforated') return t(lang, 'demo.counters.perforations');
  if (sheet.state === 'covered') return t(lang, 'demo.counters.covered');
  return t(lang, 'demo.criterion.unfalsifiable');
}

/** Les colonnes du tableau des mailles. */
function linkColumns(lang: Lang): TableColumn[] {
  return [
    { key: 'act', label: t(lang, 'demo.column.act') },
    { key: 'form', label: t(lang, 'demo.column.form') },
    { key: 'strength', label: t(lang, 'demo.column.strength') },
    { key: 'date', label: t(lang, 'demo.column.date') },
    { key: 'path', label: t(lang, 'demo.column.path') },
    { key: 'mesh', label: t(lang, 'demo.criterion.state') },
  ];
}

/** Les lignes du tableau des mailles, une par lien. */
function linkRows(lang: Lang, sheet: CriterionSheet): TableRow[] {
  return sheet.links.map((view) => ({
    key: view.link.id,
    cells: {
      act: view.verification?.name ?? view.link.verificationId,
      form: view.verification ? label(lang, 'form', view.verification.form) : '—',
      strength: view.verification ? label(lang, 'strength', view.verification.strength) : '—',
      date: view.verification ? isoDate(view.verification.executedAt) : '—',
      path: label(lang, 'path', view.link.path),
      mesh: (
        <Badge tone={view.holds ? 'covered' : 'loose'}>
          {view.holds ? t(lang, 'demo.criterion.holds') : t(lang, 'demo.criterion.dead')}
        </Badge>
      ),
    },
  }));
}

export function DemoSheet({ lang, sheet }: DemoSheetProps): ReactElement {
  const criterion = sheet.criterion;
  return (
    <div className="sheet">
      <h3>
        {criterion.ticketKey} / {criterion.criterionKey}
      </h3>
      <p className="sheet__text">{criterionText(lang, criterion.id, criterion.text)}</p>
      <p className="sheet__badges">
        <Badge tone={STATE_TONE[sheet.state]}>{stateWord(lang, sheet)}</Badge>{' '}
        <Badge tone="neutral">{label(lang, 'kind', criterion.kind)}</Badge>{' '}
        {criterion.falsifiable ? (
          <Badge tone="neutral">{t(lang, 'demo.criterion.falsifiable')}</Badge>
        ) : (
          <Badge tone="unfalsifiable">{t(lang, 'demo.criterion.unfalsifiable')}</Badge>
        )}
      </p>
      <p className="sheet__reason">{reasonOf(lang, sheet)}</p>
      {sheet.perforation ? (
        <p className="sheet__dates">
          {t(lang, 'demo.perforations.changed')}: {isoDate(sheet.perforation.changedAt)} ·{' '}
          {t(lang, 'demo.perforations.verified')}: {isoDate(sheet.perforation.verifiedAt)} ·{' '}
          {t(lang, 'demo.perforations.gap')}: {sheet.perforation.ageDays} d
        </p>
      ) : null}
      <h4>{t(lang, 'demo.criterion.links')}</h4>
      <Table
        caption={t(lang, 'demo.criterion.links')}
        columns={linkColumns(lang)}
        rows={linkRows(lang, sheet)}
        empty={t(lang, 'demo.criterion.noLink')}
      />
    </div>
  );
}