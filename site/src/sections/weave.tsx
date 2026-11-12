/**
 * La métaphore expliquée : le fil de chaîne, le passage de trame, la maille,
 * le trou, la perforation, le fil détendu — avec le dessin.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Section } from '../components/section.js';
import { WeaveArt } from '../components/weave-art.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

export interface WeaveProps {
  lang: Lang;
}

/** Les six mots de la métaphore, dans l'ordre du tissage. */
const TERMS: { key: Parameters<typeof t>[1]; title: Parameters<typeof t>[1] }[] = [
  { key: 'weave.warp.body', title: 'weave.warp.title' },
  { key: 'weave.weft.body', title: 'weave.weft.title' },
  { key: 'weave.mesh.body', title: 'weave.mesh.title' },
  { key: 'weave.hole.body', title: 'weave.hole.title' },
  { key: 'weave.perforation.body', title: 'weave.perforation.title' },
  { key: 'weave.loose.body', title: 'weave.loose.title' },
];

export function Weave({ lang }: WeaveProps): ReactElement {
  return (
    <Section id="weave" title={t(lang, 'weave.title')} lead={t(lang, 'weave.lead')}>
      <figure className="weave-figure">
        <WeaveArt />
        <figcaption>{t(lang, 'weave.caption')}</figcaption>
      </figure>
      <dl className="terms">
        {TERMS.map((term) => (
          <div className="terms__item" key={term.title}>
            <dt>{t(lang, term.title)}</dt>
            <dd>{t(lang, term.key)}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
