/**
 * Les briques communes des écrans (§22).
 *
 * Les onze écrans de §17 partagent le même vocabulaire d'affichage, et il
 * n'existe qu'une seule implémentation de chaque chose (docs/CONTRACTS.md §1) :
 *
 *  - **l'état double-codé** : un `Motif` que le visuel dessine (trait plein,
 *    pointillé, croix…) et un `word` que l'écran écrit à côté. Jamais la
 *    couleur seule — c'est l'exigence d'accessibilité du §22 ;
 *  - **la ligne de registre** et **l'entête de tableau** : la même forme pour
 *    le registre des perforations, celui des fils détendus, celui des trous ;
 *  - **l'état vide** : un registre sans rien à montrer le dit ;
 *  - **la figure** : un effectif, son dénominateur, et le refus de conclure de
 *    `src/domain/percent.ts` — un chiffre sans effectif n'est jamais affiché ;
 *  - **le bloc de couverture** : les trois axes (force, liaison, fraîcheur),
 *    jamais fusionnés, et la phrase « aucun critère écrit » quand le
 *    périmètre n'a rien à mesurer (§24.16).
 *
 * Les libellés vivent dans `src/viewmodel/labels.ts` ; les lignes de registre
 * (perforation, fil détendu, trou) sont ici, une seule fois pour tous les
 * écrans qui les montrent.
 *
 * Le module est **pur** : il ne lit rien, il ne connaît pas Forge, et la date
 * lui vient de l'entrée.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { conclusion, hasNoCriterion, percent } from '../domain/percent';
import type { Conclusion } from '../domain/percent';
import { daysBetween } from '../domain/perforations';
import { explainScore } from '../domain/metric';
import type {
  Coverage,
  Dangling,
  DanglingReason,
  Hole,
  LinkKind,
  Perforation,
  PerforationClass,
  Strength,
} from '../types';
import type { Lang } from '../i18n/index';
import { label } from '../i18n/index';
import { stateWord, text } from './labels';

/* ------------------------------------------------------------------ motifs */

/**
 * Les motifs que le visuel sait dessiner (§22).
 *
 * `solid` : un état neutre. `dashed` : une déclaration — elle existe, elle ne
 * prouve rien (§7). `dotted` : une liaison dérivée, provisoire. `crossed` :
 * une perforation ou un fil détendu. `empty` : un trou ou une absence du
 * projet. `striped` : un angle mort de l'app (§22).
 */
export type Motif = 'solid' | 'dashed' | 'dotted' | 'crossed' | 'empty' | 'striped';

/** Un état double-codé : le MOTIF que l'œil voit, le MOT que l'écran écrit. */
export interface CodedState {
  motif: Motif;
  word: string;
}

/** Un état codé. */
export function codedState(motif: Motif, word: string): CodedState {
  return { motif, word };
}

/* --------------------------------------------------------- états vides */

/** Un registre qui n'a rien à montrer : il le dit, il ne montre pas de ligne. */
export interface EmptyState {
  state: 'empty';
  motif: Motif;
  word: string;
}

/** L'état vide d'un écran. */
export function emptyState(word: string): EmptyState {
  return { state: 'empty', motif: 'empty', word };
}

/* -------------------------------------------------------------- tableaux */

/** L'entête d'un tableau : ses colonnes, dans l'ordre. */
export interface TableHead {
  cells: string[];
}

/** Un entête de tableau. */
export function tableHead(cells: readonly string[]): TableHead {
  return { cells: [...cells] };
}

/** Une ligne de registre : ses cellules, et l'état qui la qualifie. */
export interface RegisterRow {
  cells: string[];
  state: CodedState;
}

/** Une ligne de registre. */
export function registerRow(cells: readonly string[], state: CodedState): RegisterRow {
  return { cells: [...cells], state };
}

/* ---------------------------------------------------------------- figures */

/**
 * Une figure : l'effectif, son dénominateur, et le verdict de l'app.
 *
 * Le pourcentage est **absent** quand le dénominateur est nul : un périmètre
 * sans critère n'est pas « 0 % », c'est « aucun critère écrit » (§24.16).
 * `conclusion` porte le refus de conclure sous l'effectif minimal (§22).
 */
export interface Figure {
  label: string;
  count: number;
  total: number;
  percent?: number;
  conclusion: Conclusion;
}

/** Une figure d'effectif. */
export function figure(label: string, count: number, total: number): Figure {
  const share = percent(count, total);
  const out: Figure = { label, count, total, conclusion: conclusion(total) };
  if (total > 0) out.percent = share.percent;
  return out;
}

