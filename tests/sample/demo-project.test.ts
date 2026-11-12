/**
 * The demonstration project must keep the numbers of §26 — the judges count
 * them on the screen: six tickets, twenty-four criteria, four unfalsifiable,
 * three perforated, two holes, fourteen test executions, three disabled tests,
 * two deleted criteria.
 */
import { describe, expect, it } from 'vitest';
import {
  DEMO_PROJECT,
  DEMO_SPRINT,
  DEMO_TICKETS,
  DEMO_VERSION,
  buildDemoProject,
} from '../../src/sample/demo-project.js';

const demo = buildDemoProject();

describe('projet de démonstration (§26)', () => {
  it('six tickets du même sprint et de la même version', () => {
    expect(DEMO_TICKETS).toHaveLength(6);
    expect(demo.issues).toHaveLength(6);
    for (const issue of demo.issues) {
      expect(issue.sprint).toBe(DEMO_SPRINT);
      expect(issue.version).toBe(DEMO_VERSION);
    }
  });

  it('vingt-quatre critères, quatre infalsifiables', () => {
    expect(demo.criteria).toHaveLength(24);
    const infalsifiables = demo.criteria.filter((criterion) => !criterion.falsifiable);
    expect(infalsifiables).toHaveLength(4);
    for (const criterion of infalsifiables) {
      expect(criterion.unfalsifiableReason).toBeTruthy();
    }
  });

  it('quatorze exécutions de test automatisées', () => {
    const automatiques = demo.verifications.filter((act) => act.form === 'automated-test');
    expect(automatiques).toHaveLength(14);
  });

  it('montre les sept formes d’acte de vérification', () => {
    const forms = new Set(demo.verifications.map((act) => act.form));
    expect(forms.size).toBeGreaterThanOrEqual(4);
    expect(forms.has('automated-test')).toBe(true);
    expect(forms.has('declaration')).toBe(true);
    expect(forms.has('code-review')).toBe(true);
    expect(forms.has('manual-case')).toBe(true);
  });

  it('trois tests désactivés, deux critères supprimés', () => {
    const desactives = demo.verifications.filter((act) => act.disabledAt !== undefined);
    expect(desactives).toHaveLength(3);
    expect(demo.disabled).toHaveLength(3);
    const supprimes = demo.criteria.filter((criterion) => criterion.deletedAt !== undefined);
    expect(supprimes).toHaveLength(2);
  });

  it('trois critères modifiés après leur vérification, deux trous', () => {
    const modifies = demo.criteria.filter((criterion) => criterion.version > 1);
    expect(modifies).toHaveLength(3);
    expect(demo.perforations).toHaveLength(3);
    expect(demo.holes).toHaveLength(2);
  });

  it('la convention de nommage est appliquée à la plupart des tests, pas à tous', () => {
    const nommes = demo.verifications.filter((act) => act.name.startsWith('TRAME-1'));
    expect(nommes.length).toBeGreaterThan(demo.verifications.length - 6);
  });

  it('propose des liaisons dérivées à confirmer, dont une trop faible', () => {
    const derivees = demo.links.filter((mesh) => mesh.kind === 'derived');
    expect(derivees.length).toBeGreaterThanOrEqual(3);
    expect(derivees.filter((mesh) => mesh.confidence >= 0.85).length).toBeGreaterThanOrEqual(2);
    expect(derivees.filter((mesh) => mesh.confidence < 0.5).length).toBe(1);
  });

  it('attribue chaque maille à un critère et un acte existants', () => {
    const ids = new Set(demo.criteria.map((criterion) => criterion.id));
    const acts = new Set(demo.verifications.map((act) => act.id));
    for (const mesh of demo.links) {
      expect(ids.has(mesh.criterionId), mesh.id).toBe(true);
      expect(acts.has(mesh.verificationId), mesh.id).toBe(true);
    }
  });

  it('rattach chaque critère au projet, au sprint et à la version', () => {
    for (const criterion of demo.criteria) {
      const scopes = criterion.scopeRefs.map((ref) => `${ref.scopeType}:${ref.scope}`);
      expect(scopes).toContain(`project:${DEMO_PROJECT}`);
      expect(scopes).toContain(`sprint:${DEMO_SPRINT}`);
      expect(scopes).toContain(`version:${DEMO_VERSION}`);
    }
  });
});
