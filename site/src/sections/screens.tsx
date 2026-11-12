/**
 * Les onze écrans de l'app : leur nom (le vocabulaire du produit), ce qu'ils
 * montrent, et le dessin de chacun.
 *
 * La liste des écrans vient du registre gelé de l'app (`src/handlers/resolver.ts`)
 * et leurs noms du dictionnaire du domaine : le site ne réinvente pas le
 * vocabulaire (§4).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { screenLabels } from '../../../src/i18n/index.js';
import type { ScreenKey } from '../../../src/handlers/resolver.js';
import { Section } from '../components/section.js';
import { t } from '../i18n/index.js';
import type { Lang, SiteKey } from '../i18n/index.js';
import { SCREEN_ARTS } from './screen-art.js';

/** Pour chaque écran du registre, la phrase du site qui le décrit. */
const SHOWS: Record<ScreenKey, SiteKey> = {
  'weave-map': 'screens.shows.weave-map',
  'criterion-detail': 'screens.shows.criterion-detail',
  holes: 'screens.shows.holes',
  perforations: 'screens.shows.perforations',
  dangling: 'screens.shows.dangling',
  bulletin: 'screens.shows.bulletin',
  certificate: 'screens.shows.certificate',
  'validation-queue': 'screens.shows.validation-queue',
  'zone-risks': 'screens.shows.zone-risks',
  visibility: 'screens.shows.visibility',
  timeline: 'screens.shows.timeline',
};

export interface ScreensProps {
  lang: Lang;
}

export function Screens({ lang }: ScreensProps): ReactElement {
  const screens = screenLabels(lang);
  return (
    <Section id="screens" title={t(lang, 'screens.title')} lead={t(lang, 'screens.lead')}>
      <ol className="screens">
        {screens.map((screen, index) => {
          const Art = SCREEN_ARTS[screen.key];
          return (
            <li className="screen" key={screen.key}>
              <span className="screen__index">{index + 1}</span>
              {Art ? <Art /> : null}
              <h3>{screen.label}</h3>
              <p>{t(lang, SHOWS[screen.key])}</p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
