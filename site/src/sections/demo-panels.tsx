/**
 * Les panneaux de la démo : compteurs, axes, trous, perforations, fils
 * détendus, bulletin, certificat.
 *
 * Tous les chiffres viennent de la vue calculée par le moteur (voir
 * `site/src/demo/engine.ts`) : aucun n'est écrit ici.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Badge } from '../components/badge.js';
import { Counter } from '../components/counter.js';
import { Table } from '../components/table.js';
import type { TableColumn, TableRow } from '../components/table.js';
import { label } from '../../../src/i18n/index.js';
import type { ScopeView } from '../demo/engine.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';
import { criterionText } from '../i18n/gloss.js';

/** La date d'un horodatage ISO : le jour, sans calcul de fuseau. */
export function isoDate(value: string): string {
  return value.slice(0, 10);
}

/** Un score, avec ses quatre décimales : il se recalcule à la main. */
function score4(value: number): string {
  return value.toFixed(4);
}

/** Le texte d'un critère du périmètre, dans la langue du site. */
function textOf(lang: Lang, view: ScopeView, criterionId: string): string {
  const criterion = view.criteria.find((one) => one.id === criterionId);
  return criterionText(lang, criterionId, criterion?.text ?? criterionId);
}

/* ---------------------------------------------------------------- compteurs */

export function Counters({ lang, view }: { lang: Lang; view: ScopeView }): ReactElement {
  const coverage = view.coverage;
  return (
    <div className="counters">
      <Counter value={view.criteria.length} label={t(lang, 'demo.counters.criteria')} />
      <Counter value={coverage.criteriaTotal} label={t(lang, 'demo.counters.falsifiable')} />
      <Counter
        value={coverage.unfalsifiableCount}
        label={t(lang, 'demo.counters.unfalsifiable')}
        tone="warn"
      />
      <Counter
        value={coverage.coveredDeclared}
        total={coverage.criteriaTotal}
        label={t(lang, 'demo.counters.covered')}
        tone="good"
      />
      <Counter
        value={coverage.coveredProvisional}
        label={t(lang, 'demo.counters.provisional')}
        tone="warn"
      />
      <Counter value={coverage.holes} label={t(lang, 'demo.counters.holes')} tone="bad" />
      <Counter value={coverage.proven} label={t(lang, 'demo.counters.proven')} tone="good" />
      <Counter
        value={view.perforations.length}
        label={t(lang, 'demo.counters.perforations')}
        tone="warn"
      />
      <Counter
        value={view.dangling.length}
        label={t(lang, 'demo.counters.dangling')}
        tone="bad"
      />
    </div>
  );
}

/* -------------------------------------------------------------------- axes */

