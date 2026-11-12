/**
 * Screen registry (frozen): every Trame screen is one resolver key handled by
 * one file owned by one lot (docs/CONTRACTS.md §3). Adding a screen means
 * adding a line here **and** a module in the manifest — nothing else moves.
 *
 * Screens of §17: weave map, criterion sheet, hole explorer, perforation
 * registry, dangling queue, bulletin, certificate, validation queue, risk
 * zones, coverage screen, weave history.
 */
import type Resolver from '@forge/resolver';
import type { Deps, ScreenRender } from '../ports.js';
import { render as weaveMap } from './weave-map.js';
import { render as criterionDetail } from './criterion-detail.js';
import { render as holes } from './holes.js';
import { render as perforations } from './perforations.js';
import { render as dangling } from './dangling.js';
import { render as bulletin } from './bulletin.js';
import { render as certificate } from './certificate.js';
import { render as validationQueue } from './validation-queue.js';
import { render as zoneRisks } from './zone-risks.js';
import { render as visibility } from './visibility.js';
import { render as timeline } from './timeline.js';

/** Resolver keys, in the order of §17. */
export const SCREEN_KEYS = [
  'weave-map',
  'criterion-detail',
  'holes',
  'perforations',
  'dangling',
  'bulletin',
  'certificate',
  'validation-queue',
  'zone-risks',
  'visibility',
  'timeline',
] as const;

export type ScreenKey = (typeof SCREEN_KEYS)[number];

const SCREENS: Record<ScreenKey, ScreenRender> = {
  'weave-map': weaveMap,
  'criterion-detail': criterionDetail,
  holes,
  perforations,
  dangling,
  bulletin,
  certificate,
  'validation-queue': validationQueue,
  'zone-risks': zoneRisks,
  visibility,
  timeline,
};

/** Registers all screens on the Forge resolver. */
export function registerScreens(resolver: Resolver, deps: Deps): void {
  for (const key of SCREEN_KEYS) {
    const render = SCREENS[key];
    resolver.define(key, (payload: Record<string, unknown>) => render(deps, payload ?? {}));
  }
}
