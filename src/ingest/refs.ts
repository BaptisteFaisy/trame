/**
 * Références citées dans un nom de test, un titre de PR ou un commentaire —
 * les **deux chemins déterministes** de §10 (mention explicite et convention
 * de nommage) et de la recette §24.17.
 *
 * Module **pur** : ni réseau, ni horloge, ni Forge. Une règle existe une
 * seule fois, ici — le graphe, Bitbucket, les commentaires et la CI lisent
 * tous ces helpers, jamais une copie (zéro duplication).
 *
 * Deux motifs, deux chemins :
 * - `PROJ-12` — la clé d'un ticket Jira (`KEY-123`), capitalisée ;
 * - `AC-3` — l'identifiant stable d'un critère dans son ticket (§4).
 *
 * L'ordre des références renvoyées est l'ordre d'apparition : la lecture est
 * déterministe, donc le tissage l'est aussi (§24.17, pas de modèle).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */

/** Clé de ticket Jira : `PROJ-12`, `TRAME-1`, `ABC-1234`. */
const TICKET_KEY = /\b([A-Z][A-Z0-9]{1,9}-\d{1,6})\b/g;

/** Identifiant de critère : `AC-3`, `AC-12` (§4). */
const CRITERION_KEY = /\bAC[-_ ]?(\d{1,4})\b/gi;

/** Convention de nommage : le test commence par la clé du ticket (`PROJ-12.`). */
const NAMING_CONVENTION = /^([A-Z][A-Z0-9]{1,9}-\d{1,6})[._-]/;

/** Déduplique en gardant l'ordre d'apparition. */
function unique(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

/**
 * `AC-3` ressemble à une clé de ticket, mais §4 réserve ce motif aux
 * identifiants de critère : il ne doit jamais être lu comme un ticket.
 */
const CRITERION_SHAPED = /^AC[-_ ]?\d{1,4}$/i;

/** Toutes les clés de ticket citées dans un texte, dans l'ordre d'apparition. */
export function ticketKeysIn(text: string): string[] {
  return unique(
    Array.from(text.matchAll(TICKET_KEY), (match) => match[1]).filter(
      (key) => !CRITERION_SHAPED.test(key),
    ),
  );
}

/** Tous les identifiants de critère cités dans un texte (`AC-3`). */
export function criterionRefsIn(text: string): string[] {
  return unique(
    Array.from(text.matchAll(CRITERION_KEY), (match) => `AC-${match[1]}`),
  );
}

/**
 * La clé de ticket **de la convention de nommage** : `PROJ-12.testShouldRetry`
 * → `PROJ-12` (§10, chemin 2 ; §24.17). Déterministe : aucun modèle, aucune
 * probabilité — la convention est une convention, elle s'applique ou non.
 *
 * Une clé citée *ailleurs* dans le nom (pas au début) n'est pas la convention :
 * elle est déjà renvoyée par `ticketKeysIn`, qui correspond au chemin 1.
 */
export function ticketKeyByConvention(name: string): string | undefined {
  const match = NAMING_CONVENTION.exec(name.trim());
  if (!match) return undefined;
  return CRITERION_SHAPED.test(match[1]) ? undefined : match[1];
}

/**
 * La clé de ticket d'un nom de test : la convention d'abord (§10 chemin 2),
 * puis la mention explicite (§10 chemin 1). `undefined` quand le nom ne cite
 * aucun ticket — l'app ne devine jamais le ticket d'un test.
 */
export function ticketKeyInName(name: string): string | undefined {
  return ticketKeyByConvention(name) ?? ticketKeysIn(name)[0];
}

/**
 * Les identifiants de critère cités par un nom de test : `AC-3` dans
 * `OrderServiceTest.AC-3.shouldRetry` → `['AC-3']`.
 */
export function criterionRefsInName(name: string): string[] {
  return criterionRefsIn(name);
}
