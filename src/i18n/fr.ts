/**
 * Dictionnaire français (§22 : l'interface est livrée en anglais et en français).
 *
 * Typé sur `EN` : une clé manquante ou en trop est une erreur de compilation,
 * la parité des dictionnaires n'est donc jamais à vérifier à la main.
 * Vocabulaire du §4 — les mots du produit sont le produit.
 */
import type { MessageKey } from './en.js';

export const FR: Record<MessageKey, string> = {
  'app.name': 'Trame',
  'app.tagline': 'La couverture de vos critères d’acceptation',

  'screen.weave-map': 'Carte de trame',
  'screen.criterion-detail': 'Fiche critère',
  'screen.holes': 'Explorateur de trous',
  'screen.perforations': 'Registre des perforations',
  'screen.dangling': 'File des fils détendus',
  'screen.bulletin': 'Bulletin de trame',
  'screen.certificate': 'Certificat de trame',
  'screen.validation-queue': 'File de validation',
  'screen.zone-risks': 'Zones à risque',
  'screen.visibility': 'Ce que voit Trame',
  'screen.timeline': 'Historique de trame',

  'axis.strength': 'Par force',
  'axis.link': 'Par type de liaison',
  'axis.freshness': 'Par fraîcheur',

  'strength.machine': 'machine (exécution automatisée verte)',
  'strength.attested': 'attestée (un tiers, avec artefact)',
  'strength.declared': 'déclarée (une affirmation, sans artefact)',

  'link.declared': 'déclarée',
  'link.confirmed': 'confirmée (retricotée)',
  'link.derived': 'dérivée, à confirmer',

  'freshness.current': 'à jour',
  'freshness.stale': 'périmée',

  'path.mention': 'mention explicite',
  'path.naming-convention': 'convention de nommage',
  'path.similarity': 'similarité (proposée)',
  'path.declaration': 'déclaration humaine',

  'kind.functional': 'fonctionnel',
  'kind.edge-case': 'cas limite',
  'kind.non-regression': 'non-régression',
  'kind.security': 'sécurité',
  'kind.performance': 'performance',
  'kind.experience': 'expérience',
  'kind.documentation': 'documentation',

  'origin.acceptance-field': 'champ « critères d’acceptation »',
  'origin.description': 'description du ticket',
  'origin.table': 'tableau de critères',
  'origin.confluence-page': 'page Confluence',
  'origin.test-ticket': 'ticket de test dédié',
  'origin.attachment': 'pièce jointe (référencée, non décodée)',

  'form.automated-test': 'test automatisé exécuté',
  'form.manual-case': 'cas de test manuel exécuté et enregistré',
  'form.third-party': 'attestation tierce',
  'form.code-review': 'revue de code couvrant le critère',
  'form.traced-manual': 'vérification manuelle tracée dans un ticket',
  'form.deployment': 'preuve de déploiement',
  'form.declaration': 'déclaration (« c’est fait »)',

  'perforation.fresh': 'perforation fraîche (changé il y a moins de 7 jours)',
  'perforation.dry': 'perforation sèche (plus de 30 jours, jamais re-vérifié)',
  'perforation.multiple': 'perforation multiple (changé 3 fois, jamais re-vérifié)',

  'dangling.test-disabled': 'test désactivé ou ignoré',
  'dangling.test-renamed': 'test renommé, plus aucun lien ne le désigne',
  'dangling.criterion-deleted': 'critère supprimé ou renuméroté',
  'dangling.build-not-running': 'le build ne tourne plus',

  'absence.no-right': 'pas de droit : Trame n’a pas pu regarder',
  'absence.no-data': 'pas de données : Trame a regardé, il n’y a rien',
  'absence.no-test': 'pas de test : le critère n’a aucun acte de vérification',
  'absence.no-criterion': 'aucun critère écrit',

  'msg.not-enough-history': 'pas assez de recul (effectif sous 5)',
  'msg.no-criterion-written': 'aucun critère d’acceptation écrit — pas 0 %',
  'msg.covered-on-paper': 'couvert sur le papier : déclaration seule, non prouvé',
  'msg.provisional': 'couverture provisoire, jamais comptée comme déclarée',
  'msg.hole-priority': 'priorité calculée par le métré (termes affichés)',
  'msg.coverage-lowered': 'couverture abaissée : un acte de vérification est mort',
  'msg.dated-scope': 'chiffre daté et scopé',
  'msg.not-applied': 'proposition : rien n’est appliqué sans décision humaine',
};