/* ---------------------------------------------------------- la couverture */

/** Une ligne d'axe : la force, le type de liaison, ou la fraîcheur. */
export interface AxisLine {
  key: string;
  label: string;
  count: number;
}

/**
 * Le bloc « couverture » d'un écran.
 *
 * Les trois axes sont **décomposés et jamais fusionnés** (§8.1, §24.3) et les
 * figures portent chacune leur effectif et leur dénominateur. Un périmètre
 * sans aucun critère écrit n'a **aucun** pourcentage (§24.16).
 */
export interface CoverageView {
  /** Les critères écrits, vérifiables ou non. */
  written: number;
  /** Les critères vérifiables : le dénominateur de la trame. */
  verifiable: number;
  coveredDeclared: number;
  coveredProvisional: number;
  proven: number;
  holes: number;
  unfalsifiable: number;
  byStrength: AxisLine[];
  byLink: AxisLine[];
  byFreshness: AxisLine[];
  figures: Figure[];
  /** `not-enough-history` : sous l'effectif minimal, l'app refuse de conclure. */
  conclusion: Conclusion;
  /** Un périmètre sans aucun critère écrit : pas « 0 % », une autre phrase. */
  noCriterionWritten: boolean;
  /** La phrase à afficher quand il n'y a rien à mesurer. */
  message: string;
}

/** L'axe « par force » : machine / attestée / déclarée. */
function strengthAxes(lang: Lang, coverage: Coverage): AxisLine[] {
  const strengths: Strength[] = ['machine', 'attested', 'declared'];
  return strengths.map((strength) => ({
    key: strength,
    label: label(lang, 'strength', strength),
    count: coverage.byStrength[strength],
  }));
}

/** L'axe « par type de liaison » : déclarée / confirmée / dérivée. */
function linkAxes(lang: Lang, coverage: Coverage): AxisLine[] {
  const kinds: LinkKind[] = ['declared', 'confirmed', 'derived'];
  return kinds.map((kind) => ({
    key: kind,
    label: label(lang, 'link', kind),
    count: coverage.byLink[kind],
  }));
}

/** L'axe « par fraîcheur » : à jour / périmée. */
function freshnessAxes(lang: Lang, coverage: Coverage): AxisLine[] {
  return (['current', 'stale'] as const).map((freshness) => ({
    key: freshness,
    label: label(lang, 'freshness', freshness),
    count: coverage.byFreshness[freshness],
  }));
}

/** Les figures de la trame : deux lignes de couverture, plus les trous. */
function coverageFigures(lang: Lang, coverage: Coverage): Figure[] {
  const total = coverage.criteriaTotal;
  const written = total + coverage.unfalsifiableCount;
  return [
    figure(text(lang, 'covered-declared'), coverage.coveredDeclared, total),
    figure(text(lang, 'covered-provisional'), coverage.coveredProvisional, total),
    figure(text(lang, 'proven'), coverage.proven, total),
    figure(text(lang, 'holes'), coverage.holes, total),
    figure(text(lang, 'unfalsifiable'), coverage.unfalsifiableCount, written),
  ];
}

/** Le bloc « couverture » d'un écran, décomposé et daté par la trame. */
export function coverageView(lang: Lang, coverage: Coverage): CoverageView {
  const written = coverage.criteriaTotal + coverage.unfalsifiableCount;
  const noCriterionWritten = hasNoCriterion(coverage);
  const view: CoverageView = {
    written,
    verifiable: coverage.criteriaTotal,
    coveredDeclared: coverage.coveredDeclared,
    coveredProvisional: coverage.coveredProvisional,
    proven: coverage.proven,
    holes: coverage.holes,
    unfalsifiable: coverage.unfalsifiableCount,
    byStrength: strengthAxes(lang, coverage),
    byLink: linkAxes(lang, coverage),
    byFreshness: freshnessAxes(lang, coverage),
    figures: [],
    conclusion: conclusion(coverage.criteriaTotal),
    noCriterionWritten,
    message: noCriterionWritten ? text(lang, 'no-criterion-written') : '',
  };
  if (!noCriterionWritten) view.figures = coverageFigures(lang, coverage);
  return view;
}

/* ------------------------------------------------------ lignes de registre */

/**
 * Une perforation, en ligne de registre (§12.2).
 *
 * Elle porte **les deux dates** — le dernier changement et la dernière
 * vérification — et l'écart entre les deux, en jours : de combien la
 * couverture a vieilli (§22 explicabilité, §24.4).
 */
