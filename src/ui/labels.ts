/**
 * Les mots du **chrome** de l'interface — ceux que le dictionnaire serveur ne
 * porte pas : le nom d'un champ de saisie, le libellé d'un bouton, le titre
 * d'un bloc.
 *
 * Les libellés du **domaine** (type de critère, force, forme, priorité,
 * classe de perforation…) ne sont PAS ici : ils sont calculés côté serveur et
 * arrivent dans le view-model (`kindLabel`, `formLabel`, `priorityLabel`…).
 * L'interface les affiche, elle ne les retraduit pas (§22, §24).
 *
 * `src/i18n/*` et `src/viewmodel/labels.ts` sont gelés (docs/CONTRACTS.md §2) :
 * ce fichier n'ajoute que ce qui leur manque, et rien d'autre. Il ne contient
 * aucun mot de domaine.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';

/** Les clés du chrome de l'interface. */
export type UiLabelKey =
  | 'scope'
  | 'load'
  | 'retry'
  | 'no-scope'
  | 'scope-type'
  | 'ticket'
  | 'sprint'
  | 'project'
  | 'version'
  | 'criteria'
  | 'select-criterion'
  | 'threads'
  | 'passes'
  | 'meshes'
  | 'forces'
  | 'proposals'
  | 'acts'
  | 'coverage'
  | 'comparison'
  | 'absences'
  | 'holes';

const UI_LABELS: Record<Lang, Record<UiLabelKey, string>> = {
  fr: {
    scope: 'Périmètre',
    load: 'Charger',
    retry: 'Réessayer',
    'no-scope': 'Aucun périmètre : dites à Trame quoi mesurer',
    'scope-type': 'Type de périmètre',
    ticket: 'Ticket',
    sprint: 'Sprint',
    project: 'Projet',
    version: 'Version',
    criteria: 'Critères d’acceptation',
    'select-criterion': 'Choisissez un critère pour voir sa fiche',
    threads: 'Fils de chaîne (critères)',
    passes: 'Passages de trame (actes)',
    meshes: 'Mailles (liaisons vivantes)',
    forces: 'Actes qui couvrent le critère',
    proposals: 'Propositions en attente',
    acts: 'Actes de vérification',
    coverage: 'Couverture',
    comparison: 'Comparaison au témoin précédent',
    absences: 'Absences distinguées',
    holes: 'Trous prioritaires',
  },
  en: {
    scope: 'Scope',
    load: 'Load',
    retry: 'Retry',
    'no-scope': 'No scope: tell Trame what to measure',
    'scope-type': 'Scope type',
    ticket: 'Ticket',
    sprint: 'Sprint',
    project: 'Project',
    version: 'Version',
    criteria: 'Acceptance criteria',
    'select-criterion': 'Pick a criterion to see its sheet',
    threads: 'Warp threads (criteria)',
    passes: 'Weft passes (acts)',
    meshes: 'Meshes (live links)',
    forces: 'Acts covering the criterion',
    proposals: 'Proposals awaiting a decision',
    acts: 'Verification acts',
    coverage: 'Coverage',
    comparison: 'Comparison to the previous witness',
    absences: 'Distinguished absences',
    holes: 'Priority holes',
  },
};

/** Un mot du chrome, dans la langue de l'écran. */
export function ui(lang: Lang, key: UiLabelKey): string {
  return UI_LABELS[lang][key] ?? key;
}
