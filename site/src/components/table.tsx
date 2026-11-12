/**
 * Le tableau de données : une grille lisible, avec une légende pour l'écran.
 *
 * Composant partagé : la liste des trous, le registre des perforations, la
 * file des fils détendus et le certificat l'emploient tous.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement, ReactNode } from 'react';

export interface TableColumn {
  key: string;
  label: string;
  /** `numeric` aligne à droite : les effectifs se comparent en colonne. */
  align?: 'left' | 'numeric';
}

export interface TableRow {
  key: string;
  cells: Record<string, ReactNode>;
}

export interface TableProps {
  /** Le titre accessible de la table (§22 : chaque tableau est nommé). */
  caption: string;
  columns: TableColumn[];
  rows: TableRow[];
  /** Le texte affiché quand la table est vide. */
  empty?: string;
}

export function Table({ caption, columns, rows, empty }: TableProps): ReactElement {
  return (
    <table className="data-table">
      <caption className="data-table__caption">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col" className={column.align === 'numeric' ? 'numeric' : undefined}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className="data-table__empty" colSpan={columns.length}>
              {empty ?? '—'}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.key}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'numeric' ? 'numeric' : undefined}>
                  {row.cells[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
