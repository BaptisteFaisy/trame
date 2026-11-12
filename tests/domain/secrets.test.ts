/**
 * Tests réels du détecteur de secrets (§5, §18, §20).
 * Un critère contenant une clé n'est jamais indexé ; les findings sont des
 * libellés — jamais la valeur trouvée.
 */
import { describe, expect, it } from 'vitest';
import { createSecretScanner } from '../../src/domain/secrets.js';

const scanner = createSecretScanner();

/** Échantillons faux mais de la bonne forme (aucun secret réel ici). */
const SAMPLES: { label: string; secret: string; text: string }[] = [
  { label: 'clé AWS (AKIA/ASIA)', secret: 'AKIAIOSFODNN7EXAMPLE', text: 'utiliser AKIAIOSFODNN7EXAMPLE pour l’API' },
  { label: 'jeton GitHub', secret: `ghp_${'a1B2c3D4e5F6'.repeat(3)}`, text: `token ghp_${'a1B2c3D4e5F6'.repeat(3)} collé ici` },
  { label: 'jeton GitHub', secret: 'github_pat_11ABCDEF01abcdefghijklmnopqrstuvwx', text: 'github_pat_11ABCDEF01abcdefghijklmnopqrstuvwx' },
  { label: 'jeton GitLab', secret: 'glpat-abcdefghijklmnopqrst', text: 'accès via glpat-abcdefghijklmnopqrst' },
  { label: 'jeton Slack', secret: 'xoxb-123456789012-1a2b3c4d5e6f', text: 'webhook xoxb-123456789012-1a2b3c4d5e6f' },
  { label: 'clé d’API Google', secret: 'AIzaSyA1234567890abcdefghijklmnopqrstuv', text: 'clé AIzaSyA1234567890abcdefghijklmnopqrstuv' },
  { label: 'clé privée PEM', secret: '-----BEGIN PRIVATE KEY-----', text: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN…' },
  { label: 'jeton JWT', secret: 'eyJhbGciOiJIUzI1NiJ9', text: 'bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcDEF123xyz456' },
  { label: 'mot de passe en clair', secret: 'Chasse2026!', text: 'password = Chasse2026!' },
  { label: 'chaîne de connexion avec mot de passe', secret: 'mongodb://user:pass123@cluster0.example.net', text: 'URI mongodb://user:pass123@cluster0.example.net/db' },
  { label: 'IBAN', secret: 'FR7630006000011234567890189', text: 'virer sur FR7630006000011234567890189' },
  { label: 'adresse e-mail', secret: 'marie.curie@example.fr', text: 'contacter marie.curie@example.fr' },
  { label: 'numéro de téléphone', secret: '06 12 34 56 78', text: 'appeler le 06 12 34 56 78' },
];

describe('secrets — chaque famille est détectée', () => {
  for (const sample of SAMPLES) {
    it(`détecte : ${sample.label}`, () => {
      const result = scanner.scan(sample.text);
      expect(result.clean).toBe(false);
      expect(result.findings).toContain(sample.label);
    });
  }
});

describe('secrets — honnêteté des findings (§18)', () => {
  it('les findings ne contiennent jamais la valeur du secret', () => {
    for (const sample of SAMPLES) {
      const result = scanner.scan(sample.text);
      for (const finding of result.findings) {
        expect(finding).not.toContain(sample.secret);
        expect(sample.text.replace(sample.secret, '')).not.toContain(finding);
      }
    }
  });

  it('les libellés sont dédoublonnés', () => {
    const result = scanner.scan('AKIAIOSFODNN7EXAMPLE puis AKIAIOSFODNN7EXAMPLE encore');
    expect(result.findings.filter((f) => f === 'clé AWS (AKIA/ASIA)')).toHaveLength(1);
  });
});

describe('secrets — les textes propres ne déclenchent rien', () => {
  it('un critère ordinaire est propre', () => {
    const result = scanner.scan('le temps de réponse reste sous 2 s au 95e centile');
    expect(result.clean).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('un texte métier sans clé ni donnée personnelle est propre', () => {
    const result = scanner.scan(
      "AC-1 : l'export CSV du rapport mensuel est disponible en un clic, chiffré au repos, sans limite de lignes",
    );
    expect(result.clean).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('un texte vide est propre', () => {
    expect(scanner.scan('').clean).toBe(true);
  });
});