export interface PerforationLine {
  id: string;
  criterionId: string;
  ticketKey: string;
  criterionKey: string;
  verificationId: string;
  /** La version courante du critère. */
  version: number;
  changedAt: string;
  verifiedAt: string;
  /** L'écart entre la vérification et le changement, en jours. */
  gapDays: number;
  ageDays: number;
  klass: PerforationClass;
  classLabel: string;
  status: Perforation['state'];
  stateWord: string;
  state: CodedState;
}

/** Une perforation en ligne de registre. */
export function perforationLine(lang: Lang, perforation: Perforation): PerforationLine {
  return {
    id: perforation.id,
    criterionId: perforation.criterionId,
    ticketKey: perforation.ticketKey,
    criterionKey: perforation.criterionKey,
    verificationId: perforation.verificationId,
    version: perforation.criterionVersionNo,
    changedAt: perforation.changedAt,
    verifiedAt: perforation.verifiedAt,
    gapDays: daysBetween(perforation.verifiedAt, perforation.changedAt),
    ageDays: perforation.ageDays,
    klass: perforation.klass,
    classLabel: label(lang, 'perforation', perforation.klass),
    status: perforation.state,
    stateWord: stateWord(lang, perforation.state),
    state: codedState('crossed', stateWord(lang, perforation.state)),
  };
}

/**
 * Un fil détendu, en ligne de registre (§12.3).
 *
 * La raison vient du dictionnaire (§8.3) et l'impact est chiffré : combien de
 * mailles cet acte mort retire de la couverture (§24.5).
 */
export interface DanglingLine {
  id: string;
  verificationId: string;
  verificationName: string;
  reason: DanglingReason;
  reasonLabel: string;
  detectedAt: string;
  /** Les mailles retirées de la couverture. */
  impact: number;
  status: Dangling['state'];
  stateWord: string;
  state: CodedState;
}

/** Un fil détendu en ligne de registre. */
export function danglingLine(lang: Lang, dangling: Dangling): DanglingLine {
  return {
    id: dangling.id,
    verificationId: dangling.verificationId,
    verificationName: dangling.verificationName,
    reason: dangling.reason,
    reasonLabel: label(lang, 'dangling', dangling.reason),
    detectedAt: dangling.detectedAt,
    impact: dangling.impact,
    status: dangling.state,
    stateWord: stateWord(lang, dangling.state),
    state: codedState('crossed', stateWord(lang, dangling.state)),
  };
}

/**
 * Un trou, en ligne de registre (§11, §12.1).
 *
 * Le trou porte son **calcul** : le score et les trois termes qui l'ont
 * produit. Une priorité qui ne s'explique pas n'est pas affichable (§22,
 * §24.11). La taille suit la priorité, comme sur la carte (§12.1).
 */
export interface HoleLine {
  id: string;
  criterionId: string;
  ticketKey: string;
  criterionKey: string;
  kind: Hole['kind'];
  kindLabel: string;
  zone?: string;
  priorityScore: number;
  priorityLabel: string;
  priorityTerms: Hole['priorityTerms'];
  priorityExplanation: string;
  status: Hole['state'];
  stateWord: string;
  size: 1 | 2 | 3;
  state: CodedState;
}

/** Un trou en ligne de registre. */
export function holeLine(lang: Lang, hole: Hole): HoleLine {
  const explanation = hole.priorityTerms.length > 0 ? explainScore(hole.priorityTerms) : '';
  const result: HoleLine = {
    id: hole.id,
    criterionId: hole.criterionId,
    ticketKey: hole.ticketKey,
    criterionKey: hole.criterionKey,
    kind: hole.kind,
    kindLabel: label(lang, 'kind', hole.kind),
    priorityScore: hole.priorityScore,
    priorityLabel: hole.priorityScore.toFixed(2).replace('.', ','),
    priorityTerms: [...hole.priorityTerms],
    priorityExplanation: explanation,
    status: hole.state,
    stateWord: stateWord(lang, hole.state),
    size: holeSize(hole.priorityScore),
    state: codedState('empty', stateWord(lang, hole.state)),
  };
  if (hole.zone !== undefined) result.zone = hole.zone;
  return result;
}

/** La taille d'un trou suit sa priorité, de façon grossière (§12.1). */
export function holeSize(priorityScore: number): 1 | 2 | 3 {
  if (priorityScore >= 0.7) return 3;
  if (priorityScore >= 0.4) return 2;
  return 1;
}