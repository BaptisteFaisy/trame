/**
 * The four paths of the weaving (§9) and the confidence they carry (§9.2,
 * §9.4). The tests are named after the acceptance recipes of §24.
 */
import { describe, expect, it } from 'vitest';
import {
  belongsToAnotherTicket,
  classifyDerived,
  followsNamingConvention,
  linkByDeclaration,
  linkByMention,
  linkByNamingConvention,
  linkBySimilarity,
  mentionsCriterion,
  weave,
} from '../../src/domain/links.js';
import {
  MAX_WEIGHT,
  MIN_WEIGHT,
  confidenceBand,
  learnFrom,
  scoreConfidence,
  sharedTerms,
  similarity,
  tokenize,
} from '../../src/domain/confidence.js';
import { makeCriterion, makeVerification } from '../helpers/index.js';

const AT = '2026-11-12T09:00:00.000Z';

describe('chemin 1 — la mention explicite', () => {
  it('§24.17 un lien déterministe par mention', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-3', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-1.testShouldHandleAC-3' });
    expect(mentionsCriterion(criterion, verification)).toBe(true);
    const link = linkByMention(criterion, verification, AT);
    expect(link?.kind).toBe('declared');
    expect(link?.path).toBe('mention');
    expect(link?.confidence).toBe(1);
  });

  it('ne confond pas AC-3 et AC-30', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-3', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-1.testShouldHandleAC-30' });
    expect(mentionsCriterion(criterion, verification)).toBe(false);
  });
});

describe('chemin 2 — la convention de nommage', () => {
  it('§24.17 un lien déterministe par convention', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-1.testShouldWeave' });
    expect(followsNamingConvention(criterion, verification)).toBe(true);
    const link = linkByNamingConvention(criterion, verification, AT);
    expect(link?.kind).toBe('declared');
    expect(link?.path).toBe('naming-convention');
  });

  it('§23 repère une convention trompeuse (test d’un autre ticket)', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-9.testShouldWeave' });
    expect(belongsToAnotherTicket(criterion, verification)).toBe(true);
    expect(followsNamingConvention(criterion, verification)).toBe(false);
    expect(linkByNamingConvention(criterion, verification, AT)).toBeNull();
  });
});

describe('chemin 3 — la similarité proposée', () => {
  it('§24.7 une liaison dérivée au-dessus du seuil est provisoire, jamais déclarée', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-2', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-1.testShouldRejectWeakToken' });
    const link = linkBySimilarity(criterion, verification, 0.91, AT);
    expect(link?.kind).toBe('derived');
    expect(link?.confidence).toBe(0.91);
    expect(classifyDerived(0.91)).toBe('provisional');
    expect(classifyDerived(0.62)).toBe('proposal');
    expect(classifyDerived(0.2)).toBe('discarded');
    expect(linkBySimilarity(criterion, verification, 0.2, AT)).toBeNull();
  });

  it('bande de confiance : mêmes seuils que les défauts', () => {
    expect(confidenceBand(0.85, 0.85, 0.5)).toBe('provisional');
    expect(confidenceBand(0.84, 0.85, 0.5)).toBe('proposal');
    expect(confidenceBand(0.49, 0.85, 0.5)).toBe('discarded');
  });
});

describe('chemin 4 — la déclaration humaine', () => {
  it('produit une liaison déclarée', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'recette manuelle' });
    const link = linkByDeclaration(criterion, verification, AT);
    expect(link?.kind).toBe('declared');
    expect(link?.path).toBe('declaration');
  });
});

describe('le tissage complet', () => {
  it('ne met jamais deux mailles sur la même paire', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-1.testShouldWeave' });
    const links = weave({
      criteria: [criterion],
      verifications: [verification],
      proposals: [
        { criterionId: criterion.id, verificationId: verification.id, confidence: 0.95, rationale: 'proposé' },
      ],
      establishedAt: AT,
    });
    expect(links).toHaveLength(1);
    expect(links[0]?.kind).toBe('declared');
  });

  it('garde une proposition quand aucun chemin déterministe ne s’applique', () => {
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'testSansTicket' });
    const links = weave({
      criteria: [criterion],
      verifications: [verification],
      proposals: [
        { criterionId: criterion.id, verificationId: verification.id, confidence: 0.91, rationale: 'proposé' },
      ],
      establishedAt: AT,
    });
    expect(links).toHaveLength(1);
    expect(links[0]?.kind).toBe('derived');
  });

  it('ne tisse ni un acte désactivé ni un critère infalsifiable', () => {
    const infalsifiable = makeCriterion({ criterionKey: 'AC-3', falsifiable: false });
    const criterion = makeCriterion({ criterionKey: 'AC-1', ticketKey: 'TRAME-1' });
    const verification = makeVerification({ name: 'TRAME-1.testShouldWeave', disabledAt: AT });
    expect(linkByNamingConvention(criterion, verification, AT)).toBeNull();
    expect(linkByMention(infalsifiable, makeVerification({ name: 'x' }), AT)).toBeNull();
  });
});

describe('la confiance apprise (§9.4)', () => {
  it('§24.8 une liaison confirmée renforce les jetons partagés', () => {
    const terms = sharedTerms(tokenize('le jeton expiré est refusé'), tokenize('testShouldRejectExpiredToken'));
    expect(terms.length).toBeGreaterThan(0);
    const learned = learnFrom(terms, true);
    for (const term of terms) {
      expect(learned[term.token]).toBeGreaterThan(1);
    }
  });

  it('§24.9 une liaison refusée affaiblit la suggestion suivante', () => {
    const terms = sharedTerms(tokenize('la couverture ne baisse pas'), tokenize('testShouldKeepCoverageStable'));
    const learned = learnFrom(terms, false);
    for (const term of terms) {
      expect(learned[term.token]).toBeLessThan(1);
    }
  });

  it('les poids restent dans leurs bornes', () => {
    const terms = sharedTerms(['jeton'], ['jeton']);
    let weights = learnFrom(terms, true);
    for (let round = 0; round < 50; round += 1) weights = learnFrom(terms, true, weights);
    expect(weights['jeton']).toBeLessThanOrEqual(MAX_WEIGHT);
    for (let round = 0; round < 50; round += 1) weights = learnFrom(terms, false, weights);
    expect(weights['jeton']).toBeGreaterThanOrEqual(MIN_WEIGHT);
  });

  it('le score vient toujours avec ses termes', () => {
    const scored = scoreConfidence('le jeton expiré est refusé', 'testShouldRejectExpiredToken');
    expect(scored.confidence).toBeGreaterThan(0);
    expect(scored.terms.length).toBeGreaterThan(0);
    const empty = scoreConfidence('abc', 'xyz');
    expect(empty.confidence).toBe(0);
    expect(empty.terms).toEqual([]);
  });

  it('la tokenisation ignore les mots vides, les accents et la ponctuation', () => {
    expect(tokenize('Le système, doit être rapide !')).toEqual(['system', 'doit', 'rapid']);
    expect(similarity(['a', 'b'], ['a', 'b'])).toBe(1);
    expect(similarity(['a'], ['b'])).toBe(0);
  });
});
