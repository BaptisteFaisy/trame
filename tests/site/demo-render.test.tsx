/**
 * La page (rendue serveur, sans navigateur) contient les phrases clés et les
 * chiffres du moteur : les manques déclarés, les quatre chemins de liaison,
 * « pas de droit ≠ pas de test » — en anglais et en français.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../../site/src/App.js';
import { buildDemoState } from '../../site/src/demo/engine.js';
import { Architecture } from '../../site/src/sections/architecture.js';
import { Demo } from '../../site/src/sections/demo.js';
import { Limits } from '../../site/src/sections/limits.js';

describe('la page contient les phrases clés', () => {
  it('le certificat déclare les manques, en anglais', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('What is NOT covered');
    expect(html).toContain('not covered');
  });

  it('le certificat déclare les manques, en français', () => {
    const html = renderToStaticMarkup(<Demo lang="fr" state={buildDemoState()} />);
    expect(html).toContain('Ce qui n\u2019est pas couvert');
  });

  it('les quatre chemins de liaison sont nommés, en anglais', () => {
    const html = renderToStaticMarkup(<Architecture lang="en" />);
    expect(html).toContain('explicit mention');
    expect(html).toContain('naming convention');
    expect(html).toContain('similarity');
    expect(html).toContain('human declaration');
  });

  it('les quatre chemins de liaison sont nommés, en français', () => {
    const html = renderToStaticMarkup(<Architecture lang="fr" />);
    expect(html).toContain('mention explicite');
    expect(html).toContain('convention de nommage');
    expect(html).toContain('similarité');
    expect(html).toContain('déclaration humaine');
  });

  it('les quatre absences sont distinguées : pas de droit ≠ pas de test', () => {
    expect(renderToStaticMarkup(<Limits lang="fr" />)).toContain('droit \u2260 pas de test');
    expect(renderToStaticMarkup(<Limits lang="en" />)).toContain('No right \u2260 no test');
    expect(renderToStaticMarkup(<Limits lang="en" />)).toContain('no criterion written');
    expect(renderToStaticMarkup(<Limits lang="en" />)).toContain('no data');
  });

  it('la démo affiche le score du trou le plus prioritaire, calculé par le moteur', () => {
    const state = buildDemoState();
    const html = renderToStaticMarkup(<Demo lang="en" state={state} />);
    const topScore = state.holes[0].priorityScore.toFixed(4);
    expect(html).toContain(topScore);
    // Le métré affiché montre bien sa formule, pas un chiffre nu.
    expect(html).toContain('score = \u03a3(weight \u00d7 value) \u00f7 \u03a3(weight)');
  });
});