/**
 * La démo affiche les chiffres du moteur, pas des valeurs recopiées.
 *
 * Le projet de démonstration semé (§26) compte six tickets et vingt-quatre
 * critères. Passé dans le moteur réelle (src/domain), il produit trois
 * perforations, deux fils détendus et quatre trous — dont deux qui n'ont jamais
 * été vérifiés, et deux qui ont perdu leur vérification (leur seul test a été
 * désactivé). Ces chiffres sont calculés ici, jamais écrits en dur : le test
 * échoue si le moteur ou les données changent.
 */
import { describe, expect, it } from 'vitest';
import { buildDemoState, buildScopeView } from '../../site/src/demo/engine.js';

describe('la démo affiche les chiffres du moteur (§26)', () => {
  it('le projet semé compte vingt-quatre critères', () => {
    const state = buildDemoState();
    expect(state.project.criteria).toHaveLength(24);
    expect(state.project.issues).toHaveLength(6);
  });

  it('le moteur trouve trois perforations, deux fils détendus, quatre trous', () => {
    const state = buildDemoState();
    expect(state.perforations).toHaveLength(3);
    expect(state.dangling).toHaveLength(2);
    expect(state.holes).toHaveLength(4);
    // La couverture et l'explorateur des trous racontent la même chose.
    expect(state.coverage.holes).toBe(state.holes.length);
    expect(state.coverage.perforations).toBe(state.perforations.length);
    expect(state.coverage.dangling).toBe(state.dangling.length);
  });

  it('chaque trou porte son métré : un score et trois termes explicables', () => {
    const state = buildDemoState();
    for (const hole of state.holes) {
      expect(hole.priorityScore).toBeGreaterThanOrEqual(0);
      expect(hole.priorityScore).toBeLessThanOrEqual(1);
      expect(hole.priorityTerms).toHaveLength(3);
      expect(hole.ticketKey).toBeTruthy();
      expect(hole.criterionKey).toBeTruthy();
    }
  });

  it('chaque perforation porte ses deux dates, chaque fil son impact', () => {
    const state = buildDemoState();
    for (const perforation of state.perforations) {
      expect(perforation.changedAt).toBeTruthy();
      expect(perforation.verifiedAt).toBeTruthy();
      expect(perforation.ageDays).toBeGreaterThanOrEqual(0);
    }
    for (const thread of state.dangling) {
      expect(thread.impact).toBeGreaterThanOrEqual(1);
      expect(thread.reason).toBeTruthy();
    }
  });

  it('les quatre trous se lisent : deux jamais vérifiés, deux ayant perdu leur test', () => {
    const state = buildDemoState();
    const view = buildScopeView(state);
    const never = state.holes.filter((hole) => view.holeCauses[hole.id] === 'never').length;
    const lost = state.holes.filter((hole) => view.holeCauses[hole.id] === 'lost').length;
    expect(never).toBe(2);
    expect(lost).toBe(2);
  });

  it('le certificat déclare ce qui n’est pas couvert', () => {
    const state = buildDemoState();
    const view = buildScopeView(state);
    expect(view.certificate.notCovered).toHaveLength(state.holes.length);
    expect(view.certificate.unfalsifiable).toHaveLength(state.coverage.unfalsifiableCount);
    // Chaque ligne « vérifiée » tient une maille : la couverture déclarée et
    // provisoire du moteur, rien d'autre.
    expect(view.certificate.lines.length).toBe(
      state.coverage.coveredDeclared + state.coverage.coveredProvisional,
    );
  });
});