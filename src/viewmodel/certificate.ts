/**
 * Vue-modèle du certificat de trame (§12.5).
 *
 * Un certificat sans ses manques est un compliment, pas une preuve : la liste
 * **explicite** de ce qui n'est pas couvert est le cœur du document (§24.14).
 * Il porte aussi le périmètre, la date, la couverture détaillée, les actes de
 * vérification, les perforations et fils détendus ouverts, et les critères
 * infalsifiables.
 *
 * Pur : il reçoit les entités, il ne lit rien. La page markdown prête à
 * publier est produite par `src/domain/certificate.ts`.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { Lang } from '../i18n/index';
import { t } from '../i18n/index';
import { label } from '../i18n/index';
import type {
  Coverage,
  Criterion,
  Dangling,
  Perforation,
  ScopeType,
  VerificationForm,
} from '../types';
import type { CertificateLine } from '../types';
import { coverageView, danglingLine, perforationLine, tableHead } from './common';
import type { CoverageView, DanglingLine, PerforationLine, RegisterRow, TableHead } from './common';
import { text } from './labels';

/* ------------------------------------------------------------------ entrée */

export interface CertificateViewInput {
  language: Lang;
  scope: string;
  scopeType: ScopeType;
  issuedAt: string;
  coverage: Coverage;
  /** Les lignes d'acte, une par critère tissé (produites par le domaine). */
  lines: readonly CertificateLine[];
  perforations: readonly Perforation[];
  dangling: readonly Dangling[];
  /** Les critères que rien ne peut vérifier (§8.4). */
  unfalsifiable: readonly Criterion[];
  /** Les critères vérifiables qu'aucun acte ne couvre plus. */
  notCovered: readonly Criterion[];
  confluencePageRef?: string;
}

/* ------------------------------------------------------------------ sortie */

/** Une ligne d'acte : la force, la forme, la date, le chemin du lien. */
export interface CertificateActLine {
  criterionKey: string;
  ticketKey: string;
  form: VerificationForm;
  formLabel: string;
  strengthLabel: string;
  executedAt: string;
  pathLabel: string;
}

/** Un critère infalsifiable du certificat, avec sa raison. */
export interface UnfalsifiableLine {
  ticketKey: string;
  criterionKey: string;
  text: string;
  reason: string;
}

/** Un critère nommé comme non couvert : la déclaration explicite (§24.14). */
export interface NotCoveredLine {
  ticketKey: string;
  criterionKey: string;
  text: string;
}

export interface WeaveCertificateView {
  scope: string;
  scopeType: ScopeType;
  issuedAt: string;
  language: Lang;
  coverage: CoverageView;
  /** L'entête du tableau des actes de vérification. */
  actHead: TableHead;
  acts: CertificateActLine[];
  actRows: RegisterRow[];
  perforations: PerforationLine[];
  dangling: DanglingLine[];
  unfalsifiable: UnfalsifiableLine[];
  notCovered: NotCoveredLine[];
  /** La déclaration explicite : ce qui n'est PAS couvert. */
  declaration: { count: number; word: string };
  confluencePageRef?: string;
  messages: string[];
}

/** Une ligne d'acte, avec ses libellés. */
function toActLine(lang: Lang, line: CertificateLine): CertificateActLine {
  return {
    criterionKey: line.criterionKey,
    ticketKey: line.ticketKey,
    form: line.form,
    formLabel: label(lang, 'form', line.form),
    strengthLabel: label(lang, 'strength', line.strength),
    executedAt: line.executedAt,
    pathLabel: label(lang, 'path', line.linkPath),
  };
}

/** Un critère infalsifiable, avec sa raison (§8.4). */
function toUnfalsifiable(lang: Lang, criterion: Criterion): UnfalsifiableLine {
  return {
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    text: criterion.text,
    reason: criterion.unfalsifiableReason ?? text(lang, 'unfalsifiable'),
  };
}

/** Un critère nommé non couvert : c'est la déclaration qui rend le certificat. */
function toNotCovered(criterion: Criterion): NotCoveredLine {
  return {
    ticketKey: criterion.ticketKey,
    criterionKey: criterion.criterionKey,
    text: criterion.text,
  };
}

/** L'entête du tableau des actes. */
function actHead(lang: Lang): TableHead {
  return tableHead([
    text(lang, 'ticket'),
    text(lang, 'criterion'),
    text(lang, 'form'),
    text(lang, 'force'),
    text(lang, 'date'),
    text(lang, 'path'),
  ]);
}

/** Une ligne d'acte en registre. */
function actRow(act: CertificateActLine): RegisterRow {
  return {
    cells: [
      act.ticketKey,
      act.criterionKey,
      act.formLabel,
      act.strengthLabel,
      act.executedAt,
      act.pathLabel,
    ],
    state: { motif: 'solid', word: act.strengthLabel },
  };
}

/** Bâtit le certificat. */
export function buildCertificateView(input: CertificateViewInput): WeaveCertificateView {
  const lang = input.language;
  const acts = input.lines.map((line) => toActLine(lang, line));
  const view: WeaveCertificateView = {
    scope: input.scope,
    scopeType: input.scopeType,
    issuedAt: input.issuedAt,
    language: lang,
    coverage: coverageView(lang, input.coverage),
    actHead: actHead(lang),
    acts,
    actRows: acts.map(actRow),
    perforations: input.perforations.map((row) => perforationLine(lang, row)),
    dangling: input.dangling.map((row) => danglingLine(lang, row)),
    unfalsifiable: input.unfalsifiable.map((row) => toUnfalsifiable(lang, row)),
    notCovered: input.notCovered.map(toNotCovered),
    declaration: { count: input.notCovered.length, word: text(lang, 'not-covered') },
    messages: [t(lang, 'msg.dated-scope')],
  };
  if (input.confluencePageRef !== undefined) {
    view.confluencePageRef = input.confluencePageRef;
  }
  return view;
}