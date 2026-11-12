/**
 * Comment juger Trame en cinq minutes : cinq étapes, et les liens qui
 * permettent de les faire tout de suite.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Section } from '../components/section.js';
import { t } from '../i18n/index.js';
import type { Lang, SiteKey } from '../i18n/index.js';

const REPO = 'https://github.com/BaptisteFaisy/trame';

/** Les cinq étapes, et le lien qui va avec. */
const STEPS: { title: SiteKey; body: SiteKey; href: string; link: SiteKey }[] = [
  {
    title: 'recipe.step1.title',
    body: 'recipe.step1.body',
    href: `${REPO}#readme`,
    link: 'recipe.link.readme',
  },
  {
    title: 'recipe.step2.title',
    body: 'recipe.step2.body',
    href: '#demo',
    link: 'recipe.link.demo',
  },
  {
    title: 'recipe.step3.title',
    body: 'recipe.step3.body',
    href: `${REPO}/blob/main/docs/RECETTE.md`,
    link: 'recipe.link.recette',
  },
  {
    title: 'recipe.step4.title',
    body: 'recipe.step4.body',
    href: `${REPO}/blob/main/docs/JUDGES.md`,
    link: 'recipe.link.judges',
  },
  {
    title: 'recipe.step5.title',
    body: 'recipe.step5.body',
    href: `${REPO}/blob/main/docs/VIDEO-SCRIPT.md`,
    link: 'recipe.link.video',
  },
];

export interface RecipeProps {
  lang: Lang;
}

export function Recipe({ lang }: RecipeProps): ReactElement {
  return (
    <Section id="recipe" title={t(lang, 'recipe.title')} lead={t(lang, 'recipe.lead')}>
      <ol className="recipe">
        {STEPS.map((step, index) => (
          <li className="recipe__step" key={step.title}>
            <span className="recipe__index">{index + 1}</span>
            <h3>{t(lang, step.title)}</h3>
            <p>{t(lang, step.body)}</p>
            <a href={step.href} rel="noreferrer">
              {t(lang, step.link)}
            </a>
          </li>
        ))}
      </ol>
      <p className="recipe__links">
        <a href={REPO} rel="noreferrer">
          {t(lang, 'footer.repo')}
        </a>
      </p>
    </Section>
  );
}
