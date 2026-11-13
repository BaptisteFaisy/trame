/**
 * La section : un point d'ancres, un titre, un chapeau. Toutes les sections du
 * site passent par là — la navigation s'y accroche.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement, ReactNode } from 'react';

export interface SectionProps {
  id: string;
  title: string;
  lead?: ReactNode;
  /** La classe de la section, pour la mise en page. */
  variant?: 'default' | 'muted' | 'dark';
  children: ReactNode;
}

export function Section({
  id,
  title,
  lead,
  variant = 'default',
  children,
}: SectionProps): ReactElement {
  const headingId = `${id}-title`;
  return (
    <section id={id} className={`section section--${variant}`} aria-labelledby={headingId}>
      <div className="wrap">
        <header className="section__head">
          <h2 id={headingId}>{title}</h2>
          {lead ? <p className="section__lead">{lead}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}
