import type { ActorContext, Deps } from '../ports.js';
import type { Coverage } from '../types.js';
import type { MessageKey } from '../i18n/index.js';
import {
  coverageOf,
  envelope,
  figuresOf,
  loadScope,
  messagesOf,
  readPersonFilter,
  readScope,
  readText,
} from './common.js';
import type { CoverageFigures } from './common.js';

/** La ligne de couverture demandée : déclarée, provisoire, ou les deux. */
type CoverageMode = 'declared' | 'provisional' | 'all';

/** Les trois modes acceptés ; par défaut, la ligne déclarée. */
const MODES: readonly CoverageMode[] = ['declared', 'provisional', 'all'];

/** Le mode demandé, ou le mode par défaut quand il n'est pas connu. */
function readMode(value: unknown): CoverageMode {
  const text = readText(value);
  const found = MODES.find((mode) => mode === text);
  return found ?? 'declared';
}

/**
 * La ligne demandée, avec son effectif et son dénominateur.
 *
 * La couverture provisoire a sa propre ligne et n'entre jamais dans la
 * couverture déclarée (§9.2, §24.7) : la ligne demandée est donc celle que
 * l'appelant a nommée, jamais un mélange.
 */
function focusOf(
  figures: CoverageFigures,
  mode: CoverageMode,
): { line: CoverageMode; count: number; total: number; percent: number } | null {
  const figure =
    mode === 'provisional'
      ? figures.coveredProvisional
      : mode === 'declared'
        ? figures.coveredDeclared
        : null;
  if (!figure) return null;
  return { line: mode, count: figure.count, total: figure.total, percent: figure.percent };
}

/** Les messages de la réponse : ce que l'appelant doit savoir avant de lire. */
function messagesFor(
  deps: Deps,
  figures: CoverageFigures,
  coverage: Coverage,
): string[] {
  const extra: MessageKey[] = ['msg.dated-scope'];
  if (coverage.coveredProvisional > 0) extra.push('msg.provisional');
  if (coverage.byStrength.declared > 0) extra.push('msg.covered-on-paper');
  return messagesOf(deps, figures, extra);
}

/**
 * Couverture par force, par liaison et par fraîcheur, avec effectifs (§16).
 *
 * La réponse est **une trame datée et scopée** : le périmètre, la date, les
 * effectifs, les trois axes décomposés (jamais fusionnés), les deux lignes de
 * couverture (déclarée et provisoire), les pourcentages qui portent leur
 * dénominateur, et les angles morts — ce que l'app n'a pas pu voir (§22).
 *
 * Entrées : scope (ticket/sprint/projet/version), mode? — lot L8.
 */
export async function run(
  deps: Deps,
  payload: Record<string, unknown>,
  _actor: ActorContext,
): Promise<unknown> {
  const person = readPersonFilter(payload);
  if (person) return person;
  const read = readScope(payload);
  if (!read.ok) return read.refusal;
  const data = await loadScope(deps, read.request);
  const coverage = await coverageOf(deps, data);
  const figures = figuresOf(coverage);
  const mode = readMode(payload.mode);
  return {
    ...envelope(read.request, coverage.computedAt),
    mode,
    coverage,
    focus: focusOf(figures, mode),
    figures,
    blindSpots: coverage.blindSpots,
    messages: messagesFor(deps, figures, coverage),
  };
}
