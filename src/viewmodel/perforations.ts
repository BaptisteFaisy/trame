/**
 * Vue-modèle du registre des perforations (§12.2).
 *
 * Chaque ligne porte le critère, **sa version**, la date du dernier changement,
 * la date de la vérification qui tenait la maille, et l'écart entre les deux
 * (§22 explicabilité, §24.4). Le classement — fraîche, sèche, multiple —
 * vient du domaine et est affiché tel quel (§8.2).
 *
 * Pur : il reçoit les perforations et la trame, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import type { Coverage, Perforation, PerforationClass, ScopeType } from '../types';
import { coverageView, perforationLine, tableHead } from './common';
import type { CoverageView, PerforationLine, RegisterRow, TableHead } from './common';
import { text } from './labels';

/* ------------------------------------------------------------------ entrée */

export interface PerforationsInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  perforations: readonly Perforation[];
  coverage: Coverage;
  /** Le nombre de perforations trouvées, avant la limite d'affichage. */
  total: number;
}

/* ------------------------------------------------------------------ sortie */

/** Le compte des perforations par classement (§8.2). */
export interface ClassCount {
  klass: PerforationClass;
  label: string;
  count: number;
}

export interface PerforationRegistry {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  perforations: PerforationLine[];
  shown: number;
  total: number;
  /** Le compte par classement : fraîche, sèche, multiple. */
  byClass: ClassCount[];
  coverage: CoverageView;
}

/** Les colonnes du registre : le critère, sa version, les deux dates, l'écart. */
function headOf(lang: Lang): TableHead {
  return tableHead([
    text(lang, 'ticket'),
    text(lang, 'criterion'),
    text(lang, 'version'),
    text(lang, 'changed-at'),
    text(lang, 'verified-at'),
    text(lang, 'gap'),
    text(lang, 'class'),
  ]);
}

/** Une ligne du registre. */
function rowOf(perforation: PerforationLine): RegisterRow {
  return {
    cells: [
      perforation.ticketKey,
      perforation.criterionKey,
      String(perforation.version),
      perforation.changedAt,
      perforation.verifiedAt,
      String(perforation.gapDays),
      perforation.classLabel,
    ],
    state: perforation.state,
  };
}

/** Le compte des perforations par classement, dans l'ordre du domaine. */
function classCounts(perforations: readonly PerforationLine[]): ClassCount[] {
  const order: PerforationClass[] = ['fresh', 'dry', 'multiple'];
  return order.map((klass) => ({
    klass,
    label: perforations.find((row) => row.klass === klass)?.classLabel ?? klass,
    count: perforations.filter((row) => row.klass === klass).length,
  }));
}

/** Bâtit le registre des perforations. */
export function buildPerforations(input: PerforationsInput): PerforationRegistry {
  const lang = input.language;
  const perforations = input.perforations.map((row) => perforationLine(lang, row));
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: headOf(lang),
    rows: perforations.map((row) => rowOf(row)),
    perforations,
    shown: perforations.length,
    total: input.total,
    byClass: classCounts(perforations),
    coverage: coverageView(lang, input.coverage),
  };
}
