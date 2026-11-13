import type { ActorContext, Deps } from '../ports';
import type { RecomputeMessage } from '../ports';
import { readPersonFilter, readScope, readText, refusal } from './common';
import type { Refusal } from './common';

/** Les quatre modes de recalcul, un par tranche (§18). */
const MODES: readonly RecomputeMessage['mode'][] = ['criteria', 'verifications', 'links', 'measures'];

/** Le mode demandé : une tranche connue, ou rien. */
type ModeRead = { ok: true; mode: RecomputeMessage['mode'] } | { ok: false; refusal: Refusal };

/** Le mode demandé, ou `links` par défaut quand il n'est pas connu. */
function readMode(value: unknown): ModeRead {
  const text = readText(value) || 'links';
  const found = MODES.find((mode) => mode === text);
  if (!found) {
    return {
      ok: false,
      refusal: refusal('mode illisible', `mode est l'un de ${MODES.join(', ')}`),
    };
  }
  return { ok: true, mode: found };
}

/**
 * Action interne : met en file un recalcul par tranches (consumer, 900 s, §18).
 *
 * Un projet de 50 000 tickets ne se recalcule pas en une fonction (§21) : le
 * recalcul est **mis en file**, jamais calculé en ligne. Le message repart du
 * curseur enregistré, pour ne refaire que ce qui a changé depuis la dernière
 * tranche.
 *
 * Entrées : scope, scopeType, mode — lot L8.
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
  const mode = readMode(payload.mode);
  if (!mode.ok) return mode.refusal;
  const { scope, scopeType } = read.request;
  const cursor = await deps.store.getCursor(scope, mode.mode);
  await deps.queue.publish({ scope, scopeType, mode: mode.mode, cursor: cursor ?? undefined });
  return {
    scope,
    scopeType,
    computedAt: deps.clock.now(),
    queued: true,
    mode: mode.mode,
    cursor: cursor ?? null,
    message: 'recalcul mis en file : le consumer le déroule par tranches (§18)',
  };
}