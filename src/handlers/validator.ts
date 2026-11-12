import type { Deps } from '../ports.js';

/** Ce que Forge passe à un validateur de transition. */
export interface ValidatorInput {
  issueKey: string;
  configuration: Record<string, unknown>;
  transition: { fromStatus: string; toStatus: string };
}

/** Verdict : il alerte, il n'interdit jamais (§5, TR-30). */
export interface WeaveVerdict {
  valid: boolean;
  message: string;
  holes: number;
  perforations: number;
  blocking: boolean;
}

/**
 * `jira:workflowValidator` — porte de non-régression optionnelle (TR-30).
 *
 * Souche : le lot L10 y lira la trame du ticket et signalera les trous et les
 * perforations au moment de la clôture. `blocking` reste `false` tant que
 * l'équipe n'a pas signé explicitement l'option : la mesure ne modifie pas le
 * travail (§14).
 */
export function createValidator(deps: Deps): (input: ValidatorInput) => Promise<WeaveVerdict> {
  return async (input: ValidatorInput): Promise<WeaveVerdict> => {
    deps.log.log('info', 'validateur de trame (souche)', { issueKey: input.issueKey });
    return {
      valid: true,
      message: 'trame-not-computed-yet',
      holes: 0,
      perforations: 0,
      blocking: false,
    };
  };
}
