/**
 * UI entry point (Forge `resources: main`).
 *
 * État au 13/11/2026 (main @ 7c468f7) : les onze écrans du §17 sont réels —
 * chacun a un view-model (`src/viewmodel/*.ts`) et un handler de resolver
 * (`src/handlers/*.ts`, enregistrés dans `src/handlers/resolver.ts`). Ce module
 * est la **ressource UI** de Forge : il rend le registre des écrans, pas les
 * écrans. `@forge/react` v10 n'expose pas `render`, donc le rendu UI Kit 2
 * n'est pas branché ; la démo visuelle est le site public
 * (https://tradoooo.github.io/trame/), qui exécute le même moteur.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import { SCREEN_KEYS } from '../../handlers/resolver';

export interface ScreenEntry {
  key: string;
  /** Le view-model et le handler de resolver répondent des données réelles (lots L9 / L9b). */
  implemented: boolean;
  /** Rendu par cette ressource Forge — faux : `@forge/react` v10 n'expose pas `render`. */
  rendered: boolean;
}

/** Ce que l'app sait montrer aujourd'hui : chaque écran répond ; aucun n'est rendu ici. */
export function screenRegistry(): ScreenEntry[] {
  return SCREEN_KEYS.map((key) => ({ key, implemented: true, rendered: false }));
}

/** Ressource `main` : le registre des écrans, avec l'état réel et la note de limite. */
export default function TrameApp(): { screens: ScreenEntry[]; notice: string } {
  return {
    screens: screenRegistry(),
    notice:
      'Les onze écrans répondent des données réelles par le resolver ; le rendu UI Kit 2 ' +
      'n’est pas branché (@forge/react v10 n’expose pas render). ' +
      'Démo visuelle : https://tradoooo.github.io/trame/',
  };
}
