/**
 * Confidence of a derived link, and what it learns from the humans (§9.4).
 *
 * Three rules, and no black box: the score is always accompanied by the terms
 * that produced it, the weights only ever move between bounds, and a rejected
 * link weakens the next suggestion of the same kind instead of disappearing
 * silently.
 *
 * Pure: no Forge, no clock, no randomness.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */

/** Tokens that carry no signal for a criterion and a test. */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'should', 'must', 'shall', 'can', 'will',
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'avec', 'pour', 'que',
  'qui', 'ne', 'pas', 'devrait', 'peut', 'est', 'etre', 'sont', 'dans', 'sur', 'au',
  'aux', 'ce', 'cette', 'son', 'sa', 'ses', 'leur', 'plus', 'tout', 'tous', 'par',
]);

/** Minimum length of a meaningful token. */
const MIN_TOKEN_LENGTH = 3;

/** Weights never fall below this, nor above this: the scale stays readable. */
export const MIN_WEIGHT = 0.05;

export const MAX_WEIGHT = 2;

/** How much a confirmation strengthens (and a refusal weakens) a token. */
export const LEARN_STEP = 0.15;

/**
 * Splits a text into comparable tokens: lowercase, without accents, without
 * punctuation, without the stop words. Numbers are kept — a criterion with a
 * measure is easier to recognise than one without.
 */
export function tokenize(text: string): string[] {
  const spaced = text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  const normalized = spaced.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const raw = normalized.split(/[^a-z0-9]+/);
  const tokens: string[] = [];
  for (const token of raw) {
    if (token.length < MIN_TOKEN_LENGTH) continue;
    if (STOPWORDS.has(token)) continue;
    tokens.push(stem(token));
  }
  return tokens;
}

/**
 * Light stemming: « expire », « expired » et « expiré » se rejoignent. It is
 * deliberately crude — enough to recognise a test that speaks about the
 * criterion, never enough to pretend to understand French morphology.
 */
export function stem(token: string): string {
  if (token.length <= 4) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  for (const suffix of ['ed', 'ing', 'es', 's', 'e']) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      return token.slice(0, token.length - suffix.length);
    }
  }
  return token;
}

/** Jaccard similarity of two token lists: 0 (nothing in common) to 1. */
export function similarity(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const setLeft = new Set(left);
  const setRight = new Set(right);
  const shared = [...setLeft].filter((token) => setRight.has(token));
  const union = new Set([...setLeft, ...setRight]);
  return shared.length / union.size;
}

/** One term of the score: a token and the weight it carries. */
export interface ConfidenceTerm {
  token: string;
  weight: number;
}

/** The score, and the terms that produced it — never one without the other. */
export interface ScoredConfidence {
  confidence: number;
  terms: ConfidenceTerm[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Shared tokens of two texts, with their learned weight. */
export function sharedTerms(
  left: readonly string[],
  right: readonly string[],
  weights: Readonly<Record<string, number>> = {},
): ConfidenceTerm[] {
  const setRight = new Set(right);
  return [...new Set(left)]
    .filter((token) => setRight.has(token))
    .map((token) => ({ token, weight: weights[token] ?? 1 }));
}

/**
 * Scores a candidate link: the lexical similarity of the criterion and the
 * act, weighted by what the past confirmations taught.
 */
export function scoreConfidence(
  criterionText: string,
  verificationText: string,
  weights: Readonly<Record<string, number>> = {},
): ScoredConfidence {
  const criterionTokens = tokenize(criterionText);
  const verificationTokens = tokenize(verificationText);
  const base = similarity(criterionTokens, verificationTokens);
  const terms = sharedTerms(criterionTokens, verificationTokens, weights);
  if (terms.length === 0) return { confidence: 0, terms };
  const factor = terms.reduce((sum, term) => sum + term.weight, 0) / terms.length;
  return { confidence: clamp(base * factor, 0, 1), terms };
}

/**
 * What the humans taught: a confirmation strengthens the shared tokens, a
 * refusal weakens them. The weights stay inside their bounds, so a long
 * history cannot make a suggestion absurd.
 */
export function learnFrom(
  terms: readonly ConfidenceTerm[],
  confirmed: boolean,
  weights: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const next: Record<string, number> = { ...weights };
  for (const term of terms) {
    const current = next[term.token] ?? 1;
    const moved = confirmed ? current + LEARN_STEP : current - LEARN_STEP;
    next[term.token] = clamp(moved, MIN_WEIGHT, MAX_WEIGHT);
  }
  return next;
}

/**
 * What a confidence means (§9.2): above the threshold the link shows as
 * provisional coverage, between the floor and the threshold it stays a proposal
 * in the work queue, below it is dropped.
 */
export function confidenceBand(
  confidence: number,
  threshold: number,
  floor: number,
): 'provisional' | 'proposal' | 'discarded' {
  if (confidence >= threshold) return 'provisional';
  if (confidence >= floor) return 'proposal';
  return 'discarded';
}
