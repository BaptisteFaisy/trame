/**
 * Vue-modèle de la file de validation (§12.6).
 *
 * Tout y est un BROUILLON : les liaisons dérivées à confirmer, les tests
 * proposés, les reformulations proposées. Rien n'est appliqué sans une
 * décision humaine — la file le dit, et chaque ligne porte son motif.
 *
 * Pur : il reçoit les liaisons et les propositions, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import type { Link, Proposal, ScopeType } from '../types';
import { codedState, tableHead } from './common';
import type { CodedState, RegisterRow, TableHead } from './common';
import { text } from './labels';

export interface ValidationQueueInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  /** Les liaisons dérivées en attente, les plus confiantes d'abord. */
  derivedLinks: readonly Link[];
  /** Les propositions (tests, reformulations, re-tissages) en attente. */
  proposals: readonly Proposal[];
}

export interface ValidationQueue {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  empty: boolean;
  counts: { derived: number; proposals: number };
}

/** L'état d'une proposition : un brouillon, jamais un fait. */
function stateOf(lang: Lang): CodedState {
  return codedState('dotted', text(lang, 'proposed-test'));
}

/** Bâtit la file de validation. */
export function buildValidationQueue(input: ValidationQueueInput): ValidationQueue {
  const lang = input.language;
  const rows: RegisterRow[] = [];
  for (const link of input.derivedLinks) {
    rows.push({
      cells: ['—', text(lang, 'derived-links').replace(' à confirmer', ''), link.criterionId, link.verificationId, link.confidence.toFixed(2)],
      state: codedState('dotted', text(lang, 'derived-links')),
    });
  }
  for (const proposal of input.proposals) {
    rows.push({
      cells: [proposal.criterionId, proposal.type, proposal.createdAt, proposal.state],
      state: stateOf(lang),
    });
  }
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: tableHead([text(lang, 'criterion'), text(lang, 'ticket'), text(lang, 'confidence'), text(lang, 'date'), text(lang, 'state')]),
    rows,
    empty: rows.length === 0,
    counts: { derived: input.derivedLinks.length, proposals: input.proposals.length },
  };
}