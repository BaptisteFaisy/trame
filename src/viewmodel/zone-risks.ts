/**
 * Vue-modèle des zones à risque (§11) : la matière observée qui nourrit le
 * métré. Une zone sans antécédent n'apparaît pas (elle n'est pas un risque, et
 * la ligne vide n'existe pas).
 *
 * Pur : il reçoit les risques, il ne lit rien.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index.js';
import type { ScopeType, ZoneRisk } from '../types.js';
import { codedState, tableHead } from './common.js';
import type { RegisterRow, TableHead } from './common.js';
import { stateWord, text } from './labels.js';

export interface ZoneRisksInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  zoneRisks: readonly ZoneRisk[];
}

export interface ZoneRisksView {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  head: TableHead;
  rows: RegisterRow[];
  empty: boolean;
}

/** Bâtit l'écran des zones à risque. */
export function buildZoneRisks(input: ZoneRisksInput): ZoneRisksView {
  const lang = input.language;
  const rows: RegisterRow[] = input.zoneRisks.map((zone) => ({
    cells: [
      zone.zone,
      String(zone.defectCount),
      String(zone.openIncidentCount),
      zone.lastDefectAt ?? '—',
      zone.score.toFixed(2),
    ],
    state: codedState(
      zone.score >= 0.4 ? 'crossed' : 'solid',
      zone.score >= 0.4 ? stateWord(lang, 'at-risk') : stateWord(lang, 'calm'),
    ),
  }));
  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: lang,
    head: tableHead([
      text(lang, 'zone'),
      text(lang, 'defects'),
      text(lang, 'incidents'),
      text(lang, 'last-defect'),
      text(lang, 'score'),
    ]),
    rows,
    empty: rows.length === 0,
  };
}