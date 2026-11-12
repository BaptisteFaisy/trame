/**
 * View-model of the weave map (§17) : the same information as the registries,
 * but shaped for the visual — warp threads (criteria), weft passes (acts),
 * meshes, holes, perforations and declaration threads.
 *
 * Every state is double-coded by a pattern and a word, never by colour alone
 * (§22 accessibility). The métré decides the SIZE of a hole, so the visual and
 * the priority agree.
 *
 * Pure : it takes entities, it reads nothing.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import type {
  Criterion,
  Dangling,
  Link,
  Perforation,
  ScopeType,
  Verification,
} from '../types.js';
import type { Lang } from '../i18n/index.js';
import { label } from '../i18n/index.js';

/** A vertical thread: one criterion of the scope. */
export interface WarpThread {
  criterionId: string;
  criterionKey: string;
  ticketKey: string;
  text: string;
  kindLabel: string;
  kind: Criterion['kind'];
  falsifiable: boolean;
  /** The perforation that recolours this thread, when it changed after weaving. */
  perforated: boolean;
}

/** A horizontal thread: one act of verification. */
export interface WeftPass {
  verificationId: string;
  name: string;
  formLabel: string;
  strength: Verification['strength'];
  /** A thin dashed pass: it exists but proves nothing (declaration, §7). */
  declaration: boolean;
  /** A pass that no longer crosses anything (§8.3). */
  dangling: boolean;
}

/** The crossing of a warp thread and a weft pass (§9). */
export interface Mesh {
  criterionId: string;
  verificationId: string;
  linkKind: Link['kind'];
  /** A derived mesh is dotted: provisional, never as solid as a declared one. */
  provisional: boolean;
}

/** A hole the visual draws, sized by the métré. */
export interface WeaveHole {
  criterionId: string;
  criterionKey: string;
  priorityLabel: string;
  /** 1..3, from the priority: the métré drives the visual (§12.1). */
  size: 1 | 2 | 3;
}

export interface WeaveMap {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  threads: WarpThread[];
  passes: WeftPass[];
  meshes: Mesh[];
  holes: WeaveHole[];
}

/** The size of a hole follows its priority, coarse-grained (§12.1). */
export function holeSize(priorityScore: number): 1 | 2 | 3 {
  if (priorityScore >= 0.7) return 3;
  if (priorityScore >= 0.4) return 2;
  return 1;
}

/** A declaration is a thin dashed pass: it proves nothing (§7). */
export function isDeclaration(strength: Verification['strength']): boolean {
  return strength === 'declared';
}

export interface WeaveMapInput {
  scope: string;
  scopeType: ScopeType;
  computedAt: string;
  language: Lang;
  criteria: readonly Criterion[];
  verifications: readonly Verification[];
  links: readonly Link[];
  perforations?: readonly Perforation[];
  dangling?: readonly Dangling[];
  /** A hole carries its priority ; the métré decides the size. */
  holes?: readonly { criterionId: string; criterionKey: string; priorityScore: number }[];
}

/** Builds the view-model of the weave map. */
export function buildWeaveMap(input: WeaveMapInput): WeaveMap {
  const perforated = new Set((input.perforations ?? []).map((row) => row.criterionId));
  const loose = new Set(
    (input.dangling ?? []).map((row) => row.verificationId),
  );
  const liveLinks = input.links.filter((link) => !link.rejectedAt);

  const threads: WarpThread[] = input.criteria.map((criterion) => ({
    criterionId: criterion.id,
    criterionKey: criterion.criterionKey,
    ticketKey: criterion.ticketKey,
    text: criterion.text,
    kindLabel: label(input.language, 'kind', criterion.kind),
    kind: criterion.kind,
    falsifiable: criterion.falsifiable,
    perforated: perforated.has(criterion.id),
  }));

  const passes: WeftPass[] = input.verifications.map((verification) => ({
    verificationId: verification.id,
    name: verification.name,
    formLabel: label(input.language, 'form', verification.form),
    strength: verification.strength,
    declaration: isDeclaration(verification.strength),
    dangling: loose.has(verification.id),
  }));

  const meshes: Mesh[] = liveLinks
    .filter((link) => !loose.has(link.verificationId))
    .map((link) => ({
      criterionId: link.criterionId,
      verificationId: link.verificationId,
      linkKind: link.kind,
      provisional: link.kind === 'derived',
    }));

  const holes: WeaveHole[] = (input.holes ?? []).map((hole) => ({
    criterionId: hole.criterionId,
    criterionKey: hole.criterionKey,
    priorityLabel: String(hole.priorityScore.toFixed(2)),
    size: holeSize(hole.priorityScore),
  }));

  return {
    scope: input.scope,
    scopeType: input.scopeType,
    computedAt: input.computedAt,
    language: input.language,
    threads,
    passes,
    meshes,
    holes,
  };
}