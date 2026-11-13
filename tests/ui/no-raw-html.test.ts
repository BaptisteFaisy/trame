/**
 * Le garde qui protège de l'erreur invisible.
 *
 * Le moteur de rendu d'Atlassian rejette tout élément HTML qu'il ne connaît
 * pas (« Error rendering app - encountered unknown component p. »). Un
 * `<div>` ou un `<table>` passe la vérification de types, passe `tsc`, passe
 * les tests — et casse l'écran **en production**, sans message.
 *
 * Ce test lit les `.tsx` de `src/ui/` et ÉCHOUE si une balise HTML brute y
 * apparaît. Les seules balises autorisées sont celles de la façade UI Kit 2
 * (en majuscules : `Box`, `Text`, `Heading`…).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/** Les balises que le moteur de rendu d'Atlassian refuse. */
export const RAW_TAGS = [
  'a', 'article', 'aside', 'br', 'button', 'code', 'div', 'em', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'img', 'input', 'li', 'nav',
  'ol', 'p', 'pre', 'section', 'small', 'span', 'strong', 'svg', 'table', 'tbody',
  'td', 'th', 'thead', 'tr', 'ul',
];

/** Le dossier de l'interface. */
const UI_DIR = new URL('../../src/ui/', import.meta.url).pathname;

/** Tous les `.tsx` de l'interface. */
function uiFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...uiFiles(full));
    else if (entry.name.endsWith('.tsx')) found.push(full);
  }
  return found;
}

/** Retire les commentaires : un `<div>` écrit dans un commentaire n'est pas une balise. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('l’interface n’utilise que la façade UI Kit 2', () => {
  const files = uiFiles(UI_DIR);

  it('trouve les fichiers de l’interface', () => {
    expect(files.length).toBeGreaterThan(8);
  });

  it('ne contient aucune balise HTML brute', () => {
    // Sensible à la casse : `<Button>` est une primitive UI Kit 2, `<button>`
    // serait du HTML brut.
    const pattern = new RegExp(`</?(?:${RAW_TAGS.join('|')})(?=[\\s/>])`);
    const offences: string[] = [];
    for (const file of files) {
      const source = withoutComments(fs.readFileSync(file, 'utf8'));
      source.split('\n').forEach((line, index) => {
        if (pattern.test(line)) offences.push(`${path.basename(file)}:${index + 1} ${line.trim()}`);
      });
    }
    expect(offences).toEqual([]);
  });

  it('n’appelle jamais createElement avec une balise HTML', () => {
    const pattern = /createElement\(\s*['"](div|span|p|table|ul|li|svg|img)['"]/;
    const offences: string[] = [];
    for (const file of files) {
      const source = withoutComments(fs.readFileSync(file, 'utf8'));
      if (pattern.test(source)) offences.push(path.basename(file));
    }
    expect(offences).toEqual([]);
  });

  it('n’importe jamais @forge/ui (UI Kit 1, déprécié)', () => {
    const offences: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      if (/from\s+['"]@forge\/ui['"]/.test(source)) offences.push(path.basename(file));
    }
    expect(offences).toEqual([]);
  });
});
