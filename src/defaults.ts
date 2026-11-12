/**
 * Frozen defaults (§4, §8, §9, §11). Changing a number here changes what the
 * app calls a hole: every value is quoted in docs/CONTRACTS.md and tested.
 */
import type { Settings } from './ports.js';
import type { CriterionKind } from './types.js';

/** Above this confidence a derived link shows as provisional coverage (§9.2). */
export const DERIVED_LINK_THRESHOLD = 0.85;

/** Below this confidence the link stays a proposal in the work queue (§9.2). */
export const DERIVED_LINK_FLOOR = 0.5;

/** A criterion changed less than this many days ago: fresh perforation (§8.2). */
export const PERFORATION_FRESH_DAYS = 7;

/** Beyond this many days without re-verification: dry perforation (§8.2). */
export const PERFORATION_DRY_DAYS = 30;

/** This many changes without re-verification: multiple perforation (§8.2). */
export const PERFORATION_MULTIPLE_CHANGES = 3;

/**
 * The métré (§11): security and non-regression first, then edge cases, then
 * functional, then comfort. Weights are a decision, not a truth — a team can
 * override them (`metric_rule`), and the score always shows its terms.
 */
export const KIND_WEIGHTS: Record<CriterionKind, number> = {
  security: 1,
  'non-regression': 0.9,
  'edge-case': 0.7,
  functional: 0.5,
  performance: 0.4,
  documentation: 0.2,
  experience: 0.2,
};

/** Weight of the observed zone risk in the métré (§11). */
export const ZONE_RISK_WEIGHT = 0.6;

/** Weight of recurrence: a criterion that already escaped once (§11). */
export const RECURRENCE_WEIGHT = 0.5;

/** LLM sobriety: calls per day, displayed in the budget (§22). */
export const LLM_DAILY_CALL_BUDGET = 500;

/** A coverage figure is refused below this denominator (§22 honesty). */
export const MIN_SAMPLE_FOR_CONCLUSION = 5;

/** Strength ordering: `machine` proves, `declared` only says so (§4). */
export const STRENGTH_RANK = { machine: 3, attested: 2, declared: 1 } as const;

/** Forms of verification and their default strength (§7). */
export const DEFAULT_STRENGTH_BY_FORM = {
  'automated-test': 'machine',
  'manual-case': 'attested',
  'third-party': 'attested',
  'code-review': 'declared',
  'traced-manual': 'declared',
  deployment: 'declared',
  declaration: 'declared',
} as const;

/** Words that make a criterion unfalsifiable (§8.4) — first pass, no model. */
export const UNFALSIFIABLE_MARKERS = [
  'rapide',
  'fast',
  'simple',
  'agréable',
  'pleasant',
  'robuste',
  'robust',
  'ergonomique',
  'user-friendly',
  'intuitif',
  'intuitive',
  'performant',
  'facile',
  'easy to use',
  'joli',
  'nice',
] as const;

/** A criterion shorter than this is half-written: unfalsifiable (§23). */
export const MIN_CRITERION_LENGTH = 12;

export const DEFAULT_SETTINGS: Settings = {
  derivedLinkThreshold: DERIVED_LINK_THRESHOLD,
  derivedLinkFloor: DERIVED_LINK_FLOOR,
  perforationFreshDays: PERFORATION_FRESH_DAYS,
  perforationDryDays: PERFORATION_DRY_DAYS,
  perforationMultipleChanges: PERFORATION_MULTIPLE_CHANGES,
  metricWeights: {
    kind: KIND_WEIGHTS,
    zoneRisk: ZONE_RISK_WEIGHT,
    recurrence: RECURRENCE_WEIGHT,
  },
  llmDailyCallBudget: LLM_DAILY_CALL_BUDGET,
  language: 'fr',
};

/** Merge a team's overrides on the frozen defaults (§11). */
export function withOverrides(base: Settings, over: Partial<Settings>): Settings {
  return {
    ...base,
    ...over,
    metricWeights: { ...base.metricWeights, ...(over.metricWeights ?? {}) },
  };
}
