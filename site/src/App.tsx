/**
 * La coquille du site : l'en-tête, les sections, la bascule de langue.
 *
 * La langue (anglais par défaut, français sur demande) est portée ici et
 * descend dans les sections. L'état de la démo — le projet semé passé dans
 * le moteur — est calculé une fois, puis partagé.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Nav } from './components/nav.js';
import { buildDemoState } from './demo/engine.js';
import { initialLang, otherLang, rememberLang, t } from './i18n/index.js';
import type { Lang } from './i18n/index.js';
import { Architecture } from './sections/architecture.js';
import { Demo } from './sections/demo.js';
import { Footer } from './sections/footer.js';
import { Hero } from './sections/hero.js';
import { Limits } from './sections/limits.js';
import { Problem } from './sections/problem.js';
import { Recipe } from './sections/recipe.js';
import { Screens } from './sections/screens.js';
import { Weave } from './sections/weave.js';

export function App(): ReactElement {
  const [lang, setLang] = useState<Lang>(initialLang);
  const state = useMemo(() => buildDemoState(), []);

  const toggleLang = useCallback(() => {
    setLang((current) => {
      const next = otherLang(current);
      rememberLang(next);
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  return (
    <>
      <a className="skip-link" href="#content">
        {t(lang, 'nav.skip')}
      </a>
      <Nav lang={lang} onToggleLang={toggleLang} />
      <main id="content">
        <Hero lang={lang} state={state} />
        <Problem lang={lang} />
        <Weave lang={lang} />
        <Demo lang={lang} state={state} />
        <Screens lang={lang} />
        <Limits lang={lang} />
        <Architecture lang={lang} />
        <Recipe lang={lang} />
      </main>
      <Footer lang={lang} />
    </>
  );
}