export function Axes({ lang, view }: { lang: Lang; view: ScopeView }): ReactElement {
  const coverage = view.coverage;
  const groups = [
    {
      title: t(lang, 'demo.axes.strength'),
      lines: [
        { word: label(lang, 'strength', 'machine'), value: coverage.byStrength.machine },
        { word: label(lang, 'strength', 'attested'), value: coverage.byStrength.attested },
        { word: label(lang, 'strength', 'declared'), value: coverage.byStrength.declared },
      ],
    },
    {
      title: t(lang, 'demo.axes.link'),
      lines: [
        { word: label(lang, 'link', 'declared'), value: coverage.byLink.declared },
        { word: label(lang, 'link', 'confirmed'), value: coverage.byLink.confirmed },
        { word: label(lang, 'link', 'derived'), value: coverage.byLink.derived },
      ],
    },
    {
      title: t(lang, 'demo.axes.freshness'),
      lines: [
        { word: label(lang, 'freshness', 'current'), value: coverage.byFreshness.current },
        { word: label(lang, 'freshness', 'stale'), value: coverage.byFreshness.stale },
      ],
    },
  ];
  return (
    <div className="axes">
      <h3>{t(lang, 'demo.axes.title')}</h3>
      <div className="axes__grid">
        {groups.map((group) => (
          <div className="axes__group" key={group.title}>
            <h4>{group.title}</h4>
            <ul>
              {group.lines.map((line) => (
                <li key={line.word}>
                  <span className="axes__count">{line.value}</span>
                  <span>{line.word}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- trous */

/** Le calcul de la priorité : les trois termes, puis la formule. */
function MetricTerms({
  lang,
  terms,
}: {
  lang: Lang;
  terms: readonly { name: string; weight: number; value: number; because: string }[];
}): ReactElement {
  const names: Record<string, string> = {
    kind: t(lang, 'demo.term.kind'),
    'zone-risk': t(lang, 'demo.term.zone'),
    recurrence: t(lang, 'demo.term.recurrence'),
  };
  return (
    <div className="metric">
      <p className="metric__formula">{t(lang, 'demo.holes.formula')}</p>
      <ul className="metric__terms">
        {terms.map((term) => (
          <li key={term.name}>
            <span className="metric__name">{names[term.name] ?? term.name}</span>
            <span className="metric__numbers">
              weight {term.weight.toFixed(2)} × value {term.value.toFixed(2)}
            </span>
            <span className="metric__because" lang="fr">
              {term.because}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HolesTable({ lang, view }: { lang: Lang; view: ScopeView }): ReactElement {
  const columns: TableColumn[] = [
    { key: 'criterion', label: t(lang, 'demo.column.criterion') },
    { key: 'kind', label: t(lang, 'demo.holes.kind') },
    { key: 'zone', label: t(lang, 'demo.holes.zone') },
    { key: 'score', label: t(lang, 'demo.holes.score'), align: 'numeric' },
    { key: 'cause', label: t(lang, 'demo.column.cause') },
    { key: 'calculation', label: t(lang, 'demo.holes.calculation') },
  ];
  const rows: TableRow[] = view.holes.map((hole) => ({
    key: hole.id,
    cells: {
      criterion: (
        <>
          <strong>
            {hole.ticketKey} / {hole.criterionKey}
          </strong>
          <span className="cell__sub">{textOf(lang, view, hole.criterionId)}</span>
        </>
      ),
      kind: label(lang, 'kind', hole.kind),
      zone: hole.zone ?? '—',
      score: score4(hole.priorityScore),
      cause: (
        <Badge tone="hole">
          {view.holeCauses[hole.id] === 'lost'
            ? t(lang, 'demo.holes.lost')
            : t(lang, 'demo.holes.never')}
        </Badge>
      ),
      calculation: <MetricTerms lang={lang} terms={hole.priorityTerms} />,
    },
  }));
  return (
    <Table
      caption={t(lang, 'demo.holes.title')}
      columns={columns}
      rows={rows}
      empty={t(lang, 'demo.holes.empty')}
    />
  );
}

/* ------------------------------------------------------------- perforations */

export function PerforationsTable({
  lang,
  view,
}: {
  lang: Lang;
  view: ScopeView;
}): ReactElement {
  const columns: TableColumn[] = [
    { key: 'criterion', label: t(lang, 'demo.column.criterion') },
    { key: 'changed', label: t(lang, 'demo.perforations.changed') },
    { key: 'verified', label: t(lang, 'demo.perforations.verified') },
    { key: 'gap', label: t(lang, 'demo.perforations.gap'), align: 'numeric' },
    { key: 'class', label: t(lang, 'demo.perforations.class') },
  ];
  const rows: TableRow[] = view.perforations.map((perforation) => ({
    key: perforation.id,
    cells: {
      criterion: (
        <>
          <strong>
            {perforation.ticketKey} / {perforation.criterionKey}
          </strong>
          <span className="cell__sub">
            {textOf(lang, view, perforation.criterionId)}
          </span>
        </>
      ),
      changed: isoDate(perforation.changedAt),
      verified: isoDate(perforation.verifiedAt),
      gap: `${perforation.ageDays} d`,
      class: <Badge tone="perforation">{label(lang, 'perforation', perforation.klass)}</Badge>,
    },
  }));
  return (
    <Table
      caption={t(lang, 'demo.perforations.title')}
      columns={columns}
      rows={rows}
      empty={t(lang, 'demo.perforations.empty')}
    />
  );
}

/* ------------------------------------------------------------ fils détendus */

export function DanglingTable({ lang, view }: { lang: Lang; view: ScopeView }): ReactElement {
  const columns: TableColumn[] = [
    { key: 'act', label: t(lang, 'demo.column.act') },
    { key: 'reason', label: t(lang, 'demo.dangling.reason') },
    { key: 'impact', label: t(lang, 'demo.dangling.impact'), align: 'numeric' },
    { key: 'detected', label: t(lang, 'demo.bulletin.date') },
  ];
  const rows: TableRow[] = view.dangling.map((thread) => ({
    key: thread.id,
    cells: {
      act: thread.verificationName,
      reason: <Badge tone="loose">{label(lang, 'dangling', thread.reason)}</Badge>,
      impact: thread.impact,
      detected: isoDate(thread.detectedAt),
    },
  }));
  return (
    <Table
      caption={t(lang, 'demo.dangling.title')}
      columns={columns}
      rows={rows}
      empty={t(lang, 'demo.dangling.empty')}
    />
  );
}

/* ----------------------------------------------------------------- bulletin */

export function Bulletin({ lang, view }: { lang: Lang; view: ScopeView }): ReactElement {
  const bulletin = view.bulletin;
  const coverage = bulletin.coverage;
  return (
    <div className="bulletin">
      <h3>{t(lang, 'demo.bulletin.title')}</h3>
      <dl className="bulletin__facts">
        <div>
          <dt>{t(lang, 'demo.bulletin.scope')}</dt>
          <dd>
            {bulletin.scope} ({bulletin.scopeType})
          </dd>
        </div>
        <div>
          <dt>{t(lang, 'demo.bulletin.date')}</dt>
          <dd>{isoDate(bulletin.computedAt)}</dd>
        </div>
        <div>
          <dt>{t(lang, 'demo.counters.covered')}</dt>
          <dd>
            {coverage.coveredDeclared} / {coverage.criteriaTotal}
          </dd>
        </div>
        <div>
          <dt>{t(lang, 'demo.bulletin.unfalsifiable')}</dt>
          <dd>
            {bulletin.unfalsifiableShare.percent} % ({bulletin.unfalsifiableShare.count} /{' '}
            {bulletin.unfalsifiableShare.total})
          </dd>
        </div>
        <div>
          <dt>{t(lang, 'demo.bulletin.added')}</dt>
          <dd>
            {bulletin.addedDuringSprint.percent} % ({bulletin.addedDuringSprint.count} /{' '}
            {bulletin.addedDuringSprint.total})
          </dd>
        </div>
      </dl>
      <h4>{t(lang, 'demo.bulletin.top')}</h4>
      {bulletin.topHoles.length === 0 ? (
        <p>{t(lang, 'demo.holes.empty')}</p>
      ) : (
        <ol className="bulletin__holes">
          {bulletin.topHoles.map((hole) => (
            <li key={hole.id}>
              <strong>
                {hole.ticketKey} / {hole.criterionKey}
              </strong>{' '}
              — {score4(hole.priorityScore)} — {label(lang, 'kind', hole.kind)}
            </li>
          ))}
        </ol>
      )}
      <p className="bulletin__witness">{t(lang, 'demo.bulletin.witness')}</p>
    </div>
  );
}

/* --------------------------------------------------------------- certificat */

export function Certificate({ lang, view }: { lang: Lang; view: ScopeView }): ReactElement {
  const certificate = view.certificate;
  const columns: TableColumn[] = [
    { key: 'criterion', label: t(lang, 'demo.column.criterion') },
    { key: 'form', label: t(lang, 'demo.column.form') },
    { key: 'strength', label: t(lang, 'demo.column.strength') },
    { key: 'date', label: t(lang, 'demo.column.date') },
    { key: 'path', label: t(lang, 'demo.column.path') },
  ];
  const rows: TableRow[] = certificate.lines.map((line) => ({
    key: `${line.ticketKey}-${line.criterionKey}-${line.executedAt}`,
    cells: {
      criterion: `${line.ticketKey} / ${line.criterionKey}`,
      form: label(lang, 'form', line.form),
      strength: label(lang, 'strength', line.strength),
      date: isoDate(line.executedAt),
      path: label(lang, 'path', line.linkPath),
    },
  }));
  return (
    <div className="certificate">
      <h3>{t(lang, 'demo.certificate.title')}</h3>
      <p className="certificate__lead">{t(lang, 'demo.certificate.lead')}</p>
      <h4>{t(lang, 'demo.certificate.covered')}</h4>
      <Table
        caption={t(lang, 'demo.certificate.lines')}
        columns={columns}
        rows={rows}
        empty={t(lang, 'demo.holes.empty')}
      />
      <h4>{t(lang, 'demo.certificate.notCovered')}</h4>
      <ul className="certificate__list">
        {certificate.notCovered.map((criterion) => (
          <li key={criterion.id}>
            <Badge tone="hole">{t(lang, 'demo.criterion.notCovered')}</Badge>{' '}
            <strong>
              {criterion.ticketKey} / {criterion.criterionKey}
            </strong>{' '}
            — {criterionText(lang, criterion.id, criterion.text)}
          </li>
        ))}
      </ul>
      <h4>{t(lang, 'demo.certificate.unfalsifiable')}</h4>
      <ul className="certificate__list">
        {certificate.unfalsifiable.map((criterion) => (
          <li key={criterion.id}>
            <Badge tone="unfalsifiable">{t(lang, 'demo.criterion.unfalsifiable')}</Badge>{' '}
            <strong>
              {criterion.ticketKey} / {criterion.criterionKey}
            </strong>{' '}
            — {criterionText(lang, criterion.id, criterion.text)}
          </li>
        ))}
      </ul>
      <h4>{t(lang, 'demo.certificate.open')}</h4>
      <p>
        {certificate.perforations.length} — {t(lang, 'demo.counters.perforations')} ·{' '}
        {certificate.dangling.length} — {t(lang, 'demo.counters.dangling')}
      </p>
    </div>
  );
}
