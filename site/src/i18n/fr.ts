/**
 * Textes du site — français.
 *
 * Typé sur `EN` : une clé manquante ou en trop est une erreur de compilation,
 * la parité des dictionnaires n'est donc jamais à vérifier à la main.
 *
 * Règles : fichiers < 500 lignes, fonctions < 50 lignes.
 */
import type { SiteKey } from './en.js';

export const FR: Record<SiteKey, string> = {
  /* ------------------------------------------------------------- navigation */
  'nav.skip': 'Aller au contenu',
  'nav.problem': 'Angle mort',
  'nav.weave': 'La métaphore',
  'nav.demo': 'Démo',
  'nav.screens': 'Écrans',
  'nav.limits': 'Ce qu’elle ne fait pas',
  'nav.architecture': 'Architecture',
  'nav.recipe': 'Recette',
  'nav.language': 'English',
  'nav.repo': 'Dépôt',

  /* ------------------------------------------------------------------ héros */
  'hero.eyebrow': 'App Atlassian Forge pour Jira · Codegeist 2026',
  'hero.title': 'Trame',
  'hero.tagline': 'La couverture de vos critères d’acceptation',
  'hero.slogan': 'le fil qui manque',
  'hero.promise':
    'Un critère d’acceptation est un fil de chaîne ; un test qui le vérifie est un passage de trame. Trame tisse les deux et montre ce que personne ne voit : un critère écrit, jamais vérifié.',
  'hero.cta.demo': 'Voir la démo',
  'hero.cta.recipe': 'Lire la recette',
  'hero.live.label': 'Sur le projet de démonstration semé — calculé par le vrai moteur, dans cette page :',
  'hero.live.criteria': 'critères écrits',
  'hero.live.holes': 'trous',
  'hero.live.perforations': 'perforations',
  'hero.live.dangling': 'fils détendus',

  /* -------------------------------------------------------------- l'angle mort */
  'problem.title': 'L’angle mort',
  'problem.lead':
    'Les critères d’acceptation sont le contrat entre celui qui développe et celui qui vérifie. En pratique, ce contrat n’est pas tenu — et la partie qui rompt reste invisible jusqu’à l’incident.',
  'problem.case1.title': 'Un critère écrit et jamais vérifié',
  'problem.case1.body':
    'Il est sur le ticket. Aucun test ne le mentionne, aucune convention de nommage n’y mène, personne ne l’a déclaré. Tout paraît vert : le tableau, le sprint, la note de version. Rien ne dit qu’il n’a jamais été vérifié.',
  'problem.case2.title': 'Un critère modifié après son test',
  'problem.case2.body':
    'Le responsable produit réécrit le critère mardi. Le test qui le couvrait date de mars. Le lien n’a pas bougé, donc la trame semble toujours pleine — et le contrat est rompu.',
  'problem.case3.title': 'Un test désactivé, un confort vide',
  'problem.case3.body':
    'Le test est désactivé, ignoré, renommé, ou rattaché à un critère supprimé. Il apparaît toujours dans le rapport, donc la couverture semble toujours bonne. Le confort est vide.',
  'problem.outcome':
    'Un défaut sort en production. Trois semaines plus tard, la revue découvre que le critère existait — et que rien ne l’avait jamais vérifié.',

  /* ------------------------------------------------------------- la métaphore */
  'weave.title': 'La métaphore',
  'weave.lead':
    'Le tissage est le plus vieux moyen de tenir deux choses ensemble : un fil de chaîne, vertical, ne bouge pas ; un passage de trame, horizontal, le croise. Leur intersection est une maille. Une maille transparente est un trou.',
  'weave.warp.title': 'Le fil de chaîne',
  'weave.warp.body':
    'Un critère d’acceptation : un identifiant stable (AC-3), son texte, son empreinte.',
  'weave.weft.title': 'Le passage de trame',
  'weave.weft.body':
    'Un acte de vérification : un test exécuté, une attestation, un cas manuel enregistré, une déclaration.',
  'weave.mesh.title': 'La maille',
  'weave.mesh.body':
    'La case critère × vérification. Pleine, c’est de la couverture ; vide, c’est un trou.',
  'weave.hole.title': 'Le trou',
  'weave.hole.body':
    'Un critère sans aucun acte de vérification vivant. Sa taille suit la priorité du métré.',
  'weave.perforation.title': 'La perforation',
  'weave.perforation.body':
    'Le critère a changé après avoir été tissé : la maille existe encore, et elle ne tient plus.',
  'weave.loose.title': 'Le fil détendu',
  'weave.loose.body':
    'Un acte de vérification qui ne croise plus rien. Il est retiré de la couverture — le chiffre peut descendre.',
  'weave.caption':
    'Dessiné dans la page : des fils de chaîne, un passage de trame, un trou là où la maille manque, un fil percé, un fil détendu.',

  /* ------------------------------------------------------------------ démo */
  'demo.title': 'La démo vivante',
  'demo.lead':
    'Tout ce qui suit est calculé dans votre navigateur par le moteur de l’app — les mêmes modules src/domain/*. Aucun chiffre n’est écrit à la main : changez le projet semé, la page change avec lui.',
  'demo.scope.label': 'Périmètre',
  'demo.source.note':
    'Le projet semé est écrit en français et le moteur travaille sur ce texte ; les gloses anglaises ne servent qu’à l’affichage.',
  'demo.counters.title': 'Les compteurs',
  'demo.counters.criteria': 'Critères écrits',
  'demo.counters.falsifiable': 'Critères vérifiables (le dénominateur)',
  'demo.counters.unfalsifiable': 'Critères infalsifiables (comptés à part)',
  'demo.counters.covered': 'Couverts, déclarés',
  'demo.counters.provisional': 'Couverts, provisoires (dérivés, à confirmer)',
  'demo.counters.holes': 'Trous',
  'demo.counters.proven': 'Prouvés (forts, à jour, déclarés)',
  'demo.counters.perforations': 'Perforations',
  'demo.counters.dangling': 'Fils détendus',
  'demo.axes.title': 'Les trois axes, jamais fusionnés',
  'demo.axes.strength': 'Par force',
  'demo.axes.link': 'Par type de liaison',
  'demo.axes.freshness': 'Par fraîcheur',
  'demo.holes.title': 'Les trous, classés par le métré',
  'demo.holes.empty': 'Aucun trou dans ce périmètre.',
  'demo.holes.never': 'jamais vérifié',
  'demo.holes.lost': 'a perdu sa vérification',
  'demo.holes.score': 'Priorité',
  'demo.holes.calculation': 'Comment le score a été calculé',
  'demo.holes.formula': 'score = Σ(poids × valeur) ÷ Σ(poids)',
  'demo.term.kind': 'type de critère',
  'demo.term.zone': 'risque observé de la zone',
  'demo.term.recurrence': 'récurrence (a déjà échappé)',
  'demo.column.criterion': 'Critère',
  'demo.column.cause': 'Pourquoi',
  'demo.column.act': 'Acte de vérification',
  'demo.column.form': 'Forme',
  'demo.column.strength': 'Force',
  'demo.column.date': 'Date',
  'demo.column.path': 'Chemin de liaison',
  'demo.holes.zone': 'Zone',
  'demo.holes.kind': 'Type',
  'demo.perforations.title': 'Le registre des perforations',
  'demo.perforations.empty': 'Aucune perforation dans ce périmètre.',
  'demo.perforations.changed': 'Critère modifié',
  'demo.perforations.verified': 'Dernière vérification',
  'demo.perforations.gap': 'Écart',
  'demo.perforations.class': 'Classe',
  'demo.dangling.title': 'La file des fils détendus',
  'demo.dangling.empty': 'Aucun fil détendu dans ce périmètre.',
  'demo.dangling.reason': 'Raison',
  'demo.dangling.impact': 'Impact sur la couverture',
  'demo.bulletin.title': 'Le bulletin de trame',
  'demo.bulletin.scope': 'Périmètre',
  'demo.bulletin.date': 'Calculé le',
  'demo.bulletin.unfalsifiable': 'Part infalsifiable',
  'demo.bulletin.added': 'Critères ajoutés pendant le sprint',
  'demo.bulletin.top': 'Trous prioritaires',
  'demo.bulletin.witness': 'Pas encore de témoin précédent pour ce périmètre.',
  'demo.certificate.title': 'Le certificat de trame',
  'demo.certificate.lead': 'Ce qui a été vérifié — et, explicitement, ce qui ne l’a pas été.',
  'demo.certificate.covered': 'Vérifié',
  'demo.certificate.lines': 'Les actes de vérification qui tiennent une maille',
  'demo.certificate.notCovered': 'Ce qui n’est pas couvert',
  'demo.certificate.unfalsifiable': 'Critères infalsifiables',
  'demo.certificate.open': 'Perforations et fils détendus ouverts',
  'demo.ticket.label': 'Ticket',
  'demo.ticket.all': 'Tout le projet',
  'demo.criterion.label': 'Critère',
  'demo.criterion.pick': 'Choisissez un critère dans la liste pour voir sa fiche.',
  'demo.criterion.links': 'Liens',
  'demo.criterion.verifications': 'Actes de vérification',
  'demo.criterion.state': 'État',
  'demo.criterion.noLink': 'Aucun lien : rien n’a jamais été tissé sur ce critère.',
  'demo.criterion.deadLink':
    'Un lien existe, mais l’acte qui le tenait est mort — la maille ne tient plus.',
  'demo.criterion.stale': 'Le critère a changé après la vérification qui le couvrait.',
  'demo.criterion.fresh': 'Le critère n’a pas changé depuis sa vérification.',
  'demo.criterion.falsifiable': 'Vérifiable',
  'demo.criterion.unfalsifiable': 'Infalsifiable',
  'demo.criterion.holds': 'la maille tient',
  'demo.criterion.dead': 'la maille est morte',
  'demo.criterion.notCovered': 'non couvert',

  /* ---------------------------------------------------------------- écrans */
  'screens.title': 'Les onze écrans',
  'screens.lead':
    'Un écran par jugement. Chaque illustration est dessinée à la main dans la page — aucune capture, aucune image externe.',
  'screens.what': 'Ce qu’il montre',
  'screens.shows.weave-map':
    'La toile tissée : les critères en fils verticaux, les actes de vérification en passages horizontaux, les trous par lesquels on voit le fond, la taille d’un trou suivant sa priorité.',
  'screens.shows.criterion-detail':
    'Un critère en entier : son texte, son empreinte, ses versions, les actes qui le couvrent, et si la maille tient encore.',
  'screens.shows.holes':
    'Les critères non couverts, triés par le métré, chacun avec le calcul de sa priorité.',
  'screens.shows.perforations':
    'Les critères modifiés après leur vérification, avec les deux dates et l’écart.',
  'screens.shows.dangling':
    'Les actes de vérification qui ne couvrent plus rien, avec la raison et le nombre de mailles qu’ils retirent.',
  'screens.shows.bulletin':
    'La feuille de revue de sprint : la couverture par force et par fraîcheur, les perforations, les fils détendus, la part infalsifiable, les trous prioritaires. Daté, comparable au témoin précédent.',
  'screens.shows.certificate':
    'La page Confluence générée : ce qui a été vérifié, par qui, avec quelle force — et, explicitement, ce qui n’est pas couvert.',
  'screens.shows.validation-queue':
    'Les propositions qui attendent un humain : les liaisons dérivées à confirmer, les brouillons de test, les reformulations. Rien n’est appliqué automatiquement.',
  'screens.shows.zone-risks':
    'Le risque observé des zones du dépôt — la deuxième entrée du métré.',
  'screens.shows.visibility':
    'Ce que Trame a pu voir et ce qu’il n’a pas pu : pas de droit, pas de données, pas de test, pas de critère — quatre absences, jamais confondues.',
  'screens.shows.timeline': 'Les témoins des sprints successifs, posés côte à côte.',

  /* ------------------------------------------------------------- discipline */
  'limits.title': 'Ce que l’app ne fait pas',
  'limits.lead':
    'La mesure ne modifie pas le travail. Trame montre, propose, et ne décide jamais à la place d’un humain.',
  'limits.no-block.title': 'Elle ne bloque pas',
  'limits.no-block.body':
    'La clôture d’un ticket n’est jamais bloquée. Une porte de non-régression est possible, mais optionnelle et clairement signalée.',
  'limits.no-attest.title': 'Elle n’atteste pas',
  'limits.no-attest.body':
    'Elle n’atteste jamais à la place d’un humain : elle enregistre qui a fait quoi, pour l’audit, et refuse d’attribuer un acte à un agent.',
  'limits.no-invent.title': 'Elle n’invente pas',
  'limits.no-invent.body':
    'Une liaison déduite par similarité reste une proposition tant qu’un humain ne l’a pas confirmée, et ne compte jamais comme couverture déclarée.',
  'limits.no-score.title': 'Elle ne note personne',
  'limits.no-score.body':
    'Aucun score par personne, aucune statistique par équipe. Les acteurs n’apparaissent que dans la piste d’audit d’un critère.',
  'limits.absences.title': 'Les quatre absences, tenues à part',
  'limits.absences.lead':
    'Les angles morts de l’app ne doivent jamais être lus comme ceux du projet. Pas de droit ≠ pas de test.',

  /* ----------------------------------------------------------- architecture */
  'architecture.title': 'L’architecture en dix lignes',
  'architecture.lead':
    'Un domaine pur, une seule frontière, Forge SQL. La page que vous lisez importe les mêmes modules de domaine que l’app.',
  'architecture.l1':
    'Les sources : le champ d’acceptation, la description, le tableau de critères, Confluence, un ticket de test dédié, une pièce jointe — six gîtes, une empreinte.',
  'architecture.l2':
    'Les actes : les objets test-execution, test-run et test-status du graphe Teamwork, plus les builds Bitbucket, les commentaires Jira et le déclencheur de pipeline signé.',
  'architecture.l3':
    'Le graphe des liaisons : un critère, un acte, une maille — l’empreinte du critère est conservée au moment du lien.',
  'architecture.l4':
    'Les quatre chemins de liaison, du plus sûr au plus fragile : mention explicite, convention de nommage, similarité sémantique (proposée, jamais comptée), déclaration humaine.',
  'architecture.l5':
    'Les trois jugements : la couverture sur trois axes jamais fusionnés, les perforations, les fils détendus — les derniers font descendre la couverture.',
  'architecture.l6':
    'Le métré classe les trous : type de critère, risque observé de la zone, récurrence — le score affiche toujours ses termes.',
  'architecture.l7':
    'Cache par empreinte : un critère modifié ne recalcule que les liaisons concernées, et le modèle hébergé n’est appelé que pour la similarité.',
  'architecture.l8':
    'Forge SQL : quinze tables, le DDL dans src/db/schema.ts. Les textes des critères sont stockés, les preuves sont référencées, jamais copiées.',
  'architecture.l9':
    'Le domaine n’importe jamais @forge/* : tout est testable avec les fakes en mémoire et une horloge figée.',
  'architecture.l10':
    'Une app Forge, un écran par jugement, quatorze outils MCP — et le site que vous lisez fait tourner les mêmes modules dans votre navigateur.',
  'architecture.docs': 'Dans le dépôt',
  'architecture.links': 'Les quatre chemins de liaison',

  /* ---------------------------------------------------------------- recette */
  'recipe.title': 'Comment juger Trame en cinq minutes',
  'recipe.lead':
    'Tout est ouvert : le moteur, le projet semé, la recette et la vidéo. Rien n’exige un compte pour être lu.',
  'recipe.step1.title': 'Lire l’idée en trente secondes',
  'recipe.step1.body':
    'Un critère est un fil de chaîne, un test un passage de trame, l’intersection une maille — et le trou est le critère que personne n’a vérifié.',
  'recipe.step2.title': 'Lancer la démo ci-dessus',
  'recipe.step2.body':
    'Chaque chiffre de cette page est calculé par le moteur de l’app, dans votre navigateur. Choisissez un ticket, un critère, regardez les trous et les perforations.',
  'recipe.step3.title': 'Lire la recette',
  'recipe.step3.body':
    'Les vingt points de la recette du §24, un par un : ce que le point vérifie, la commande exacte, le fichier de test, l’état réel.',
  'recipe.step4.title': 'Lire le guide des jurés',
  'recipe.step4.body':
    'Trame en trente secondes, les trois jugements, ce que l’app ne fait pas, et les dix questions auxquelles répondent les outils MCP.',
  'recipe.step5.title': 'Regarder la vidéo',
  'recipe.step5.body':
    'Moins de cinq minutes : une release qui certifie tout, et les 31 % que personne n’a vérifiés.',
  'recipe.links': 'Liens',
  'recipe.link.readme': 'README.md',
  'recipe.link.demo': 'la démo ci-dessus',
  'recipe.link.recette': 'docs/RECETTE.md',
  'recipe.link.judges': 'docs/JUDGES.md',
  'recipe.link.video': 'docs/VIDEO-SCRIPT.md',

  /* ------------------------------------------------------------------ footer */
  'footer.note': 'App Atlassian Forge pour Codegeist 2026',
  'footer.licence': 'Licence MIT',
  'footer.repo': 'Dépôt',
  'footer.offline':
    'Tout ce 페이지 fonctionne hors ligne : aucune police, aucune icône et aucun script ne vient d’ailleurs que du dépôt.',
};
