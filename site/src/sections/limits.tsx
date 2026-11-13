/**
 * Ce que l'app ne fait pas (§5, §14) : elle ne bloque pas, elle n'atteste
 * pas, elle n'invente pas, elle ne note personne — et les quatre absences
 * qu'elle sait distinguer.
 *
 * Les libellés des absences viennent du dictionnaire du domaine : c'est lui
 * qui connaît le vocabulaire (§4).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Section } from '../components/section.js';
import { label } from '../../../src/i18n/index.js';
import type { AbsenceKind } from '../../../src/types.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

/** Les quatre absences, dans l'ordre du dictionnaire du domaine. */
const ABSENCES: AbsenceKind[] = ['no-right', 'no-data', 'no-test', 'no-criterion'];

export interface LimitsProps {
  lang: Lang;
}

export function Limits({ lang }: LimitsProps): ReactElement {
  const cards = [
    { title: 'limits.no-block.title', body: 'limits.no-block.body' },
    { title: 'limits.no-attest.title', body: 'limits.no-attest.body' },
    { title: 'limits.no-invent.title', body: 'limits.no-invent.body' },
    { title: 'limits.no-score.title', body: 'limits.no-score.body' },
  ] as const;
  return (
    <Section id="limits" title={t(lang, 'limits.title')} lead={t(lang, 'limits.lead')}>
      <ul className="cards">
        {cards.map((card) => (
          <li className="card card--limit" key={card.title}>
            <h3>{t(lang, card.title)}</h3>
            <p>{t(lang, card.body)}</p>
          </li>
        ))}
      </ul>
      <div className="absences">
        <h3>{t(lang, 'limits.absences.title')}</h3>
        <p>{t(lang, 'limits.absences.lead')}</p>
        <ul className="absences__list">
          {ABSENCES.map((absence) => (
            <li key={absence}>
              <span className="absences__mark" aria-hidden="true">
                {absence === 'no-right' ? '⊘' : absence === 'no-data' ? '○' : absence === 'no-test' ? '▦' : '∅'}
              </span>
              {label(lang, 'absence', absence)}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
