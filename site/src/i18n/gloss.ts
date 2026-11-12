/**
 * Gloses anglaises du projet de démonstration.
 *
 * Le projet semé est écrit en français et le moteur travaille sur ce texte :
 * les empreintes, les dates et les jugements sont donc calculés sur le
 * français. Ces gloses ne servent qu'à l'affichage — aucun chiffre, aucune
 * date et aucun verdict n'est traduit ici.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */

/** Les critères du projet semé, par identifiant stable. */
export const CRITERION_GLOSS: Record<string, string> = {
  'crit_TRAME-101_AC-1': 'the weave classifies the criteria by ticket',
  'crit_TRAME-101_AC-2': 'an expired token is refused',
  'crit_TRAME-101_AC-3': 'the dashboard stays fast',
  'crit_TRAME-101_AC-4': 'the declared coverage does not drop',
  'crit_TRAME-102_AC-1': 'a perforation is reported on screen',
  'crit_TRAME-102_AC-2': 'a deleted criterion leaves no hole',
  'crit_TRAME-102_AC-3': 'the weave report can be printed',
  'crit_TRAME-102_AC-4': 'the bulletin is dated and comparable',
  'crit_TRAME-103_AC-1': 'the permissions of a ticket are respected',
  'crit_TRAME-103_AC-2': 'a derived link is never counted as coverage',
  'crit_TRAME-103_AC-3': 'the interface stays pleasant',
  'crit_TRAME-103_AC-4': 'the certificate declares the missing parts',
  'crit_TRAME-104_AC-1': 'the loose threads withdraw their coverage',
  'crit_TRAME-104_AC-2': 'a renamed test is no longer counted',
  'crit_TRAME-104_AC-3': 'the computation is replayable identically',
  'crit_TRAME-104_AC-4': 'the risk zone is displayed',
  'crit_TRAME-105_AC-1': 'the hole explorer sorts by priority',
  'crit_TRAME-105_AC-2': 'the test proposal is never applied',
  'crit_TRAME-105_AC-3': 'the proof folder is robust',
  'crit_TRAME-105_AC-4': 'the reformulation proposes a measure',
  'crit_TRAME-106_AC-1': 'the coverage kiosk tells the absences apart',
  'crit_TRAME-106_AC-2': 'a merged criterion keeps its history',
  'crit_TRAME-106_AC-3': 'the naming convention is enough on day one',
  'crit_TRAME-106_AC-4': 'the deleted criterion leaves the perimeter',
};

/** Les résumés des tickets du projet semé. */
export const TICKET_GLOSS: Record<string, string> = {
  'TRAME-101': 'Weaving and token security',
  'TRAME-102': 'Perforations and the registry',
  'TRAME-103': 'Confidentiality and the certificate',
  'TRAME-104': 'Loose threads and risk zones',
  'TRAME-105': 'Holes, proposals and reformulations',
  'TRAME-106': 'Absences and the naming convention',
};

/** Le texte affiché d'un critère, dans la langue du site. */
export function criterionText(lang: string, id: string, original: string): string {
  return lang === 'fr' ? original : (CRITERION_GLOSS[id] ?? original);
}

/** Le texte affiché d'un ticket, dans la langue du site. */
export function ticketText(lang: string, key: string, original: string): string {
  return lang === 'fr' ? original : (TICKET_GLOSS[key] ?? original);
}
