/**
 * Vue-modèle de l'historique de trame (§17) : les témoins successifs d'un
 * périmètre. Deux témoins ne se comparent que si leurs périmètres et leurs
 * époques coïncident (§22) ; sinon l'écran refuse la comparaison, il ne
 * l'approxime pas.
 *
 * Pur : il reçoit les témoins, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import type { ScopeType, Witness } from '../types';
import { comparableTo } from '../domain/witness';
import { tableHead } from './common';
import type { RegisterRow, TableHead } from './common';
import { text } from './labels';

export interface TimelineInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  witnesses: readonly Witness[];
}

export interface TimelineView {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  empty: boolean;
}

/** Bâtit l'historique de trame : le plus récent en premier. */
export function buildTimeline(input: TimelineInput): TimelineView {
  const lang = input.language;
  const sorted = [...input.witnesses].sort((left, right) => right.computedAt.localeCompare(left.computedAt));
  const rows: RegisterRow[] = sorted.map((witness) => {
    const comparable = comparableTo(sorted[0] ?? null, witness.coverage);
    return {
      cells: [
        witness.period,
        witness.computedAt,
        String(witness.coverage.coveredDeclared),
        String(witness.coverage.criteriaFalsifiable),
        comparable ? 'comparable' : '—',
      ],
      state: { motif: 'solid' as const, word: comparable ? text(lang, 'witness') : text(lang, 'history-empty') },
    };
  });
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: tableHead([
      text(lang, 'period'),
      text(lang, 'date'),
      text(lang, 'covered-declared'),
      text(lang, 'verifiable'),
      text(lang, 'probe'),
    ]),
    rows,
    empty: rows.length === 0,
  };
}