/**
 * UI entry point (Forge `resources: main`) — placeholder of the socle.
 *
 * Lot L9 replaces this file with the real UI Kit 2 screens (weave map, criterion
 * sheet, hole explorer, registers, bulletin, certificate, validation queue,
 * risk zones, coverage screen, history). Until then it renders the registry of
 * screens so the resource exists, compiles, and says honestly what is missing.
 *
 * Rules: files < 500 lines, functions < 50 lines.
 */
import { SCREEN_KEYS } from '../../handlers/resolver.js';

export interface ScreenEntry {
  key: string;
  status: 'stub' | 'implemented';
}

/** What the app can show today: every screen is still a stub. */
export function screenRegistry(): ScreenEntry[] {
  return SCREEN_KEYS.map((key) => ({ key, status: 'stub' as const }));
}

export default function TrameApp(): { screens: ScreenEntry[]; notice: string } {
  return {
    screens: screenRegistry(),
    notice: 'Écrans en souches : le lot L9 branche UI Kit 2 sur ces clés de resolver.',
  };
}
