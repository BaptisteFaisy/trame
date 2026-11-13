/**
 * Vue-modèle de l'écran de couverture (§17, §18) : ce que l'app voit, et ce
 * qu'elle ne voit pas.
 *
 * Les quatre absences sont DISTINGUÉES, jamais confondues (§22) :
 * `no-right` (pas de droit), `no-data` (pas de données), `no-test` (pas de
 * test), `no-criterion` (pas de critère). Un angle mort de l'app (pas de
 * droit) n'est jamais affiché comme un trou du projet : c'est un motif
 * `striped`, avec le mot qui le dit.
 *
 * Pur : il reçoit les sondes, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import type { ScopeType, VisibilityProbe } from '../types';
import { codedState, tableHead } from './common';
import type { Motif, RegisterRow, TableHead } from './common';
import { text } from './labels';
import { label } from '../i18n/index';

export interface VisibilityInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  probes: readonly VisibilityProbe[];
}

export interface VisibilityView {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  empty: boolean;
  distinctions: { absence: string; word: string }[];
}

/** Le motif d'une absence : l'angle mort est rayé, tout le reste est vide. */
function motifOf(absence: VisibilityProbe['absence']): Motif {
  return absence === 'no-right' ? 'striped' : 'empty';
}

/** Les quatre absences, dans la langue de l'écran (§22). */
function distinctions(lang: Lang): { absence: string; word: string }[] {
  return (['no-right', 'no-data', 'no-test', 'no-criterion'] as const).map((absence) => ({
    absence,
    word: label(lang, 'absence', absence),
  }));
}

/** Bâtit l'écran de couverture. */
export function buildVisibility(input: VisibilityInput): VisibilityView {
  const lang = input.language;
  const rows: RegisterRow[] = input.probes.map((probe) => ({
    cells: [probe.objectType, probe.readable ? 'oui' : 'non', probe.detail],
    state: codedState(motifOf(probe.absence), label(lang, 'absence', probe.absence)),
  }));
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: tableHead([text(lang, 'object'), text(lang, 'readable'), text(lang, 'detail')]),
    rows,
    empty: rows.length === 0,
    distinctions: distinctions(lang),
  };
}