/**
 * Tests réels de l'empreinte stable (§6, §8.2, §18).
 * L'empreinte déclenche la perforation et le cache LLM : elle doit être
 * insensible à la forme (casse, espaces, marqueurs de liste, NFKC) et
 * sensible au sens (un chiffre, un mot, une négation).
 */
import { describe, expect, it } from 'vitest';
import { fingerprint, normalize, sameFingerprint } from '../../src/collect/fingerprint.js';

describe('fingerprint — stabilité', () => {
  it('même texte = même empreinte (déterministe)', () => {
    const text = 'Le système doit répondre en moins de 2 s au 95e centile';
    expect(fingerprint(text)).toBe(fingerprint(text));
  });

  it('produit 16 caractères hexadécimaux', () => {
    expect(fingerprint('un critère quelconque')).toMatch(/^[0-9a-f]{16}$/);
  });

  it('sameFingerprint compare deux empreintes identiques et différentes', () => {
    const a = fingerprint('critère alpha');
    expect(sameFingerprint(a, fingerprint('critère alpha'))).toBe(true);
    expect(sameFingerprint(a, fingerprint('critère bêta'))).toBe(false);
    expect(sameFingerprint(a, a.slice(0, 8))).toBe(false);
  });
});

describe('fingerprint — insensible à la forme', () => {
  it('la casse ne change pas l’empreinte', () => {
    expect(fingerprint('Le Système DOIT refuser un mot de passe vide')).toBe(
      fingerprint('le système doit refuser un mot de passe vide'),
    );
  });

  it('les espaces et sauts de ligne ne changent pas l’empreinte', () => {
    expect(fingerprint('export   CSV\n\ndisponible   immédiatement')).toBe(
      fingerprint('export CSV disponible immédiatement'),
    );
  });

  it('la ponctuation de liste et la numérotation ne changent pas l’empreinte', () => {
    const base = fingerprint('- premier critère\n- second critère');
    expect(fingerprint('* premier critère\n* second critère')).toBe(base);
    expect(fingerprint('• premier critère\n• second critère')).toBe(base);
    expect(fingerprint('1. premier critère\n2. second critère')).toBe(base);
    expect(fingerprint('1) premier critère\n2) second critère')).toBe(base);
  });

  it('Unicode NFKC : ligatures et pleine chasse normalisées', () => {
    expect(fingerprint('la ﬁabilité est mesurée')).toBe(fingerprint('la fiabilité est mesurée'));
    expect(fingerprint('ＴＥＳＴ automatisé')).toBe(fingerprint('test automatisé'));
    expect(normalize('ﬁable')).toBe('fiable');
  });
});

describe('fingerprint — sensible au sens', () => {
  it('un chiffre modifié change l’empreinte', () => {
    expect(fingerprint('temps de réponse sous 2 s')).not.toBe(fingerprint('temps de réponse sous 3 s'));
  });

  it('une négation ajoutée change l’empreinte', () => {
    expect(fingerprint('le système doit journaliser l’accès')).not.toBe(
      fingerprint('le système ne doit pas journaliser l’accès'),
    );
  });

  it('un mot ajouté change l’empreinte', () => {
    expect(fingerprint('export CSV disponible')).not.toBe(fingerprint('export CSV chiffré disponible'));
  });
});
