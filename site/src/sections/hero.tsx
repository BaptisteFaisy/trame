/**
 * L'ouverture : la promesse, le slogan, deux portes (la démo, la recette) et
 * les chiffres du moteur — calculés, jamais recopiés.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';
import type { DemoState } from '../demo/engine.js';

export interface HeroProps {
  lang: Lang;
  state: DemoState;
}

export function Hero({ lang, state }: HeroProps): ReactElement {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div className="hero__text">
          <p className="hero__eyebrow">{t(lang, 'hero.eyebrow')}</p>
          <h1 id="hero-title" className="hero__title">
            {t(lang, 'hero.title')}
          </h1>
          <p className="hero__tagline">{t(lang, 'hero.tagline')}</p>
          <p className="hero__slogan">« {t(lang, 'hero.slogan')} »</p>
          <p className="hero__promise">{t(lang, 'hero.promise')}</p>
          <p className="hero__cta">
            <a className="button button--primary" href="#demo">
              {t(lang, 'hero.cta.demo')}
            </a>
            <a className="button" href="#recipe">
              {t(lang, 'hero.cta.recipe')}
            </a>
          </p>
        </div>
        <aside className="hero__live" aria-label={t(lang, 'hero.live.label')}>
          <p className="hero__live-label">{t(lang, 'hero.live.label')}</p>
          <ul className="hero__live-list">
            <li>
              <strong>{state.project.criteria.length}</strong> {t(lang, 'hero.live.criteria')}
            </li>
            <li>
              <strong>{state.holes.length}</strong> {t(lang, 'hero.live.holes')}
            </li>
            <li>
              <strong>{state.perforations.length}</strong> {t(lang, 'hero.live.perforations')}
            </li>
            <li>
              <strong>{state.dangling.length}</strong> {t(lang, 'hero.live.dangling')}
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
