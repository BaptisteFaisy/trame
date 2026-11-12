/**
 * Types de l'extraction des critères (§6, les six gîtes).
 *
 * Règle fondatrice : **l'app ne crée jamais un critère**. Elle détecte ce qui
 * est déjà écrit, le numérote de façon stable (`AC-1`, `AC-2`, …) et empreinte
 * le texte (§6). Un critère écrit dans un commentaire n'est pas un critère.
 *
 * Ce module est pur : jamais d'import `@forge/*` ici (docs/CONTRACTS.md §3).
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { CriterionKind, CriterionOrigin } from '../types.js';
import type { CriterionTable } from '../ports.js';

/**
 * Le matériau brut d'une origine, préparé par les adaptateurs (`src/ingest/*`)
 * avant d'être confié au collecteur correspondant (`src/collect/*`).
 *
 * Un collecteur ne fait jamais d'appel réseau : il reçoit le texte (ou le
 * tableau, ou la référence) déjà lu, ce qui rend l'extraction testable hors
 * Forge (§18, tests déterministes).
 */
export interface CollectInput {
  /** Identifiant interne Jira du ticket porteur. */
  issueId: string;
  /** Clé lisible du ticket (`PROJ-12`) : sert à la numérotation stable. */
  ticketKey: string;
  /** Le gîte dont vient le matériau (§6) : décide du collecteur. */
  origin: CriterionOrigin;
  /** Texte brut de l'origine (champ, description, page, titre de ticket…). */
  rawText: string;
  /** Tableau de critères, pour l'origine `table` (colonnes puis lignes). */
  table?: CriterionTable;
  /** Page Confluence, pour l'origine `confluence-page` (lien indirect). */
  pageId?: string;
  /**
   * Identifiant de la source hors ticket : sous-tâche de test, page, pièce
   * jointe. Il entre dans le `stableKey` pour distinguer deux sources qui
   * porteraient le même texte.
   */
  sourceId?: string;
  /** Référence de pièce jointe : l'app pointe, elle ne décode pas (§6). */
  attachmentRef?: string;
  /**
   * Résultat consigné d'une sous-tâche de test (§6, origine 5) : il
   * **documente** le critère, il n'en crée jamais un.
   */
  resultText?: string;
  /** Dernière modification du matériau (ISO) : fraîcheur et perforation. */
  updatedAt: string;
  /** Piste d'audit uniquement — jamais un classement de personne (§5). */
  authorRef?: string;
}

/**
 * Un critère détecté, avant son entrée dans le domaine (`Criterion`).
 *
 * La numérotation stable sera reconstruite par origine (§6) : ordre d'
 * apparition dans le champ ou la description, colonne/ligne dans un tableau,
 * case dans une checklist. `stableKey` ancre le critère dans le ticket, donc
 * une ré-extraction ne le renumérote pas au hasard et l'empreinte détecte le
 * changement de texte (§8.2, perforation).
 */
export interface ExtractedCriterion {
  /** Numéro stable dans le ticket : `AC-1`, `AC-2`, … (§4). */
  criterionKey: string;
  /** Texte du critère, tel qu'écrit (nettoyé des marqueurs de liste). */
  text: string;
  /** Gîte d'origine (§6) : affiché, jamais fusionné entre origines. */
  origin: CriterionOrigin;
  /** Type pressenti ; le classement définitif vient du domaine/LLM (§8.4). */
  kind?: CriterionKind;
  /** Indice de non-faisabilité repéré à l'extraction (« rapide », « joli »…). */
  unfalsifiableHint?: string;
  /** Ligne d'apparition dans le matériau : explique la numérotation stable. */
  lineNumber?: number;
  /**
   * Note jointe au critère (résultat d'un test, état d'une case) : elle
   * **documente**, elle ne crée jamais de critère (§6, origine 5).
   */
  documentation?: string;
  /**
   * Identifiant stable de dédoublonnage : `issueId|origine[|portée]|clé`.
   * Deux critères au même texte ont des `stableKey` distincts — les doublons
   * sont signalés, jamais double-comptés dans la couverture (§23).
   */
  stableKey: string;
  /**
   * `stableKey` des doublons écartés par `extractAll` (même ticket, même
   * empreinte) : le doublon est signalé sans être double-compté (§23).
   */
  duplicateRefs?: string[];
}

/**
 * Un matériau écarté parce qu'il porte un secret (§5, recette 20).
 *
 * Le critère lui-même n'est jamais retourné : l'app ne garde aucun secret.
 * Le signalement dit **quel** matériau et **quelle famille** de secret —
 * jamais la valeur trouvée (ce serait la publier).
 */
export interface SecretSignal {
  /** Ticket porteur du matériau. */
  issueId: string;
  /** Clé lisible du ticket porteur. */
  ticketKey: string;
  /** Gîte d'origine du matériau. */
  origin: CriterionOrigin;
  /** Famille du secret (« clé AWS (AKIA/ASIA) ») : jamais la valeur. */
  secretFlag: string;
  /** Empreinte du matériau : on trace sans recopier le secret (§8.2). */
  textHash: string;
}
