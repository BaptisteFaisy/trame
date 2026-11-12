/**
 * Le pied de page : le dépôt, la licence, la mention de la soumission.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

const REPO = 'https://github.com/BaptisteFaisy/trame';

export interface FooterProps {
  lang: Lang;
}

export function Footer({ lang }: FooterProps): ReactElement {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <p className="site-footer__note">{t(lang, 'footer.note')}</p>
        <p className="site-footer__links">
          <a href={REPO} rel="noreferrer">
            {t(lang, 'footer.repo')}
          </a>
          <a href={`${REPO}/blob/main/LICENSE`} rel="noreferrer">
            {t(lang, 'footer.licence')}
          </a>
        </p>
        <p className="site-footer__offline">{t(lang, 'footer.offline')}</p>
      </div>
    </footer>
  );
}
