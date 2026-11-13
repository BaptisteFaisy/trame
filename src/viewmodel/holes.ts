/**
 * Vue-modèle de l'explorateur de trous (§12.1, §11).
 *
 * Les trous sont classés par le métré, et **chaque trou affiche le calcul qui
 * l'a classé** (§22 explicabilité, §24.11) : le score et ses trois termes.
 * Les effectifs sont toujours là ; un pourcentage seul n'est jamais montré.
 *
 * Pur : il reçoit les trous et la trame, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import type { Coverage, Hole, ScopeType } from '../types';
import { coverageView, holeLine, tableHead } from './common';
import type { CoverageView, HoleLine, RegisterRow, TableHead } from './common';
import { text } from './labels';

/* ------------------------------------------------------------------ entrée */

export interface HolesInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  /** Les trous, classés par le métré. */
  holes: readonly Hole[];
  /** La trame du périmètre. */
  coverage: Coverage;
  /** Le nombre de trous trouvés, avant la limite d'affichage. */
  total: number;
}

/* ------------------------------------------------------------------ sortie */

export interface HoleExplorer {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  holes: HoleLine[];
  /** Le nombre de trous affichés, et le nombre total trouvé. */
  shown: number;
  total: number;
  coverage: CoverageView;
}

/** Les colonnes de l'explorateur : le trou, sa priorité, son calcul. */
function headOf(lang: Lang): TableHead {
  return tableHead([
    text(lang, 'ticket'),
    text(lang, 'criterion'),
    text(lang, 'kind'),
    text(lang, 'zone'),
    text(lang, 'priority'),
    text(lang, 'calculation'),
  ]);
}

/** Une ligne de l'explorateur : les cellules, puis l'état du trou. */
function rowOf(hole: HoleLine): RegisterRow {
  return {
    cells: [
      hole.ticketKey,
      hole.criterionKey,
      hole.kindLabel,
      hole.zone ?? '—',
      hole.priorityLabel,
      hole.priorityExplanation,
    ],
    state: hole.state,
  };
}

/** Bâtit l'explorateur de trous. */
export function buildHoles(input: HolesInput): HoleExplorer {
  const lang = input.language;
  const holes = input.holes.map((hole) => holeLine(lang, hole));
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: headOf(lang),
    rows: holes.map((hole) => rowOf(hole)),
    holes,
    shown: holes.length,
    total: input.total,
    coverage: coverageView(lang, input.coverage),
  };
}
