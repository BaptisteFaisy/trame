/**
 * Détecteur de secrets et de données personnelles — implémentation réelle (§5).
 *
 * Règle fondatrice : **un critère contenant une clé n'est jamais indexé** (§5).
 * Le scan tourne avant toute mise en base et avant tout envoi au LLM (§18).
 *
 * Discipline de sortie : `findings` ne contient que des **libellés** de
 * famille (« clé AWS », « e-mail »…), jamais la valeur trouvée — recopier un
 * secret dans un journal, un écran ou une proposition, ce serait le publier
 * (§18 : les preuves sont référencées, jamais recopiées ; ici, même la
 * référence du secret ne sort pas).
 *
 * Les détecteurs réutilisent la logique éprouvée de `placard-wiki` (§20),
 * réécrite ici sans dépendance externe : le domaine n'importe jamais
 * `@forge/*` ni aucun paquet tiers (docs/CONTRACTS.md §3).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { SecretScanner } from '../ports';

/** Un détecteur : un libellé (ce qui sort) et un motif (ce qui ne sort pas). */
interface Detector {
  label: string;
  pattern: RegExp;
}

/** Familles détectées : clés de service, jetons, identités, coordonnées. */
export const DETECTORS: readonly Detector[] = [
  { label: 'clé AWS (AKIA/ASIA)', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { label: 'jeton GitHub', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/ },
  { label: 'jeton GitLab', pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { label: 'jeton Slack', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: 'clé d’API Google', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: 'clé privée PEM', pattern: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { label: 'jeton JWT', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/ },
  {
    label: 'mot de passe en clair',
    pattern: /\b(?:password|passwd|pwd|mot\s*de\s*passe)\s*[:=]\s*['"]?[^\s'";,]{6,}/i,
  },
  {
    label: 'chaîne de connexion avec mot de passe',
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@[^\s/]+/i,
  },
  { label: 'IBAN', pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/ },
  { label: 'adresse e-mail', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ },
  { label: 'numéro de téléphone', pattern: /(?:(?:\+|00)33\s*[1-9]|\b0[1-9])(?:[\s.-]*\d{2}){4}\b/ },
];

/**
 * Fabrique le scanner (port `SecretScanner` de src/ports.ts, appelé par
 * src/deps.ts sans argument). `clean` = aucun détecteur n'a mordu ; sinon
 * `findings` liste les libellés des familles touchées, sans doublon.
 */
export function createSecretScanner(): SecretScanner {
  return {
    scan(text: string): { clean: boolean; findings: string[] } {
      const findings: string[] = [];
      for (const detector of DETECTORS) {
        if (detector.pattern.test(text) && !findings.includes(detector.label)) {
          findings.push(detector.label);
        }
      }
      return { clean: findings.length === 0, findings };
    },
  };
}
