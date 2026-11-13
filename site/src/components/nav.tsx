/**
 * L'en-tête : la marque, les ancres vers les sections, la bascule de langue,
 * le dépôt. Aucune ressource externe, aucun script ajouté.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

export const REPO_URL = 'https://github.com/Tradoooo/trame';

/** Les ancres, dans l'ordre de lecture de la page. */
const ANCHORS: { href: string; key: Parameters<typeof t>[1] }[] = [
  { href: '#problem', key: 'nav.problem' },
  { href: '#weave', key: 'nav.weave' },
  { href: '#demo', key: 'nav.demo' },
  { href: '#screens', key: 'nav.screens' },
  { href: '#limits', key: 'nav.limits' },
  { href: '#architecture', key: 'nav.architecture' },
  { href: '#recipe', key: 'nav.recipe' },
];

export interface NavProps {
  lang: Lang;
  onToggleLang: () => void;
}

export function Nav({ lang, onToggleLang }: NavProps): ReactElement {
  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <a className="site-brand" href="#content">
          <img src="./favicon.svg" alt="" width="26" height="26" />
          <span className="site-brand__name">Trame</span>
        </a>
        <nav className="site-nav" aria-label={t(lang, 'nav.skip')}>
          <ul>
            {ANCHORS.map((anchor) => (
              <li key={anchor.href}>
                <a href={anchor.href}>{t(lang, anchor.key)}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__actions">
          <a className="button button--ghost" href={REPO_URL} rel="noreferrer">
            {t(lang, 'nav.repo')}
          </a>
          <button type="button" className="button" onClick={onToggleLang}>
            {t(lang, 'nav.language')}
          </button>
        </div>
      </div>
    </header>
  );
}
