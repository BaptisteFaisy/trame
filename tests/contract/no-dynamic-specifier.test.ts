/**
 * Le garde des spécificateurs dynamiques.
 *
 * Le bundler de Forge (webpack) résout un `import('…')` **littéral** et met le
 * paquet dans le bundle. Sur une variable, il ne voit rien : le bundle part
 * sans la dépendance et l'app meurt à l'exécution avec `MODULE_NOT_FOUND`.
 * L'incident du 13/11/2026 est de ce type : `@forge/sql` chargé par
 * `import(FORGE_SQL_MODULE)` — l'app n'écrivait donc rien en base, en
 * production, sans aucun signe en compilation.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = new URL('../../src/', import.meta.url).pathname;

/** Tous les `.ts`/`.tsx` de `src/`. */
function sources(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...sources(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
  }
  return files(found);
}

/** Filtrage des extensions voulues (déjà fait par `sources`). */
function files(list: string[]): string[] {
  return list;
}

/** Retire les commentaires : un `import(…)` décrit dans un commentaire n'est pas du code. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('les import dynamiques', () => {
  it('ont un spécificateur littéral', () => {
    const offences: string[] = [];
    for (const file of sources(SRC_DIR)) {
      const source = withoutComments(fs.readFileSync(file, 'utf8'));
      const pattern = /\bimport\(\s*(?!['"])/g;
      let match = pattern.exec(source);
      while (match) {
        const line = source.slice(0, match.index).split('\n').length;
        offences.push(`${path.basename(file)}:${line}`);
        match = pattern.exec(source);
      }
    }
    expect(offences).toEqual([]);
  });
});
