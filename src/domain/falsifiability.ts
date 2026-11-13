/**
 * Le jugement de falsifiabilité — en pur (§8.4, §23).
 *
 * Un critère qui ne peut pas être vérifié (« rapide », « simple », « agréable »,
 * « robuste ») ne compte **ni comme trou ni comme couverture** : il est compté
 * à part (`Coverage.unfalsifiableCount`, §8.1) et l'app propose une
 * reformulation vérifiable (§12.6, §24.10).
 *
 * Le jugement est **déterministe et sans modèle** : mêmes entrées, même
 * verdict, même raison. C'est une première passe ; le LLM
 * (`LlmGateway.unfalsifiableReason`) peut affiner ensuite, jamais l'infirmer
 * (§22 sobriété).
 *
 * Motifs de verdict, dans cet ordre :
 *  1. le critère est **vide ou à moitié écrit** (« le système doit ») : il est
 *     infaisable, compté à part, jamais compté comme trou (§23) ;
 *  2. le critère porte un **mot sans mesure** (« rapide ») : il dit un
 *     ressent, pas une exigence ;
 *  3. le critère ne dit **aucun comportement observable** : aucune
 *     vérification conceivable ne pourrait trancher.
 *
 * Une mesure (un nombre, une unité, un seuil) l'emporte toujours : « le
 * temps de réponse reste sous 2 s au 95ᵉ centile » est falsifiable même si le
 * mot « rapide » traîne à côté.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { MIN_CRITERION_LENGTH, UNFALSIFIABLE_MARKERS } from '../defaults';

/** Le verdict : falsifiable, ou la raison de ne pas l'être — en français. */
export interface FalsifiabilityVerdict {
  falsifiable: boolean;
  /** Ce qui MANQUE, nommé en toutes lettres : pas de code, pas de score. */
  reason?: string;
}

/* --------------------------------------------------------------- lexique */

/** Les mots sans mesure de `src/defaults.ts` : ils ne sont pas des exigences. */
const MARKER_PATTERN = new RegExp(
  `\\b(${UNFALSIFIABLE_MARKERS.map(escapeRegExp).join('|')})\\b`,
  'i',
);

/**
 * Les verbes d'observable : ce que l'on peut voir, lire, mesurer ou bloquer.
 * Une première passe lexicale, volontairement prudente : le LLM peut la
 * compléter, jamais la contredire sans motif (§22).
 */
const OBSERVABLE_VERBS = new Set([
  // verbes d'action, d'état et participes passés, en français
  'accepte', 'accepté', 'accepter', 'affiche', 'affiché', 'afficher', 'ajoute',
  'ajouté', 'alerte', 'alerté', 'alerter', 'archive', 'archivé', 'archiver',
  'baisse', 'baisser', 'bloque', 'bloqué', 'bloquer', 'calcule', 'calculé',
  'calculer', 'chiffre', 'chiffré', 'chiffrer', 'classe', 'classé', 'classer',
  'connecte', 'connecté', 'connecter', 'conservé', 'conserve', 'conserver',
  'crée', 'créé', 'créer', 'découpe', 'découper', 'décroît', 'délivre',
  'déconnecte', 'déconnecter', 'descend', 'descendre', 'exporte', 'exporté',
  'exporter', 'filtre', 'filtré', 'filtrer', 'génère', 'généré', 'générer',
  'gère', 'gérer', 'identifie', 'identifier', 'ignore', 'ignorer', 'importe',
  'importer', 'journalise', 'journalisé', 'journaliser', 'liste', 'listé',
  'lister', 'notifie', 'notifié', 'notifier', 'ouvre', 'ouvert', 'ouvrir',
  'planter', 'plante', 'produit', 'produire', 'protège', 'protégé', 'protéger',
  'publie', 'publié', 'publier', 'refuse', 'refusé', 'refuser', 'rejette',
  'rejeté', 'rejeter', 'remplace', 'remplacé', 'remplacer', 'renvoie',
  'renvoyé', 'renvoyer', 'répond', 'répondre', 'résiste', 'résister',
  'retient', 'retenir', 'retourne', 'retourné', 'retourner', 'reste',
  'rester', 'satisfait', 'satisfaire', 'trace', 'tracé', 'tracer', 'trie',
  'trié', 'trier', 'valide', 'validé', 'valider', 'vérifie', 'vérifié',
  'vérifier',
  // et en anglais, pour les tickets écrits en anglais
  'accepts', 'block', 'blocked', 'blocks', 'creates', 'deletes', 'displays',
  'exported', 'exports', 'filters', 'generated', 'generates', 'keeps', 'logs',
  'rejected', 'rejects', 'returns', 'sends', 'sorted', 'sorts', 'stored',
  'stores', 'updated', 'updates', 'validated', 'validates',
]);

/** Les mots qui traînent à la fin d'une phrase inachevée (§23). */
const DANGLING_ENDINGS = [
  /\b(?:doit|doivent|devrait|devraient|peut|peuvent|faut|must|should|shall|will|would|can|could)\s*[.!…?]*$/i,
  /\b(?:être|avoir|faire|pouvoir|devoir)\s*[.!…?]*$/i,
];

