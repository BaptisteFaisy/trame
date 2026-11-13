/**
 * Le badge d'état : un MOT et un MOTIF, jamais la couleur seule (§22).
 *
 * Chaque ton porte un glyphe distinct — le lecteur qui ne voit pas les
 * couleurs, ou qui imprime la page en noir et blanc, lit la même chose.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';

export type BadgeTone =
  | 'hole'
  | 'perforation'
  | 'loose'
  | 'covered'
  | 'provisional'
  | 'paper'
  | 'unfalsifiable'
  | 'deleted'
  | 'neutral';

/** Le motif de chaque état : un glyphe, lisible en noir et blanc. */
const MARKS: Record<BadgeTone, string> = {
  hole: '▦',
  perforation: '⊘',
  loose: '⌇',
  covered: '▩',
  provisional: '⋯',
  paper: '❖',
  unfalsifiable: '∅',
  deleted: '✕',
  neutral: '·',
};

export interface BadgeProps {
  tone: BadgeTone;
  /** Le mot de l'état — jamais une icône seule. */
  children: string;
}

export function Badge({ tone, children }: BadgeProps): ReactElement {
  return (
    <span className={`badge badge--${tone}`}>
      <span className="badge__mark" aria-hidden="true">
        {MARKS[tone]}
      </span>
      <span className="badge__word">{children}</span>
    </span>
  );
}
