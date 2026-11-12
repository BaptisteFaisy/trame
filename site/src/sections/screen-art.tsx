/**
 * Les onze écrans de l'app, dessinés à la main dans la page.
 *
 * Chaque écran est un schéma SVG — aucune capture d'écran, aucune image
 * externe. Les formes portent le sens : vide, barré, interrompu, en pointillé.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement, ReactNode } from 'react';

type Art = () => ReactElement;

const FRAME = { width: 200, height: 120 };

function Wrap({ children }: { children: ReactNode }): ReactElement {
  return (
    <svg
      className="screen-art"
      viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0.5" y="0.5" width="199" height="119" className="screen-art__frame" />
      {children}
    </svg>
  );
}

/** 1. La carte de trame : la toile, et un trou qui laisse voir le fond. */
const WeaveMap: Art = () => (
  <Wrap>
    <g className="screen-art__warp">
      <path d="M40 22v78M75 22v78M110 22v78M145 22v78" />
    </g>
    <g className="screen-art__weft">
      <path d="M25 48h150M25 82h150" />
    </g>
    <rect x="100" y="72" width="20" height="20" className="screen-art__hole" />
    <rect x="30" y="38" width="20" height="20" className="screen-art__mesh" />
    <rect x="65" y="72" width="20" height="20" className="screen-art__mesh" />
    <rect x="135" y="38" width="20" height="20" className="screen-art__mesh" />
  </Wrap>
);

/** 2. La fiche critère : le texte, l'empreinte, les mailles. */
const CriterionDetail: Art = () => (
  <Wrap>
    <path d="M20 24h100M20 38h140M20 52h120" className="screen-art__text" />
    <rect x="20" y="66" width="70" height="16" className="screen-art__chip" />
    <rect x="98" y="66" width="40" height="16" className="screen-art__chip" />
    <path d="M20 96h160" className="screen-art__text" />
  </Wrap>
);

/** 3. L'explorateur des trous : des barres, la plus haute d'abord. */
const Holes: Art = () => (
  <Wrap>
    <rect x="20" y="24" width="120" height="12" className="screen-art__bar" />
    <rect x="20" y="46" width="90" height="12" className="screen-art__bar" />
    <rect x="20" y="68" width="60" height="12" className="screen-art__bar" />
    <rect x="20" y="90" width="36" height="12" className="screen-art__bar" />
    <path d="M150 24v78" className="screen-art__axis" />
  </Wrap>
);

/** 4. Le registre des perforations : deux dates et un écart. */
const Perforations: Art = () => (
  <Wrap>
    <circle cx="28" cy="34" r="7" className="screen-art__hole" />
    <path d="M44 30h90M44 40h60" className="screen-art__text" />
    <circle cx="28" cy="70" r="7" className="screen-art__hole" />
    <path d="M44 66h90M44 76h60" className="screen-art__text" />
    <path d="M150 24v72" className="screen-art__axis" />
  </Wrap>
);

/** 5. La file des fils détendus : un passage qui ne croise plus rien. */
const Dangling: Art = () => (
  <Wrap>
    <path d="M20 40h100" className="screen-art__weft" />
    <path d="M120 40c14 0 14 16 28 16" className="screen-art__loose" />
    <path d="M20 76h160" className="screen-art__weft" />
    <path d="M20 24v70" className="screen-art__warp" />
  </Wrap>
);

/** 6. Le bulletin : des chiffres datés. */
const Bulletin: Art = () => (
  <Wrap>
    <rect x="20" y="20" width="44" height="26" className="screen-art__box" />
    <rect x="78" y="20" width="44" height="26" className="screen-art__box" />
    <rect x="136" y="20" width="44" height="26" className="screen-art__box" />
    <path d="M20 62h160M20 76h120M20 90h90" className="screen-art__text" />
  </Wrap>
);

/** 7. Le certificat : une page datée, et ce qui n’est pas couvert. */
const Certificate: Art = () => (
  <Wrap>
    <rect x="30" y="16" width="140" height="88" className="screen-art__page" />
    <path d="M44 32h100M44 46h80" className="screen-art__text" />
    <circle cx="146" cy="84" r="12" className="screen-art__seal" />
    <path d="M140 84l4 4 8-8" className="screen-art__seal-mark" />
  </Wrap>
);

/** 8. La file de validation : des propositions à confirmer. */
const ValidationQueue: Art = () => (
  <Wrap>
    <rect x="20" y="22" width="90" height="18" className="screen-art__box" />
    <path d="M124 26l6 6 12-12" className="screen-art__seal-mark" />
    <rect x="20" y="52" width="90" height="18" className="screen-art__box" />
    <path d="M124 56l12 12M136 56l-12 12" className="screen-art__seal-mark" />
    <rect x="20" y="82" width="90" height="18" className="screen-art__box" />
    <path d="M124 86l6 6 12-12" className="screen-art__seal-mark" />
  </Wrap>
);

/** 9. Les zones à risque : des blocs, plus ou moins denses. */
const ZoneRisks: Art = () => (
  <Wrap>
    <rect x="20" y="20" width="70" height="36" className="screen-art__zone" />
    <rect x="100" y="20" width="70" height="36" className="screen-art__zone" />
    <rect x="20" y="64" width="70" height="36" className="screen-art__zone" />
    <rect x="100" y="64" width="70" height="36" className="screen-art__zone" />
    <path d="M28 46l10-10 12 8 10-14 22 12" className="screen-art__seal-mark" />
  </Wrap>
);

/** 10. Ce que voit Trame : quatre.absences, quatre mots. */
const Visibility: Art = () => (
  <Wrap>
    <rect x="20" y="22" width="52" height="16" className="screen-art__chip" />
    <rect x="80" y="22" width="52" height="16" className="screen-art__chip" />
    <rect x="20" y="50" width="52" height="16" className="screen-art__chip" />
    <rect x="80" y="50" width="52" height="16" className="screen-art__chip" />
    <path d="M140 22v44" className="screen-art__axis" />
    <path d="M20 84h150" className="screen-art__text" />
  </Wrap>
);

/** 11. L’historique de trame : des témoins successifs, datés. */
const Timeline: Art = () => (
  <Wrap>
    <path d="M20 60h160" className="screen-art__axis" />
    <circle cx="36" cy="60" r="6" className="screen-art__dot" />
    <circle cx="86" cy="60" r="6" className="screen-art__dot" />
    <circle cx="136" cy="60" r="6" className="screen-art__dot" />
    <path d="M36 48V30M86 48V36M136 48V26" className="screen-art__text" />
    <path d="M28 26h16M78 32h16M128 22h16" className="screen-art__text" />
  </Wrap>
);

/** Les onze dessins, dans l'ordre du §17. */
export const SCREEN_ARTS: Record<string, Art> = {
  'weave-map': WeaveMap,
  'criterion-detail': CriterionDetail,
  holes: Holes,
  perforations: Perforations,
  dangling: Dangling,
  bulletin: Bulletin,
  certificate: Certificate,
  'validation-queue': ValidationQueue,
  'zone-risks': ZoneRisks,
  visibility: Visibility,
  timeline: Timeline,
};
