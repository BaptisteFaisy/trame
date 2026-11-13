/**
 * Les onze écrans de §17 : chacun se rend sans jeter, et chacun a son
 * composant.
 *
 * Le rendu HTML ne prouve rien de l'affichage réel (il faut Jira pour ça) : il
 * prouve que l'écran ne casse pas au premier rendu.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@forge/react', async () => {
  const React = await import('react');
  const names = [
    'Badge', 'Box', 'Button', 'Checkbox', 'DynamicTable', 'Form', 'FormFooter',
    'FormSection', 'Heading', 'Label', 'Link', 'List', 'ListItem', 'Lozenge',
    'ProgressBar', 'RadioGroup', 'SectionMessage', 'Select', 'Spinner', 'Stack',
    'Tab', 'TabList', 'TabPanel', 'Tabs', 'Text', 'TextArea', 'Textfield',
  ];
  const mod: Record<string, unknown> = { default: { render: () => undefined } };
  for (const name of names) {
    mod[name] = (props: Record<string, unknown>) => {
      const { children, emptyView, ...rest } = props;
      const trace = JSON.stringify(rest, (_key, value) =>
        typeof value === 'function' ? undefined : value,
      );
      const kids: React.ReactNode[] = [
        (children ?? null) as React.ReactNode,
        (emptyView ?? null) as React.ReactNode,
        trace,
      ];
      return React.createElement(name, null, ...kids);
    };
  }
  return mod;
});

vi.mock('@forge/bridge', () => ({
  invoke: async () => ({ message: 'no-criterion-written', scope: 'PROJ', scopeType: 'project' }),
  view: { getContext: async () => ({}) },
}));

import { BulletinScreen } from '../../src/ui/screens/bulletin.js';
import { CertificateScreen } from '../../src/ui/screens/certificate.js';
import { CriterionDetailScreen } from '../../src/ui/screens/criterion-detail.js';
import { DanglingScreen } from '../../src/ui/screens/dangling.js';
import { HolesScreen } from '../../src/ui/screens/holes.js';
import { PerforationsScreen } from '../../src/ui/screens/perforations.js';
import { TimelineScreen } from '../../src/ui/screens/timeline.js';
import { ValidationQueueScreen } from '../../src/ui/screens/validation-queue.js';
import { VisibilityScreen } from '../../src/ui/screens/visibility.js';
import { WeaveMapScreen } from '../../src/ui/screens/weave-map.js';
import { ZoneRisksScreen } from '../../src/ui/screens/zone-risks.js';
import { SCREEN_KEYS } from '../../src/handlers/resolver.js';

const PROPS = { scope: 'PROJ', scopeType: 'project' as const, lang: 'fr' as const };

type ScreenComponent = (props: typeof PROPS) => React.ReactElement;

/** La fiche d'un critère a son propre contrat : un ticket et un critère. */
type CriterionComponent = (props: {
  ticketKey: string;
  criterionId: string;
  lang: 'fr';
}) => React.ReactElement;

const SCREENS: Record<string, ScreenComponent> = {
  'weave-map': WeaveMapScreen,
  holes: HolesScreen,
  perforations: PerforationsScreen,
  dangling: DanglingScreen,
  bulletin: BulletinScreen,
  certificate: CertificateScreen,
  'validation-queue': ValidationQueueScreen,
  'zone-risks': ZoneRisksScreen,
  visibility: VisibilityScreen,
  timeline: TimelineScreen,
};

describe('les onze écrans', () => {
  it('il y en a bien onze, et chacun a son composant', () => {
    expect(SCREEN_KEYS).toHaveLength(11);
    for (const key of SCREEN_KEYS) {
      if (key === 'criterion-detail') continue;
      expect(SCREENS[key]).toBeTypeOf('function');
    }
  });

  it('chacun se rend sans jeter', () => {
    for (const key of SCREEN_KEYS) {
      const element =
        key === 'criterion-detail'
          ? React.createElement(CriterionDetailScreen as CriterionComponent, {
              ticketKey: 'PROJ-44',
              criterionId: 'crit_1_AC-1',
              lang: 'fr',
            })
          : React.createElement(SCREENS[key], PROPS);
      expect(renderToStaticMarkup(element).length).toBeGreaterThan(0);
    }
  });

  it('un écran sans donnée ne montre jamais « 0 % »', () => {
    for (const key of SCREEN_KEYS) {
      if (key === 'criterion-detail') continue;
      const html = renderToStaticMarkup(React.createElement(SCREENS[key], PROPS));
      expect(html).not.toContain('0 %');
    }
  });
});
