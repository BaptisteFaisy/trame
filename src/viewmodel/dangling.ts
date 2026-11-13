/**
 * Vue-modèle de la file des fils détendus (§12.3).
 *
 * Un fil détendu est un acte de vérification qui ne couvre plus rien : la
 * raison vient du dictionnaire (§8.3) et l'**impact est chiffré** — combien de
 * mailles il retire de la couverture (§24.5). C'est ce chiffre qui fait
 * baisser la couverture affichée quand un test meurt.
 *
 * Pur : il reçoit les fils détendus et la trame, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import type { Coverage, Dangling, ScopeType } from '../types';
import { coverageView, danglingLine, figure, tableHead } from './common';
import type { CoverageView, DanglingLine, Figure, RegisterRow, TableHead } from './common';
import { text } from './labels';

/* ------------------------------------------------------------------ entrée */

export interface DanglingInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  dangling: readonly Dangling[];
  coverage: Coverage;
  /** Le nombre d'actes de vérification du périmètre : le dénominateur. */
  verificationCount: number;
  total: number;
}

/* ------------------------------------------------------------------ sortie */

export interface DanglingQueue {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  threads: DanglingLine[];
  shown: number;
  total: number;
  /** L'impact total : les mailles retirées par les fils détendus ouverts. */
  impact: Figure;
  coverage: CoverageView;
}

/** Les colonnes de la file : l'acte, la raison, l'impact, la date. */
function headOf(lang: Lang): TableHead {
  return tableHead([
    text(lang, 'action'),
    text(lang, 'reason'),
    text(lang, 'impact'),
    text(lang, 'detected-at'),
    text(lang, 'state'),
  ]);
}

/** Une ligne de la file. */
function rowOf(thread: DanglingLine): RegisterRow {
  return {
    cells: [
      thread.verificationName,
      thread.reasonLabel,
      String(thread.impact),
      thread.detectedAt,
      thread.stateWord,
    ],
    state: thread.state,
  };
}

/** Bâtit la file des fils détendus, avec son impact chiffré. */
export function buildDangling(input: DanglingInput): DanglingQueue {
  const lang = input.language;
  const threads = input.dangling.map((row) => danglingLine(lang, row));
  const removed = threads.reduce((sum, thread) => sum + thread.impact, 0);
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: headOf(lang),
    rows: threads.map((thread) => rowOf(thread)),
    threads,
    shown: threads.length,
    total: input.total,
    impact: figure(text(lang, 'impact'), removed, input.verificationCount),
    coverage: coverageView(lang, input.coverage),
  };
}
