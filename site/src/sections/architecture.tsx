/**
 * L'architecture en dix lignes, les quatre chemins de liaison, et les liens
 * vers les documents du dépôt.
 *
 * Les chemins de liaison portent les libellés du domaine : c'est lui qui sait
 * ce qu'est une « mention explicite » (§4, §9).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { ReactElement } from 'react';
import { Section } from '../components/section.js';
import { label } from '../../../src/i18n/index.js';
import type { LinkPath } from '../../../src/types.js';
import { t } from '../i18n/index.js';
import type { Lang } from '../i18n/index.js';

/** Les dix lignes de l'architecture, dans l'ordre du flux de données. */
const LINES = [
  'architecture.l1',
  'architecture.l2',
  'architecture.l3',
  'architecture.l4',
  'architecture.l5',
  'architecture.l6',
  'architecture.l7',
  'architecture.l8',
  'architecture.l9',
  'architecture.l10',
] as const;

/** Les quatre chemins de liaison, du plus sûr au plus fragile (§9, §10). */
const PATHS: LinkPath[] = ['mention', 'naming-convention', 'similarity', 'declaration'];

/** Les documents du dépôt, à lire dans l'ordre du jugement. */
const DOCS = [
  { label: 'docs/CAHIER-DES-CHARGES.md', href: 'blob/main/docs/CAHIER-DES-CHARGES.md' },
  { label: 'docs/ARCHITECTURE.md', href: 'blob/main/docs/ARCHITECTURE.md' },
  { label: 'docs/CONTRACTS.md', href: 'blob/main/docs/CONTRACTS.md' },
  { label: 'docs/RECETTE.md', href: 'blob/main/docs/RECETTE.md' },
  { label: 'docs/JUDGES.md', href: 'blob/main/docs/JUDGES.md' },
  { label: 'docs/VIDEO-SCRIPT.md', href: 'blob/main/docs/VIDEO-SCRIPT.md' },
  { label: 'src/domain/', href: 'tree/main/src/domain' },
] as const;

const REPO = 'https://github.com/BaptisteFaisy/trame';

export interface ArchitectureProps {
  lang: Lang;
}

export function Architecture({ lang }: ArchitectureProps): ReactElement {
  return (
    <Section id="architecture" title={t(lang, 'architecture.title')} lead={t(lang, 'architecture.lead')}>
      <ol className="architecture">
        {LINES.map((line) => (
          <li key={line}>{t(lang, line)}</li>
        ))}
      </ol>
      <div className="paths">
        <h3>{t(lang, 'architecture.links')}</h3>
        <ul>
          {PATHS.map((path) => (
            <li key={path}>
              <span className="paths__mark" aria-hidden="true">
                {PATHS.indexOf(path) + 1}
              </span>
              {label(lang, 'path', path)}
            </li>
          ))}
        </ul>
      </div>
      <div className="docs">
        <h3>{t(lang, 'architecture.docs')}</h3>
        <ul>
          {DOCS.map((doc) => (
            <li key={doc.label}>
              <a href={`${REPO}/${doc.href}`} rel="noreferrer">
                {doc.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
