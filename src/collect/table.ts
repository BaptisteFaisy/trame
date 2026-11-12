/**
 * Origine 3 (§6) — tableau de critères (colonnes).
 *
 * Contenu : `input.table` (`CriterionTable` : `columns` puis `rows`). Chaque
 * colonne porte un critère, chaque ligne un cas de test qui l'exerce.
 *
 * Numérotation stable (L1) : `AC-n` = indice de la colonne (l'ordre des
 * colonnes est la structure du tableau) ; les lignes ne numérotent pas le
 * critère, elles documentent ses cas. Une colonne vide laisse donc un trou
 * dans la suite — c'est voulu : un critère ajouté à gauche ne renumérote pas
 * les suivants, et l'empreinte (§8.2) signale alors le changement.
 *
 * Tolérance (§6, « mise en forme variable ») : une ligne plus courte que les
 * colonnes (cellule fusionnée, tableau mal exporté) n'est pas une erreur, elle
 * ne produit simplement rien pour cette case ; une colonne sans nom
 * exploitable ne produit **aucun** critère — le tableau est lu partiellement,
 * jamais complété au hasard.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { buildCriterion, criterionKey, isTitleLine, tableColumns } from './normalize.js';
import type { CollectInput, ExtractedCriterion } from './types.js';

/** Le nombre de lignes qui documentent une colonne donnée. */
function caseCount(rows: readonly string[][], column: number): number {
  let count = 0;
  for (const row of rows) {
    const cell = row[column];
    if (cell !== undefined && cell.trim().length > 0) count += 1;
  }
  return count;
}

/**
 * Extrait les critères d'un tableau : une colonne = un critère, `AC-n` = le
 * numéro de la colonne. Les lignes sont des cas de test, jamais des critères.
 */
export function extract(input: CollectInput): ExtractedCriterion[] {
  const table = input.table;
  if (!table) return [];
  const out: ExtractedCriterion[] = [];

  for (const column of tableColumns(table)) {
    if (isTitleLine(column.text)) continue;
    const cases = caseCount(table.rows, column.columnIndex);
    const criterion = buildCriterion(input, {
      text: column.text,
      key: criterionKey(column.columnIndex + 1),
      documentation: cases > 0 ? `${cases} cas de test dans cette colonne` : undefined,
    });
    if (criterion) out.push(criterion);
  }
  return out;
}