/** Les unités qui donnent une grandeur mesurable. */
const UNIT =
  '%|‰|ms\\b|min\\b|mo\\b|ko\\b|go\\b|heures?\\b|secondes?\\b|minutes?\\b|octets?\\b|lignes?\\b|requ[eê]tes?\\b|utilisateurs?\\b|erreurs?\\b|jours?\\b|mois\\b|points?\\b|tâches?\\b|s\\b|h\\b|j\\b';

/** Un nombre suivi d'une unité : « 2 s », « 80 % », « 1 000 requêtes ». */
const NUMBER_WITH_UNIT = new RegExp(`\\d+(?:[.,]\\d+)?\\s*(?:${UNIT})`, 'i');

/** Un seuil nommé : « sous 2 s », « au plus 30 s », « moins de 5 ko ». */
const THRESHOLD_WITH_UNIT = new RegExp(
  `\\b(?:sous|au plus|maximum|minimum|moins de|plus de|au moins|à partir de)\\s+\\d+(?:[.,]\\d+)?\\s*(?:${UNIT})`,
  'i',
);

/** Un percentile : « au 95ᵉ centile », « p99 ». */
const PERCENTILE = /\b(?:p(?:95|99)|9[059]\s*(?:e|er|ème|ᵉ)?\s*centile|centile)\b/i;

/** Les clés de critère (« AC-3 », « PROJ-12 ») : un chiffre d'identifiant n'est pas une mesure. */
const CRITERION_KEY = /\b[A-Z]{1,8}[-_]?\d+\b/g;

/* ------------------------------------------------------------------ outils */

/** Échappe un littéral pour une expression régulière. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Le texte nettoyé : espaces aux bouts, ponctuation finale retirée. */
function trimmed(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Les mots du texte, minuscules, accents conservés. */
function wordsOf(text: string): string[] {
  return text.toLowerCase().match(/\p{L}+/gu) ?? [];
}

/** Un nombre, une unité ou un seuil : la grandeur qui rend le critère tranchable. */
export function hasMeasure(text: string): boolean {
  const sansCles = text.replace(CRITERION_KEY, ' ');
  if (/\d/.test(sansCles)) return true;
  return NUMBER_WITH_UNIT.test(text) || THRESHOLD_WITH_UNIT.test(text) || PERCENTILE.test(text);
}

/** La grandeur elle-même, pour la proposer telle quelle dans une reformulation. */
export function measureFragment(text: string): string | null {
  const seuil = THRESHOLD_WITH_UNIT.exec(text);
  if (seuil) return seuil[0];
  const grandeur = NUMBER_WITH_UNIT.exec(text);
  if (grandeur) return grandeur[0];
  const nombre = /\d+(?:[.,]\d+)?/.exec(text.replace(CRITERION_KEY, ' '));
  return nombre ? nombre[0] : null;
}

/** Le texte porte-t-il un comportement observable ? (verbe d'observable) */
export function hasObservable(text: string): boolean {
  return wordsOf(text).some((word) => OBSERVABLE_VERBS.has(word));
}

/** Le texte s'arrête-t-il sur un mot qui laisse la phrase inachevée ? */
function isHalfWritten(text: string): boolean {
  const clean = trimmed(text).replace(/[.!…?]+$/, '');
  return DANGLING_ENDINGS.some((pattern) => pattern.test(clean));
}

/** Le mot sans mesure trouvé dans le texte (« rapide », « simple »…). */
function markerOf(text: string): string | null {
  const found = MARKER_PATTERN.exec(text);
  return found ? found[1] : null;
}

/* --------------------------------------------------------------- jugement */

/**
 * Le verdict de falsifiabilité d'un critère (§8.4).
 *
 * - `falsifiable: true` quand une vérification conceivable pourrait trancher ;
 * - `falsifiable: false` + `reason` en français qui dit **ce qui manque** :
 *   une mesure, un seuil, un comportement observable.
 */
export function falsifiabilityOf(text: string): FalsifiabilityVerdict {
  const clean = trimmed(text);
  if (clean.length === 0) {
    return { falsifiable: false, reason: 'critère vide : il n’y a rien à vérifier' };
  }
  if (clean.length < MIN_CRITERION_LENGTH) {
    return {
      falsifiable: false,
      reason: `critère à moitié écrit : moins de ${MIN_CRITERION_LENGTH} caractères`,
    };
  }
  if (isHalfWritten(clean)) {
    return {
      falsifiable: false,
      reason: `critère à moitié écrit (« ${clean} ») : infaisable, jamais compté comme trou`,
    };
  }
  if (hasMeasure(clean)) return { falsifiable: true };
  const marker = markerOf(clean);
  if (marker) {
    return { falsifiable: false, reason: `pas de mesure : « ${marker} » n’est pas mesurable` };
  }
  if (hasObservable(clean)) return { falsifiable: true };
  return {
    falsifiable: false,
    reason:
      'aucune vérification conceivable ne pourrait trancher : ni nombre, ni seuil, ni comportement observable',
  };
}

/**
 * Un critère négatif (« ne doit pas ») : une interdiction, pas une
 * réalisation (TR-25, §15). Un critère positif énonce ce qui doit arriver.
 */
export function isNegative(text: string): boolean {
  const clean = trimmed(text);
  const francais = /\bne\s+[^\n.;]{0,60}?\b(?:pas|jamais|aucun[es]?|rien|ni)\b/i;
  const anglais = /\b(?:must|should|shall|can|will|does|do|is|are|has|have)\s+not\b|\b\w+n't\b/i;
  return francais.test(clean) || anglais.test(clean);
}
