/**
 * L'angle mort : trois exemples concrets, ceux que personne ne voit.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Section } from '../components/section.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

export interface ProblemProps {
  lang: Lang;
}

export function Problem({ lang }: ProblemProps): ReactElement {
  return (
    <Section id="problem" title={t(lang, 'problem.title')} lead={t(lang, 'problem.lead')}>
      <ol className="cards">
        <li className="card card--hole">
          <h3>{t(lang, 'problem.case1.title')}</h3>
          <p>{t(lang, 'problem.case1.body')}</p>
        </li>
        <li className="card card--perforation">
          <h3>{t(lang, 'problem.case2.title')}</h3>
          <p>{t(lang, 'problem.case2.body')}</p>
        </li>
        <li className="card card--loose">
          <h3>{t(lang, 'problem.case3.title')}</h3>
          <p>{t(lang, 'problem.case3.body')}</p>
        </li>
      </ol>
      <p className="problem__outcome">{t(lang, 'problem.outcome')}</p>
    </Section>
  );
}
