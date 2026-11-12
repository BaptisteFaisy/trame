/**
 * Le compteur : une valeur, son libellé, et son dénominateur quand il y en a
 * un (§22 — aucun chiffre sans effectif).
 *
 * Composant partagé : la démo, le bulletin et le certificat l'emploient tous.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';

export interface CounterProps {
  value: number | string;
  label: string;
  /** L'effectif de référence, affiché après la valeur (« 13 / 18 »). */
  total?: number;
  /** Une note courte sous le compteur. */
  note?: string;
  tone?: 'plain' | 'good' | 'warn' | 'bad';
}

export function Counter({
  value,
  label,
  total,
  note,
  tone = 'plain',
}: CounterProps): ReactElement {
  return (
    <div className={`counter counter--${tone}`}>
      <p className="counter__value">
        {value}
        {total !== undefined ? <span className="counter__total"> / {total}</span> : null}
      </p>
      <p className="counter__label">{label}</p>
      {note ? <p className="counter__note">{note}</p> : null}
    </div>
  );
}
