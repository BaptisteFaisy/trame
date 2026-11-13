/**
 * Le pont entre l'interface et le resolver : ce qu'il lit, ce qu'il déballe,
 * ce qu'il refuse de jeter.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import { describe, expect, it, vi } from 'vitest';

// `@forge/bridge` parle au pont du navigateur : hors navigateur, il est simulé.
vi.mock('@forge/bridge', () => ({
  invoke: async () => ({}),
  view: { getContext: async () => ({}) },
}));

import {
  errorMessage,
  isEmptyScreen,
  readContext,
  unpack,
} from '../../src/ui/bridge.js';

describe('la lecture du contexte ne jette jamais', () => {
  it('lit le ticket, le projet et la langue', () => {
    const context = readContext({
      extension: { issue: { key: 'PROJ-44' }, project: { key: 'PROJ' } },
      locale: 'fr',
      siteUrl: 'https://one-atlas-cndz.atlassian.net',
    });
    expect(context.issueKey).toBe('PROJ-44');
    expect(context.projectKey).toBe('PROJ');
    expect(context.locale).toBe('fr');
  });

  it('un contexte vide rend un contexte vide, pas une exception', () => {
    const context = readContext(undefined);
    expect(context.issueKey).toBe('');
    expect(context.projectKey).toBe('');
    expect(context.locale).toBe('en');
  });

  it('une langue inconnue ramène à l’anglais', () => {
    expect(readContext({ locale: 'de-DE' }).locale).toBe('en');
  });

  it('un contexte qui n’est pas un objet ne casse rien', () => {
    expect(readContext('pas un objet').issueKey).toBe('');
    expect(readContext([]).projectKey).toBe('');
  });
});

describe('la réponse du resolver', () => {
  it('déballe une enveloppée comme une nue', () => {
    expect(unpack({ data: { scope: 'PROJ' } })).toEqual({ scope: 'PROJ' });
    expect(unpack({ result: { scope: 'PROJ' } })).toEqual({ scope: 'PROJ' });
    expect(unpack({ scope: 'PROJ' })).toEqual({ scope: 'PROJ' });
  });

  it('reconnaît la réponse « aucun critère écrit »', () => {
    expect(isEmptyScreen({ message: 'no-criterion-written' })).toBe(true);
    expect(isEmptyScreen({ scope: 'PROJ' })).toBe(false);
    expect(isEmptyScreen(null)).toBe(false);
  });
});

describe('le message d’erreur', () => {
  it('reste lisible quoi qu’il arrive', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('boom')).toBe('boom');
    expect(errorMessage(42)).toBe('42');
  });
});
