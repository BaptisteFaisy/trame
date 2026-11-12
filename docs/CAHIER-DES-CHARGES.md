# Trame — cahier des charges

> Codegeist 2026 · catégorie **Apps for Software Teams**
> Bonus visés : Teamwork Graph (principal, objets `test-*`), Agents Rovo, MCP, Marketplace
> Version 1 du 11 novembre 2026 · soumission avant le mardi 22 décembre 2026, 21 h (Paris)
> Nom de dépôt proposé : `trame` · nom public : **Trame — the coverage of your acceptance criteria** · slogan : *le fil qui manque*
> Angle mort visé : **un critère d'acceptation écrit et jamais vérifié** — invisible jusqu'à l'incident

## 1. L'idée en une phrase

Chaque critère d'acceptation est un **fil de chaîne** ; chaque test qui le vérifie est un **passage de trame** : l'app tisse les deux, montre les **trous** de la trame, et surtout les **perforations** — les fils modifiés après avoir été tissés, dont la couverture s'est évaporée sans que personne ne le sache.

## 2. Le problème

Les critères d'acceptation sont le contrat entre celui qui developpe et celui qui vérifie. En pratique, ce contrat n'est pas tenu.

- **Le lien n'existe nulle part.** « Ce critère est couvert par un test » vit dans un commentaire, une convention de nommage, un tableur, ou dans la tête de quelqu'un. Personne ne le demande, personne ne le vérifie.
- **La couverture n'est jamais mesurée.** Le jour de la release, on certifie que « tous les critères sont couverts ». Trente pour cent ne le sont pas, et personne ne peut le dire — l'information n'existe pas.
- **Les critères difficiles sont les critères abandonnés.** Un critère sur un cas limite, une non-régression, une exigence de sécurité : il est écrit, il est là, et c'est exactement celui qu'on ne teste pas parce que c'est lui qui coûte. Le trou se concentre là où le risque est le plus élevé.
- **La couverture se périme en silence.** Un critère est modifié après coup (précision-client, correctif de sécurité, arbitrage produit) : le test qui le couvrait ne couvre plus rien, et le lien, lui, n'a pas bougé. **La trame reste pleine, le contrat est rompu.**
- **Et les tests menteurs.** Un test désactivé, renommé, refactoré ou rattaché à un critère supprimé : il donne un confort que plus rien ne justifie.

Résultat : un défaut qui sort en production, et une revue qui découvre, trois semaines plus tard, que le critère existait — mais que rien ne l'avait jamais vérifié.

Tout le nécessaire existe déjà : Jira connaît les critères, le graphe d'Atlassian connaît les plans de test, les exécutions et leurs statuts, Bitbucket connaît les branches et les builds, Confluence connaît les comptes rendus. Ce qui manque, c'est l'outil qui **tisse** ces quatre sources et qui ose dire : *ici, il y a un trou*.

## 3. Utilisateurs

| Qui | Ce qu'il fait | Ce qu'il attend |
|---|---|---|
| Testeur / QA | Vérifie avant la release | La liste exacte des critères non vérifiés, et rien à lui demander |
| Développeur | Écrit les critères et les tests | Savoir avant de clôturer quel critère il a oublié |
| Product owner / tech lead | Écrit et arbitre les critères | Voir la part de critères infalsifiables ou jamais testés |
| Responsable de release | Certifie que tout est couvert | Un état daté de la trame, avec ses trous et ses perforations |
| Auditeur / client | Demande la preuve | Un certificat : quoi, par qui, à quelle force, et ce qui reste ouvert |
| Agent de code | Implémente un critère | La liste des critères du ticket, et ceux qui restent à prouver |

## 4. Vocabulaire du produit

- **Critère** : un élément de la liste d'acceptation d'un ticket. Il porte un identifiant stable (`AC-1`), un texte, une **empreinte** (hash) et un auteur.
- **Type de critère** : fonctionnel, cas limite, non-régression, sécurité, performance, expérience, documentation. La typologie pilote la priorité d'un trou.
- **Fils de chaîne** : les critères, lignes verticales de la trame.
- **Passage de trame** : un acte de vérification qui couvre un critère — l'ensemble des lignes horizontales.
- **Maille** : la case critère × vérification. Vide, elle est un trou.
- **Trou** : un critère sans aucun acte de vérification.
- **Perforation** : un critère modifié **après** sa vérification ; sa couverture est périmée.
- **Fil détendu** : un acte de vérification qui ne couvre plus rien (test désactivé, renommé, critère supprimé).
- **Fil de déclaration** : un acte de vérification faible — un humain a déclaré avoir vérifié, sans artefact ni exécution.
- **Force** : la solidité d'un passage de trame — **machine** (exécution automatisée verte), **attestée** (un tiers, avec artefact), **déclarée** (une affirmation).
- **Liaison** : le lien entre un critère et un passage de trame. **Déclarée** (écrite par quelqu'un) ou **dérivée** (proposée par similarité, avec confiance).
- **Critère infalsifiable** : un critère que rien ne peut vérifier (« l'application doit être rapide », « l'ergonomie doit être agréable »).
- **Trame complète** : l'ensemble des mailles remplies, à la force déclarée.
- **Témoin de trame** : l'état daté d'une trame, conservé pour comparer deux sprints, deux versions, deux équipes.
- **Navette** : ce qui porte la vérification jusqu'au critère — l'app elle-même.
- **Métré** : la règle qui décide de la priorité d'un trou (type, zone, récurrence de défauts).
- **Registre de tissage** : la vue tableau, portant exactement la même information que la carte.
- **Certificat de trame** : la page datée, opposable, de ce qui a été vérifié et de ce qui ne l'a pas été.

Discipline de vocabulaire : **couvert** (un acte de vérification existe) ≠ **couvert fortement** (force machine ou attestée) ≠ **couvert à jour** (le critère n'a pas changé depuis) ≠ **prouvé** (couvert fortement **et** à jour **et** lié de façon déclarée). Le rapport ne dit jamais « couvert » seul : il dit « couvert, par une déclaration, sur un critère périmé depuis 40 jours ».

## 5. Ce que l'app ne fait pas

- elle **ne bloque pas** la clôture d'un ticket : elle montre, elle propose, elle n'interdit rien (une porte de non-régression est possible, mais optionnelle et signalée) ;
- elle **n'atteste jamais** à la place d'un humain : elle enregistre qui a fait quoi, pour l'audit, et refuse d'attribuer un acte à un agent ;
- elle **ne invente pas** la couverture : une liaison déduite par similarité reste une proposition tant qu'elle n'est pas confirmée ;
- elle **ne déclare pas** un critère vérifiable si l'acte de vérification n'a pas de preuve (artefact, exécution, référence) ;
- elle **ne note personne** : aucun score par personne, aucune statistique individuelle ; les acteurs sont nommés uniquement dans la piste d'audit d'un critère ;
- elle **ne garde aucun secret** : un critère ou un artefact contenant une clé est signalé avant d'être indexé.

## 6. Les six gîtes d'un critère

Un critère écrit peut être une phrase, une case à cocher, une ligne d'un tableau, un paragraphe dans une description, un point d'une page Confluence, un champ d'un formulaire de demande. L'extraction est donc multi-origine, et chaque origine a ses limites.

| Origine | Extraction | Limite |
|---|---|---|
| Champ « critères d'acceptation » du ticket | Liste d'items, stable | Certaines équipes n'utilisent pas le champ |
| Description du ticket (liste à puces, cases à cocher) | Markdown parsé, numérotation reconstruite | Mélange souvent critères et notes |
| Tableau de critères (colonnes) | Colonnes = critères, lignes = cas de test | Mise en forme variable, colonnes vides |
| Page Confluence (checklist) | Cases à cocher, tableau | Hors du ticket, donc lien indirect |
| Ticket de test dédié (sous-tâche « Test ») | Titre + résultat | Libre : pas de vocabulaire imposé |
| Pièce jointe (recette, cahier de tests) | Référence déclarée, pas de lecture | L'app pointe, elle ne décode pas |

Règle : **l'app ne crée pas de critère**. Elle en détecte, elle les numérote de façon stable, elle les empreinte. Un critère écrit dans un commentaire n'est pas un critère.

## 7. Les sept formes d'acte de vérification

| # | Forme | Source | Force par défaut |
|---|---|---|---|
| 1 | Test automatisé exécuté | Objets `test-execution` / `test-run` / `test-status` du graphe, builds Bitbucket | **machine** |
| 2 | Cas de test manuel exécuté et enregistré | Ticket de test, sous-tâche, demande JSM, checklist Confluence cochée | attestée |
| 3 | Attestation tierce | Artefact référencé : rapport de scan, compte rendu de recette, avis juridique, benchmark | attestée |
| 4 | Revue de code couvrant le critère | PR Bitbucket dont le message ou la description cite le critère | déclarée (faible : une revue ne prouve pas un comportement) |
| 5 | Vérification manuelle tracée dans un ticket | Commentaire daté + checklist exécutée | déclarée |
| 6 | Preuve de déploiement | Ticket de version, release, déploiement au graphe | déclarée |
| 7 | **Déclaration** : « c'est fait » | Commentaire, champ, statut | déclarée |

Un critère couvert uniquement par une déclaration a une couverture **faible**, et le rapport le dit dans les mêmes termes qu'un trou : la trame est « pleine de papier ».

## 8. Les trois jugements

### 8.1 La trame (couverture)

Pour un périmètre donné (ticket, sprint, projet, version) :

```
couverture = critères couverts / critères totaux
```

décomposée en trois axes, jamais fusionnés :
- **par force** : machine / attestée / déclarée ;
- **par type de liaison** : déclarée / dérivée ;
- **par fraîcheur** : à jour / périmée.

Chaque chiffre porte son effectif et sa fourchette quand c'est une moyenne. Une trame affichée « 87 % » sans dire « dont 40 % seulement par déclaration » est une trame qui ment.

### 8.2 Les perforations

Un critère est **perforé** quand son empreinte a changé **après** la dernière vérification qui le couvrait. Détection : on compare l'empreinte courante du critère à celle enregistrée au moment du tissage (à la date de l'acte de vérification).

C'est le jugement que personne ne fait, et il est peu coûteux : il suffit de conserver l'empreinte au moment du lien.

Graffiti de la perforation, par criticité du critère et ancienneté :
- **perforation fraîche** : le critère a changé il y a moins de 7 jours — probablement en cours d'itération, à regarder ;
- **perforation sèche** : plus de 30 jours, et le critère n'a jamais été re-vérifié depuis ;
- **perforation multiple** : le critère a changé trois fois et n'a jamais été re-vérifié.

### 8.3 Les fils détendus

Un acte de vérification qui ne couvre plus rien :
- le critère visé a été supprimé ou renuméroté ;
- le test est désactivé, ignoré (`@Ignore`), ou son build ne tourne plus ;
- le test a été renommé et plus aucun lien ne le désigne (le lien pointe vers un nom qui n'existe plus).

Ces fils-là donnent un confort vide. Ils sont comptés, listés, et **retirés de la couverture** — donc la couverture affichée baisse quand un test meurt. C'est ce qui rend la mesure honnête : pas de couverture qui ne peut que monter.

### 8.4 Les critères infalsifiables

Un critère qui ne peut pas être vérifié (« rapide », « simple », « agréable », « robuste ») ne peut pas être couvert, donc il ne compte ni comme trou ni comme couverture. L'app en fait une catégorie à part : part des critères infalsifiables par ticket, proposition de reformulation en critère vérifiable (« le temps de réponse du tableau de bord reste sous 2 s au 95ᵉ centile »).

C'est un gain indirect mais majeur : **un backlog dont 30 % des critères sont infalsifiables est un backlog qui ne peut pas être certifié**.

## 9. Le tissage : comment un lien est établi

Le lien critère ↔ vérification est la pièce difficile. Trois chemins, et une exigence de vérité sur chacun.

### 9.1 La liaison déclarée

Quelqu'un a écrit le lien : relation Jira, étiquette, mention explicite du critère dans le message d'un test, lien de type « is tested by », ou mention `AC-3` dans une PR ou un ticket. C'est la liaison la plus solide : elle est intentionnelle et datée.

### 9.2 La liaison dérivée

Le lien n'existe nulle part, mais un test et un critère se ressemblent. L'app propose une correspondance avec une **confiance**, sur la base du texte du critère, du nom du test, du ticketKeys dans le nom (`PROJ-12.testShouldRetry`), du composant et du type de vérification.

Règles strictes :
- une liaison dérivée **au-dessus** d'un seuil (0,85 proposé) est affichée en couverture **provisoire**, avec le badge « dérivée, à confirmer » ;
- en dessous, elle reste une **proposition** dans la file de travail ;
- une liaison dérivée **n'est jamais comptée** comme couverture dans le chiffre de couverture « déclarée » ; elle l'est dans une ligne distincte, « couverture provisoire » ;
- **elle se périme** : si le critère ou le test change, la confiance est recalculée et peut tomber, ce qui fait **baisser** la couverture.

C'est le mécanisme qui empêche l'app de gonfler ses chiffres par similarité sémantique.

### 9.3 L'absence

Rien. C'est un **trou**, et c'est le résultat principal du produit.

### 9.4 Le retricotage

Quand une liaison dérivée est confirmée, elle devient déclarée, et le fil qui la portait rejoint la chaîne. Le retricotage est un acte humain, tracé, et chaque confirmation **renforce** la suite : les liaisons confirmées apprennent à reconnaître les liaisons futures (pondération des tokens du critère par ce qui a été confirmé ou infirmé auparavant). La qualité du tissage s'améliore avec l'usage — sans jamais devenir une boîte noire : le score de confiance reste affiché par proposition.

## 10. Ce que le graphe d'Atlassian apporte (et ce qu'il ne peut pas)

Le Teamwork Graph expose les types `test-plan`, `test-run`, `test-execution`, `test-status`, `work-item`, `commit`, `pull-request`, `deployment`, `document`, `project`, `software-service`, `AtlassianUser`, `AtlassianTeam`. C'est la matière première, et l'essentiel des objets `test-*` n'est utilisé par aucune app du marché.

**Ce que le graphe donne :**
- l'**exécution** d'un test, son statut et sa date (la force « machine », et la date qui permet la perforation) ;
- le **plan de test** auquel il appartient, donc le périmètre ;
- la **relation temporelle** entre le critère et sa vérification, sans calcul artisanal ;
- le **lien au projet, au service, à l'auteur** ;
- la **couverture au niveau du repository** : quels tests existent, tournent, et passent.

**Ce que le graphe ne donne pas, et qu'il faut donc reconstruire :**
- la **relation directe** entre un critère et un test : elle n'existe pas comme type d'objet ; il faut la déduire ;
- le **contenu** d'un test (nom, assertions) : hors du graphe, il vient de Bitbucket ou de la convention de nommage.

**Stratégie de reconstruction, du plus sûr au plus fragile :**
1. **Mention explicite** : le nom ou le message du test contient l'identifiant du critère (`AC-3`) ou sa clé de ticket. Déterministe, fiable.
2. **Convention de nommage** : `PROJ-12.testShouldX` → rattachement au ticket. Déterministe, très répandu.
3. **Similarité sémantique** : le modèle compare le texte du critère et celui du test. Proposé, jamais compté d'office.
4. **Déclaration humaine** : le lien écrit à la main, qui reste la référence.

Ces quatre niveaux sont affichés séparément dans chaque rapport. La couverture d'une équipe qui utilise la convention `PROJ-12.` est mesurable dès le premier jour ; celle d'une équipe sans convention ne l'est pas — et l'app le dit au lieu d'afficher un trou partout.

## 11. Le métré : la priorité d'un trou

Tous les trous ne se valent pas. Le métré classe un trou sur trois entrées, toutes vérifiables :

- **Type du critère** : sécurité et non-régression d'abord, puis cas limite, puis fonctionnel, puis confort.
- **Zone à risque** : la zone du dépôt (composant, service) a-t-elle déjà produit des défauts ? Combien, et quand ? Le risque observé **réordonne** les trous : un critère jamais testé dans une zone sans antécédent n'est pas le même trou qu'un critère jamais testé dans une zone qui a déjà cassé trois fois.
- **Récurrence** : ce critère, ou un critère frère, a-t-il déjà été trouvé faux après livraison ? Un critère qui a déjà échappé une fois est un trou prioritaire, et l'app le sait parce que l'incident précédent est dans Jira.

Le métré est réglable par équipe (les poids sont une décision, pas une vérité), et la Priorité affichée montre le calcul.

## 12. Les livrables

### 12.1 La carte de trame

La vue visuelle : pour un périmètre, la toile tissée. Fils verticaux = critères, passages horizontaux = actes de vérification, mailles = la couverture. Un trou se voit : le vide laisse passer le fond. La taille du trou suit sa priorité.

### 12.2 Le registre des perforations

La liste des fils modifiés après avoir été tissés, avec le critère, sa version actuelle, la date du dernier changement, la date de la dernière vérification, et l'écart.

### 12.3 La file des fils détendus

Les actes de vérification qui ne couvrent plus rien, avec la raison (test désactivé, renommé, critère supprimé) et l'impact sur la couverture.

### 12.4 Le bulletin de trame

Pour la revue de sprint ou la release : la couverture par force et par fraîcheur, le nombre de perforations, le nombre de fils détendus, la part de critères infalsifiables, la part de critères ajoutés en cours de sprint, et la **liste des trous prioritaires**. Daté, comparable au témoin précédent.

### 12.5 Le certificat de trame

Page Confluence générée : périmètre, date, couverture détaillée, liste des actes de vérification (type, date, acteur, force), perforations et fils détendus ouverts, critères infalsifiables, et déclaration explicite de ce qui **n'est pas** couvert. Opposable à un auditeur ou à un client, et réutilisable dans un dossier de release.

### 12.6 Les propositions

- **Test à écrire** : pour un trou prioritaire, l'app propose un brouillon de cas de test — texte, type de vérification attendu, suggestion de composant, forme (« test automatisé » vs « recette manuelle »), et le critère qu'il couvrirait.
- **Reformulation** : pour un critère infalsifiable, une proposition vérifiable, avec la mesure proposée.
- **Re-tissage** : pour une perforation, la liste des actes à rejouer.

Rien n'est appliqué automatiquement : tout passe par une file de validation.

## 13. Le lien avec les autres produits du portefeuille

Trame est une **couche de mesure** qui se nourrit des autres et les alimente :

| Produit | Ce qui circule |
|---|---|
| `preuve-a-l-appui` | Trame lui fournit, pour chaque critère, **la liste des actes de vérification** et leur force. La porte de Done peut exiger qu'un critère ait une preuve forte — Trame sait dire laquelle, sans rien recalculer. |
| `rayon-impact` | Trame fournit un signal de release supplémentaire : **le contrat de la release est-il tenu** (couverture à jour de la version), distinct des signaux opérationnels (gels, incidents, dépendances). |
| `deja-vu-ci` | Même moteur de signature : les échecs de tests déjà connus alimentent le métré (une zone qui échoue est une zone où tester compte plus). |
| `delegable-ou-pas` | Un critère couvert et stable est un signe qu'un ticket est mûr pour un agent ; un critère instable est un risque. |
| `vigie` | « Part des critères prouvés à jour » est un **résultat clé de niveau A** calculé par Trame, sans travail supplémentaire. |
| `gammes` | Une gamme peut exiger, pour une étape, que les critères du ticket soient couverts : la trace de la gamme et la trame se rejoignent. |
| `placard-wiki` | Les détecteurs tournent sur les critères et les artefacts : un critère qui contient une clé n'est jamais indexé. |
| `banc` | Le banc mesure les agents ; Trame mesure les critères. Un agent qui rédige des critères peut être évalué sur ceux qu'il écrit. |

## 14. Ce que l'app ne fait pas (rappel de discipline)

Le principe : **la mesure ne modifie pas le travail**. Trame ne réécrit pas un critère, ne crée pas de test, ne bloque pas une clôture, ne classe pas les équipes. Elle rend visible ce qui n'existait pas comme information, et elle propose des corrections que des humains appliquent.

## 15. Exigences fonctionnelles

**M** = indispensable pour la soumission, **S** = souhaitable, **C** = après le hackathon.

| N° | Exigence | P |
|---|---|---|
| TR-01 | Extraire les critères de toutes les origines (champ, description, tableau, page, ticket de test) avec identifiant stable et empreinte | M |
| TR-02 | Detecter les actes de vérification dans le graphe (`test-execution`, `test-run`, `test-status`) et dans Bitbucket, avec leur date et leur statut | M |
| TR-03 | Reconnaître les quatre chemins de liaison (mention, convention, similarité, déclaration) et les distinguer dans chaque chiffre | M |
| TR-04 | Calculer la couverture par force, par type de liaison et par fraîcheur, avec effectifs | M |
| TR-05 | Détecter les perforations (critère modifié après sa vérification) et les classer (fraîche, sèche, multiple) | M |
| TR-06 | Détecter les fils détendus (test désactivé, renommé, critère supprimé) et **retirer leur couverture** | M |
| TR-07 | Détecter les critères infalsifiables et proposer des reformulations | M |
| TR-08 | Prioriser les trous avec le métré (type, zone à risque, récurrence) | M |
| TR-09 | Proposer un brouillon de test pour un trou prioritaire, sans l'appliquer | M |
| TR-10 | Carte de trame par ticket, sprint, projet et version | M |
| TR-11 | Registre des perforations et file des fils détendus | M |
| TR-12 | Bulletin de trame daté et comparable (témoin) | M |
| TR-13 | Certificat de trame généré dans Confluence, opposable, déclarant les manques | M |
| TR-14 | Fiche critère sur le ticket : couverture, forces, perforations, proposition de test | M |
| TR-15 | Fichier des liaisons dérivées avec confiance, file de confirmation, retricotage tracé | M |
| TR-16 | Recalcul de la confiance des liaisons dérivées à chaque changement de critère ou de test | M |
| TR-17 | Aucune couverture « provisoire » comptée dans la couverture déclarée | M |
| TR-18 | Outils MCP du § 16 | M |
| TR-19 | Agent Rovo « Le fil » et skill `before-closing-a-ticket` | M |
| TR-20 | Écran de couverture : ce que l'app voit, ce qu'elle ne voit pas (droits, objets, périmètre) | M |
| TR-21 | Boucle de confirmation qui améliore la reconnaissance des liaisons | S |
| TR-22 | Couverture par zone de dépôt et par service (puisée dans le graphe) | S |
| TR-23 | Corrélation avec les défauts échappés : quel trou a laissé passer quel bug | S |
| TR-24 | Détection des critères ajoutés ou modifiés en cours de sprint (dérive de périmètre au niveau critère) | S |
| TR-25 | Part des critères négatifs (« ne doit pas ») vs positifs | S |
| TR-26 | Trame des tests : quels tests ne couvrent aucun critère (travail de vérification mort) | S |
| TR-27 | Score de maturité de la trame par projet, avec seuils et historique | S |
| TR-28 | Comparaison inter-équipes anonymisée des couvertures, sur critères comparables | C |
| TR-29 | Lecture des artefacts de recette (PDF, tableurs) pour extraire des preuves | C |
| TR-30 | Porte de non-régression optionnelle sur la clôture (à signer explicitement) | C |

## 16. Outils MCP, agent Rovo, skill

### Outils, exposés par `rovo:mcp`

| Clé | Verbe | Entrées | Retour |
|---|---|---|---|
| `get-coverage` | GET | `scope` (ticket/sprint/projet/version), `mode?` | Couverture par force, liaison et fraîcheur, avec effectifs |
| `list-holes` | GET | `scope`, `priority?`, `limit` | Trous classés par le métré, avec le critère et la zone |
| `list-perforations` | GET | `scope`, `age?` | Critères modifiés après vérification, avec dates et écart |
| `list-dangling` | GET | `scope` | Actes de vérification qui ne couvrent plus rien, avec la raison |
| `get-criterion` | GET | `ticketKey`, `criterionId` | Critère, empreinte, actes de vérification, forces, fraîcheur |
| `propose-test` | CREATE | `ticketKey`, `criterionId` | Brouillon de cas de test proposé |
| `propose-reformulation` | CREATE | `ticketKey`, `criterionId` | Reformulation vérifiable proposée |
| `confirm-link` | CREATE | `criterionId`, `verificationRef`, `kind` | Liaison confirmée (retricotage) |
| `reject-link` | UPDATE | `criterionId`, `verificationRef`, `reason` | Liaison refusée, la suggestion s'affaiblit |
| `get-bulletin` | GET | `scope` | Bulletin de trame daté |
| `get-certificate` | GET | `scope` | Contenu du certificat de trame (Confluence) |
| `list-unverifiable` | GET | `scope` | Critères infalsifiables, avec reformulations proposées |
| `get-zones-risk` | GET | `scope` | Zones à risque et défauts passés, entrés du métré |
| `get-coverage-timeline` | GET | `scope`, `periods?` | Historique de la couverture, témoin par témoin |

Aucun outil ne renvoie de contenu de critère en dehors du périmètre demandé, et aucun n'accepte un nom de personne en filtre.

### Agent Rovo « Le fil »

Dans Rovo Chat :

- « Quels critères de la version 2026.11 ne sont couverts que par une déclaration ? »
- « Qu'est-ce qui a été percé cette semaine : un critère a changé après son test ? »
- « Nos trous les plus risqués sont sur quelles zones ? »
- « Écris un brouillon de test pour le critère AC-3 du ticket PROJ-412. »
- « Quel pourcentage de nos critères est infalsifiable ? »
- « La trame de la release est-elle complète ? Qu'est-ce qui manque ? »

L'agent répond avec des chiffres et leurs effectifs, cite le critère et sa source, et dit « pas assez de recul » quand l'effectif est faible.

### Skill `before-closing-a-ticket`

En `SKILL.md`, publiée en source ouverte : avant de proposer la clôture d'un ticket, vérifier la couverture des critères ; si un critère n'est couvert que par une déclaration, le dire ; si un critère est perforé, le re-vérifier ; ne jamais considérer une liaison dérivée comme une couverture ; demander un test plutôt que d'affirmer que « c'est fait ».

## 17. Écrans

La métaphore est celle du **tissage** : chaque élément porte une donnée, rien n'est décoratif.

| Élément | Donnée encodée |
|---|---|
| La **toile** | Le périmètre tissé (ticket, sprint, projet, version) |
| Un **fil de chaîne** (vertical) | Un critère ; son numéro gravé ; sa couleur = type de critère |
| Un **passage de trame** (horizontal) | Un acte de vérification ; son épaisseur = force |
| Une **maille** | La case critère × vérification : pleine, vide, ou provisoire (traits pointillés) |
| Un **trou** | Un critère sans vérification ; sa taille = priorité du métré ; on voit le fond à travers |
| Une **perforation** | Un fil recoloré après tissage : la maille existe mais ne tient plus |
| Un **fil détendu** | Un passage qui pend et ne croise plus rien |
| Un **fil de déclaration** | Un passage fin, en pointillés : il existe, il ne prouve rien |
| La **navette** | Ce qui porte la vérification vers le critère — c'est l'app, toujours visible dans l'interface |
| Le **métré** | La règle de priorité des trous, réglable et affichée |
| Le **registre de tissage** | La vue tableau, information identique, WCAG AA |
| Le **témoin** | La trame du sprint précédent, posée à côté pour comparaison |

Écrans : 1. **Carte de trame** (`jira:projectPage` ou `globalPage`) · 2. **Fiche critère** (`jira:issuePanel`) · 3. **Explorateur des trous** (triés par le métré) · 4. **Registre des perforations** · 5. **File des fils détendus** · 6. **Bulletin de trame** (daté, comparable) · 7. **Certificat** (page Confluence générée) · 8. **File de validation** (liaisons dérivées à confirmer, tests proposés, reformulations proposées) · 9. **Zones à risque** (entrées du métré) · 10. **Écran de couverture** (ce que l'app voit et ne voit pas) · 11. **Historique de trame** (témoins successifs).

## 18. Architecture Forge

Une app Jira (lecture-écriture légère) qui lit le graphe et Bitbucket, et écrit dans Confluence pour le certificat.

```yaml
# Esquisse, à valider avec forge lint et les vérifications du § 22
modules:
  rovo:mcp:                     # les 14 outils du § 16
  rovo:agent:                   # « Le fil »
  rovo:skill:                   # before-closing-a-ticket
  action:                       # une entrée par outil
  jira:globalPage:              # carte de trame, explorateur, bulletin, historique
  jira:projectPage:             # trame d'un projet, zones à risque
  jira:issuePanel:              # fiche critère sur le ticket
  jira:customField:             # « Trame », « Trous », « Perforations » (comptés)
  jira:jqlFunction:             # holes(), perforated(), dangling(), uncovered()
  jira:dashboardGadget:         # bulletin de la version en un coup d'œil
  jira:workflowValidator:       # optionnel (TR-30) : alerte de non-régression à la clôture
  confluence:globalPage:        # certificats de trame
  confluence:macro:             # bulletin et Synthèse de trame dans un tableau de bord
  trigger:                      # ticket modifié, critère ajouté, PR liée, test exécuté
  scheduledTrigger:             # nuit : recalcul des perforations, des fils détendus, du bulletin
  consumer:                     # recalculs longs, jusqu'à 900 s, par tranches avec curseur
  webtrigger:                   # pont signé vers les pipelines (résultats de test)
  sql:
  llm:                          # propositions de liaison, reformulations, brouillons de test
permissions:
  scopes:                       # read:issue-details:jira, write:issue-details:jira (commentaires),
                                # read:confluence-content.all, write:confluence-content,
                                # read:me, read:jira-work, read:jira-user,
                                # graph:work-item, graph:test-plan, graph:test-run,
                                # graph:test-execution, graph:test-status, graph:commit,
                                # graph:pull-request, graph:deployment, graph:project,
                                # graph:software-service, graph:document, graph:atlassian-user
```

### Ce qu'impose la plateforme

- Lecture du graphe au nom d'un utilisateur : un droit manquant **vide le résultat sans erreur**. L'écran de couverture teste chaque type d'objet sur un cas dont la réponse est connue, pour distinguer « pas de droit » de « pas de données » — sans cette distinction, l'app afficherait des trous là où elle n'a simplement pas regardé.
- **Cinq déclencheurs planifiés** au plus, un seul à 5 minutes : le recalcul nocturne porte sur les perforations et les fils détendus, pas sur l'extraction des critères.
- Les recalculs longs passent par `consumer` (900 s) avec **curseur** : un projet de 50 000 tickets ne se recalcule pas en une fonction.
- LLM hébergé avec cache par empreinte de critère : la similarité ne recalcule que ce qui a changé.
- Une app consomme l'API du graphe **ou** fournit un connecteur, pas les deux.

### Ce que l'app conserve

Des faits : critères (texte, empreinte, type), actes de vérification (référence, type, date, force), liaisons (type, confiance, confirmé), mesures (couverture, perforations, trous). Les textes de critères sont conservés — c'est le sujet même du produit. Les secrets sont écartés à l'entrée, et les preuves référencées, jamais recopiées.

## 19. Modèle de données (Forge SQL)

| Table | Colonnes principales |
|---|---|
| `criterion` | id, issue_id, criterion_key, text, text_hash, kind, origin, falsifiable, infalsifiable_reason, created_at, author_ref, deleted_at |
| `criterion_version` | id, criterion_id, version_no, text_hash, changed_at, changed_by_ref, change_kind |
| `verification` | id, source_type (test-execution/test-run/manual/third-party/review/deploy/declaration), source_ref, issue_id, ticket_key, name, executed_at, status, strength, artifact_ref, author_ref, disabled_at |
| `link` | id, criterion_id, verification_id, kind (declared/derived/confirmed), confidence, established_at, confirmed_at, rejected_at, reject_reason, weights_json |
| `coverage_snapshot` | id, scope, scope_type, computed_at, criteria_n, covered_declared, covered_derived, covered_machine, covered_attested, covered_stale, holes_n, dangling_n, provisional_n |
| `perforation` | id, criterion_id, verification_id, criterion_version_no, changed_at, verified_at, age_days, class (fresh/dry/multiple), state |
| `dangling` | id, verification_id, reason (disabled/renamed/criterion_deleted/no_longer_run), detected_at, impact_n, state |
| `hole` | id, criterion_id, priority_score, priority_terms_json, scope, state, proposal_id |
| `proposal` | id, type (test_draft/reformulation/relink/retest), criterion_id, payload_json, created_at, state, decided_at, decided_by_ref |
| `zone_risk` | scope, defect_n, last_defect_at, open_incident_n, score, computed_at |
| `metric_rule` | id, weight_json, scope, updated_at, updated_by_ref |
| `witness` | id, scope, scope_type, period, coverage_json, computed_at, bulletin_ref |
| `coverage_event` | id, scope, event (criterion_added/changed/removed/link_confirmed/test_disabled), at, payload_json |
| `cursor` | scope, mode, last_issue_id, last_modified_at, run_at |
| `budget` | day, llm_calls, tokens, cost_estimate |

Aucune table ne contient de statistique par personne. `author_ref` sert la piste d'audit d'un critère et la responsabilité d'une décision, jamais un classement.

## 20. Réutilisation du portefeuille

Rien n'est recopié :

| App existante | Ce que Trame en prend |
|---|---|
| `preuve-a-l-appui` | La grille de force des preuves (machine / attestée / déclarée) et les types de preuve ; Trame lui fournit la liste des actes déjà enregistrés pour un critère |
| `deja-vu-ci` | Le moteur de signature pour classer les échecs et alimenter le risque de zone |
| `delegable-ou-pas` | Le refus de conclure sous un seuil d'effectif, les intervalles de confiance, les époques (un sprint qui change de pratique n'est pas comparable au précédent) |
| `problemes-caches` | Le cache par empreinte de contenu, appliqué aux calculs de couverture |
| `brief-forge` | La discipline des citations : un chiffre de couverture cite son périmètre, sa date et son effectif |
| `placard-wiki` | Les détecteurs de secrets et de données personnelles, appliqués aux critères et aux artefacts |
| `vigie` | Les mesures de Trame deviennent des résultats clés de niveau A |
| `gammes` | La discipline des preuves d'étape et le refus des agents d'attester |
| `banc` | Le principe d'isolation et de preuve : chaque mesure est rejouable et datée |

## 21. Contraintes vérifiées et points à valider

### Vérifié dans la documentation (11 novembre 2026)

- **Teamwork Graph** : lecture GraphQL en Preview, requêtes prêtes à l'emploi ou **Cypher persisté** (le Cypher brut est refusé aux nouvelles apps), au nom d'un utilisateur, **un droit par type d'objet**, droit manquant = résultats omis **sans erreur**. La liste des types comprend bien `test-plan`, `test-run`, `test-execution`, `test-status`, `work-item`, `commit`, `pull-request`, `deployment`, `document`, `project`, `software-service`, `AtlassianUser`, `AtlassianTeam` : les objets de qualité sont donc disponibles et peu utilisés.
- **Fonctions** : 25 s en standard ; jusqu'à **900 s** via `consumer` ou déclencheur planifié ; 55 s pour action, agent et web trigger ; payload 5 Mo, 500 Ko depuis une interface custom.
- **Déclencheurs planifiés** : 5 au plus par app, un seul à 5 minutes.
- **LLM hébergé** : Haiku (200K/64K), Sonnet et Opus (1M/128K) ; 100 invites/min par installation, 500K jetons/min par modèle.
- **Stockage** : SQL, KVS, Entity Store, Object Store (Preview) ; facturation à la consommation depuis le 1ᵉʳ janvier 2026.
- **Forge Realtime** : GA sur Jira et Confluence.
- **Connecteur** : catalogue fermé de 26 types, sans type `goal`/`objective` ; ingestion interdite des e-mails, agendas, enregistrements de réunion, données RH, financières ou de santé réglementées.
- **Jira** : `jira:workflowValidator` existe (peu utilisé dans le portefeuille — un module à fort potentiel ici).

### À valider par un prototype la première semaine

| Point | Pourquoi | Solution de repli |
|---|---|---|
| **Relation entre `test-execution` et `work-item`** dans le graphe | Le tissage par le graphe | Repli sur les mentions explicites et les conventions de nommage (déterministes), graphe utilisé pour les dates et statuts |
| Le champ « critères d'acceptation » du ticket est exploitable et stable | Extraction des critères | Extraction depuis la description (markdown), avec numérotation reconstruite |
| Les objets `test-execution` portent le nom du test | Tissage par similarité | Convention de nommage et mentions de clé de ticket ; la similarité devient une simple proposition |
| Un test désactivé est visible dans le graphe | Fils détendus | Comparer le `test-status` (ignoré, non exécuté) et le statut du build |
| L'app peut-elle écrire un certificat dans Confluence | Livrable opposable | Page générée dans l'app, export manuel |
| Un webhook de pipeline peut alimenter les exécutions | Force « machine » | Repli sur le graphe seul, en déclarant la couverture des sources |
| Relation `test-execution` → `test-plan` → périmètre | Lecture par plan | Repli sur le rattachement par ticket |
| Volume réel : 20 000 tickets, 100 000 critères | Faisabilité du recalcul | Incrémental par `lastModified`, curseur, recalcul par périmètre |

## 22. Exigences non fonctionnelles

- **Honnêteté.** Aucun chiffre sans effectif ; couverture toujours décomposée (force, liaison, fraîcheur) ; couverture provisoire jamais fusionnée avec la couverture déclarée ; les trous de l'app (droits manquants, périmètre non couvert) ne sont jamais confondus avec les trous du projet.
- **Distinction des absences.** « Pas de droit » ≠ « pas de données » ≠ « pas de test » ≠ « pas de critère ». L'écran de couverture les sépare, sinon l'app confond ses propres angles morts avec ceux du projet.
- **Pas de notation.** Aucun score par personne ni par équipe sur la qualité des tests ; les acteurs n'apparaissent que dans la piste d'audit.
- **Explicabilité.** Chaque trou affiche le métré qui l'a classé ; chaque perforation affiche les deux dates ; chaque liaison dérivée affiche sa confiance.
- **Réversibilité.** Les propositions sont des brouillons ; rien n'est appliqué au critère ni au test sans validation ; l'empreinte permet de voir ce qu'une proposition changerait.
- **Périmètre stable.** Une couverture est toujours datée et scopée ; deux chiffres ne sont comparés que si leurs périmètres et leurs époques coïncident.
- **Sobriété.** LLM seulement pour la similarité, les reformulations et les brouillons de test ; cache par empreinte ; budget affiché.
- **Rapidité.** Fiche critère en moins de 2 s depuis le cache ; carte de trame en moins de 5 s ; recalcul nocturne incrémental.
- **Accessibilité.** Registre équivalent à la carte, navigation clavier, WCAG AA ; les états (trou, perforation, fil de déclaration) sont double-codés par le motif et par le mot, jamais par la seule couleur.
- **Langues.** Interface en anglais et en français ; soumission en anglais.

## 23. Cas limites

- **Critère vide ou à moitié écrit** (« le système doit » ) : marqué infaisable, compté à part, jamais compté comme trou.
- **Critère dupliqué** (même texte deux fois) : signalés comme doublons, l'identifiant stable les distingue, la couverture n'est pas double comptée.
- **Critère fusionné** (deux critères deviennent un) : le trou se recompute, l'historique de perforation se rattache au nouveau.
- **Critère supprimé** alors qu'un test le couvrait : fil détendu, couverture retirée.
- **Test désactivé le jour même de la release** : fil détendu détecté au recalcul nocturne, bulletin du matin, avant la décision.
- **Critère modifié puis rétabli à l'identique** : l'empreinte est identique, mais la version change — l'app garde l'historique et signale une perforation « refermée ».
- **Liaison dérivée confirmée à tort** : elle reste tracée, la suggestion suivante est plus prudente sur ce type de similarité.
- **Convention de nommage trompeuse** (`PROJ-12` dans le nom mais test d'un autre ticket) : le contrôle croisé avec le chemin du test et le composant signale la liaison douteuse.
- **Projet sans aucun critère** : la trame est vide, pas « 0 % » : l'écran dit « aucun critère d'acceptation écrit », ce qui est un problème différent.
- **Projet avec des critères dans 40 langues** : l'app ne compare pas les textes entre langues, elle ne propose aucune liaison dérivée dans ce cas et le dit.
- **Ticket supprimé** : ses critères et ses trous disparaissent du périmètre, l'historique reste.
- **Plusieurs équipes sur le même périmètre** : les couvertures ne sont pas fusionnées silencieusement ; l'écran indique le mélange et propose un découpage.
- **Un critère couvert par un test qui ne s'exécute plus** (CI désactivé) : fil détendu, par le chemin du build.
- **Le graphe n'est pas accessible** (droits manquants) : l'app ne montre aucun trou « test-* » et le déclare ; elle ne confond pas « pas de droit » et « pas de test ».

## 24. Recette

1. Un ticket avec trois critères et deux tests exécutés affiche une couverture avec l'effectif et la force par critère.
2. Un critère couvert par un test automatisé exécuté est compté « machine » ; par une attestation, « attestée » ; par un commentaire, « déclarée ».
3. La couverture affichée est décomposée en force, type de liaison et fraîcheur ; les trois lignes ne sont jamais fusionnées.
4. Un critère modifié après son test est listé en perforation avec les deux dates et son classement (fraîche, sèche, multiple).
5. Un test désactivé fait disparaître sa couverture du chiffre affiché.
6. Un critère supprimé fait apparaître un fil détendu avec la raison.
7. Une liaison dérivée au-dessus du seuil est affichée « provisoire » et n'entre pas dans la couverture déclarée.
8. Une liaison dérivée confirmée devient déclarée et apparaît dans l'historique du critère.
9. Une liaison dérivée rejetée avec raison affaiblit la suggestion suivante du même type.
10. Un critère infalsifiable est compté à part, et une reformulation vérifiable est proposée.
11. Un trou est priorisé par le métré, et le calcul du score est affiché.
12. Un critère d'une zone qui a déjà produit des défauts remonte dans le classement des trous.
13. Un bulletin de trame est daté et comparable au témoin du sprint précédent.
14. Le certificat de trame déclare explicitement ce qui n'est pas couvert, et la page Confluence est générée.
15. Un droit manquant sur `test-execution` apparaît dans l'écran de couverture, et aucun trou n'est attribué à ce motif.
16. Un projet sans critère affiche « aucun critère écrit », et non « 0 % ».
17. Un critère et son test liés par convention de nommage sont liés de façon déterministe, sans passer par le modèle.
18. Une modification de critère recalcule uniquement les liaisons concernées (cache par empreinte).
19. Aucun écran, export ni outil MCP ne contient de statistique par personne.
20. Un critère contenant une clé n'est pas indexé et un signalement est ouvert.

## 25. Scénario de la vidéo (moins de 5 minutes, en anglais)

| Temps | Contenu |
|---|---|
| 0:00 – 0:25 | Une release. « All acceptance criteria are covered. » — et 31 % ne le sont pas |
| 0:25 – 1:00 | La carte de trame : la toile, les fils de chaîne, les passages. Les trous se voient |
| 1:00 – 1:35 | Le détail : un critère couvert par une simple déclaration. « Covered on paper. Not proven. » |
| 1:35 – 2:10 | **La perforation** : le critère a changé mardi, son test est du 3 mars. La maille existe mais ne tient plus |
| 2:10 – 2:40 | Les fils détendus : un test désactivé, un critère supprimé. La couverture **redescend** |
| 2:40 – 3:05 | Le métré : le trou prioritaire n'est pas le plus nombreux, c'est celui de la zone qui a déjà cassé |
| 3:05 – 3:25 | L'agent Rovo : « Which criteria of this release are covered only by a declaration? » |
| 3:25 – 3:50 | Le certificat de trame, daté, opposable, qui déclare les manques |
| 3:50 – 4:15 | Le lien avec `preuve-a-l-appui` : la porte de Done sait désormais quelle preuve existe |
| 4:15 – 4:45 | Architecture : objets `test-*` du graphe, conventions de nommage, similarité proposée, cache par empreinte, Forge SQL |

## 26. Comment les jugés testeront

1. **Projet de démonstration.** Un projet Jira semé : 6 tickets, 24 critères (dont 4 infalsifiables, 3 modifiés après leurs tests, 2 sans aucun test), 14 exécutions de test dans le graphe, 3 tests désactivés, 2 critères supprimés, une convention de nommage `PROJ-xx.` partiellement appliquée, et une série de liaisons dérivées à confirmer.
2. **La carte de trame**, par ticket et par sprint, avec les trous visibles et le métré.
3. **Le registre des perforations** et la **file des fils détendus**, avec l'impact chiffré sur la couverture.
4. **Le bulletin** de la version de démonstration, et son témoin (sprint précédent semé).
5. **Le certificat** généré dans Confluence.
6. **Agent Rovo et client MCP** : les six questions du § 16, et `get-coverage`, `list-holes`, `list-perforations` sur le projet de démonstration.
7. **L'écran de couverture**, pour voir ce que l'app distingue : pas de droit, pas de données, pas de test, pas de critère.

Le lien d'installation, le script de semis et les identifiants de démonstration figurent dans la soumission ; la vidéo montre en plus le calcul sur un site relié à un dépôt réel, où la convention de nommage existe.

## 27. Plan jusqu'au 22 décembre

| Semaine | Objectif |
|---|---|
| 11 – 17 nov. | Les huit validations du § 21, en priorité la relation `test-execution` ↔ `work-item` et l'extraction des critères ; squelette Forge et socle CI |
| 18 – 24 nov. | Extraction des critères (5 origines), empreintes, actes de vérification, quatre chemins de liaison |
| 25 nov. – 1ᵉʳ déc. | Couverture par force / liaison / fraîcheur, perforations, fils détendus, métriques |
| 2 – 8 déc. | Métré et priorités, explorateur de trous, carte de trame, bulletin, certificat Confluence |
| 9 – 15 déc. | Outils MCP, agent Rovo « Le fil », skill, file de validation, écran de couverture ; **gel des fonctionnalités le 15** |
| 16 – 22 déc. | Recette, jeu de démonstration semé, vidéo, instructions pour les jugés, soumission, dépôt Marketplace |

Sacrifiables dans l'ordre : la carte de trame (le registre porte la même information), la file de validation, la corrélation avec les défauts échappés, le score de maturité, la trame des tests.

## 28. Risques

| Risque | Parade |
|---|---|
| La relation test ↔ critère n'existe pas dans le graphe | Quatre chemins de liaison, dont deux déterministes (mention, convention) ; la similarité reste une proposition non comptée |
| Trop de trous dans les équipes mal outillées → bruit | Le bulletin montre les couvertures par force et par liaison ; le chiffre de couverture « provisoire » est séparé ; les trous sont classés, pas comptés en vrac |
| L'app paraît accuser les équipes | Aucune statistique par personne ; la lecture est celle d'un **contrat de qualité**, pas d'un classement ; la démo montre l'organisation qui gagne |
| La similarité sémantique gonfle la couverture | Jamais comptée dans la couverture déclarée ; seuil de confiance ; recalcul qui peut faire baisser le chiffre |
| Le graphe n'est pas accessible chez les jugés | Quatre chemins de liaison déterministes suffisent à la démonstration ; l'écran de couverture le dit |
| Les critères sont écrits dans des champs non standard | Extraction multi-origine dès la semaine 1, y compris descriptions et Confluence |
| Le produit est lu comme un outil de test coverage classique | Le cœur n'est pas le pourcentage : ce sont les **perforations** et les **fils détendus**, deux jugements que personne ne fait |
| Un test désactivé n'est pas visible | Deux sources (statut de test, build) et un audit de couverture déclaré plutôt que calculé |

## 29. La vision poussée à l'extrême

- **Le contrat de la release devient lisible.** Une release n'est plus « des tickets fermés » : c'est une trame, dont on sait où elle est trouée et depuis quand.
- **La perforation devient le vrai indicateur de santé.** Une organisation peut afficher 100 % de couverture et n'avoir aucune couverture réelle ; la perforation mesure la **fraîcheur du contrat**, ce qui est la seule mesure qui compte à la veille d'une livraison.
- **Les trous deviennent une file de travail, pas un reproche.** L'app propose le test à écrire ; le coût d'un trou se mesure en jours de risque, pas en points.
- **Les critères deviennent une discipline d'écriture.** Un critère infalsifiable est un critère qui ne sera jamais vérifié : le compteur le rend visible au moment où il est écrit, pas six mois plus tard.
- **Le test devient lisible depuis le critère.** Cliquer sur un critère montre ce qui le vérifie, quand, à quelle force — et ce qui le vérifiait et ne le vérifie plus.
- **Le tissage s'améliore avec l'usage.** Les liaisons confirmées apprennent à reconnaître les liaisons futures ; la suggestion devient plus fine, et reste toujours une proposition.
- **Trame devient la source de vérité de `preuve-a-l-appui`**, `rayon-impact` et `vigie`** : les trois consomment la même mesure au lieu de la recalculer différemment.
- **À terme : le critère devient une unité de contrat vérifiable.** Un critère est une petite spécification testable, chiffrée, qui survit au sprint et se compare d'un trimestre à l'autre — et l'organisation finit par mesurer son travail non pas en tickets, mais en **critères tenus**.

## 30. Liens avec les autres cahiers des charges

- **Fait, preuve à l'appui (`preuve-a-l-appui`)** : Trame est le **fournisseur d'actes de vérification** de la porte de Done ; la grille de force est partagée. Complémentarité, pas doublon : Trame mesure la couverture d'un périmètre, l'autre verrouille une transition.
- **Rayon d'impact (`rayon-impact`)** : Trame fournit le signal « le contrat de la version est-il tenu », distinct des signaux opérationnels (gels, incidents, dépendances).
- **Déjà-vu CI (`deja-vu-ci`)** : même moteur de signature ; les échecs connus alimentent le risque de zone du métré.
- **Délégable ou pas (`delegable-ou-pas`)** : refus de conclure sous un seuil, intervalles de confiance, époques (comparabilité des témoins).
- **Objectifs réels (`vigie`)** : « part des critères prouvés à jour » comme résultat clé de niveau A.
- **Procédures packagées (`gammes`)** : une étape de gamme peut exiger la couverture des critères du ticket ; la trace et la trame se rejoignent.
- **Placard du wiki (`placard-wiki`)** : détecteurs partagés pour écarter secrets et données personnelles des critères et des artefacts.
- **Banc d'essai (`banc`)** : même exigence de preuve, appliquée aux agents ; Trame peut mesurer les critères que les agents écrivent.
- **Problèmes cachés (`problemes-caches`)** : cache par empreinte de contenu, appliqué au recalcul de couverture.

## 31. Sources

- [Codegeist 2026](https://codegeist2026.devpost.com/) et ses [ressources](https://codegeist2026.devpost.com/resources) (bonus Teamwork Graph, agents, MCP, Marketplace)
- [Teamwork Graph : API](https://developer.atlassian.com/platform/teamwork-graph/call-the-teamwork-graph-api/) · [types d'objet, dont `test-plan`, `test-run`, `test-execution`, `test-status`](https://developer.atlassian.com/platform/teamwork-graph/api-reference/object-types/overview/) · [relations](https://developer.atlassian.com/platform/teamwork-graph/api-reference/relationship-types/overview/) · [connecteur](https://developer.atlassian.com/platform/teamwork-graph/build-a-teamwork-graph-connector/)
- [Modules Forge](https://developer.atlassian.com/platform/forge/manifest-reference/modules/) · [limites d'exécution](https://developer.atlassian.com/platform/forge/limits-invocation/) · [LLM hébergé](https://developer.atlassian.com/platform/forge/ai/) · [stockage](https://developer.atlassian.com/platform/forge/storage-api/) · [Forge Realtime](https://developer.atlassian.com/platform/forge/realtime/)
- [API Jira Cloud](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/) · [API Confluence Cloud](https://developer.atlassian.com/cloud/confluence/rest/intro/) · [permissions Forge](https://developer.atlassian.com/platform/forge/manifest-reference/permissions/)
- [Publication d'une app Forge au Marketplace](https://developer.atlassian.com/platform/marketplace/listing-forge-apps/)
- Rapports internes : `inventaire-codegeist/A-github.md`, `D-marche-forge.md`, `E-verif-goals.md` ; corpus `idees-codegeist/TOP-10.md`

## 32. Aller plus loin — la phase 2

La version 1 répond à « quel critère n'a jamais été vérifié ». La phase 2 répond à trois questions de plus : **quel critère ne le sera jamais** (prédiction), **comment le vérifier sans l'écrire à la main** (génération), et **combien de preuve faut-il acheter** (allocation sous contrainte).

### 32.1 La trame inverse

La v1 part du critère et cherche ses vérifications. La v2 part aussi de la vérification et cherche ses critères :

- **tests orphelins** : un test qui ne couvre aucun critère déclaré. Ce n'est pas du travail inutile — c'est souvent une exigence implicite jamais écrite, et la remonter fait écrire le critère manquant ;
- **tests morts** : un test qui couvre un critère supprimé ou reformé ;
- **tests sur-dimensionnés** : trois tests pour un critère trivial, aucun pour le critère de sécurité voisin.

La trame inverse transforme l'outil de mesure en outil de **découverte d'exigences** : le code de test devient une source d'exigences que personne n'a formalisées.

### 32.2 Le tissage prédictif

Au moment où un critère est écrit, l'app prédit s'il finira vérifié, d'après les critères semblables déjà passés (nature, zone du dépôt, taille du ticket, type de critère). Fourchette, effectif, et refus de conclure sous le seuil — comme ailleurs.

L'usage n'est pas de prédire pour prédire : c'est d'**intervenir au seul moment où c'est peu coûteux**, c'est-à-dire à l'écriture. Un critère annoncé « probablement jamais testé » reçoit tout de suite sa proposition de test, avant que le sprint ne démarre.

### 32.3 Le critère compilé

La proposition de test de la v1 est un brouillon textuel. La v2 propose un **squelette de test exécutable** : nom du fichier cohérent avec les conventions du dépôt, structure du test, données de fixture suggérées, et le critère cité en commentaire — avec la mention explicite que c'est un brouillon à relire, jamais un test publié seul.

C'est le même geste que `gammes` fait pour les procédures : compiler du langage naturel en artefact exécutable, avec validation humaine obligatoire.

### 32.4 Le budget de preuve

Un projet ne peut pas tout prouver au niveau maximal. La v2 introduit un **budget de preuve** déclaré (jours, ou nombre de preuves de niveau machine) et l'**alloue** là où le risque est le plus élevé : zone à historique de défauts, critère de sécurité, critère non régressif. L'app montre l'allocation proposée, ce qu'elle couvre, et ce qu'elle laisse en niveau déclaratif — explicitement, pas en silence.

C'est le passage d'un outil de constat à un outil de **décision sous contrainte**, et c'est ce qui le rend utilisable par un responsable de release plutôt que seulement par un QA.

### 32.5 La trame dans le CI

Un pas d'intégration continue qui échoue (ou avertit) quand une pull request modifie une zone dont les critères ne sont pas couverts à jour. La couverture devient un **signal de fusion**, à côté des signaux métier de `merge-avec-contexte` — les deux se complètent sans se recouvrir : l'un regarde le contexte de la release, l'autre le contrat du ticket.

### 32.6 La réparation sémantique

Quand un critère est reformulé et que sa liaison dérivée tombe sous le seuil, la v2 ne se contente pas de signaler la perforation : elle propose la **mise à jour du test** correspondante (diff du test suggéré d'après le diff du critère). La perforation cesse d'être un constat pour devenir un correctif proposé.

### 32.7 La version extrême

Le critère d'acceptation devient l'**unité de contrat vérifiable** de l'organisation : chaque critère a une identité stable, une preuve, une date, un coût de vérification et un historique. Les releases ne se décrivent plus en tickets mais en critères tenus. Les audits ne demandent plus « montrez-moi les tests » mais « montrez-moi la trame », et la réponse est une page datée. À ce stade, l'outil n'améliore plus la qualité : il rend la qualité **négociable et comptable**, ce qui est autre chose.

### 32.8 Ce que ça donne avec les quatre autres

- **`preuve-a-l-appui`** consomme la trame : la porte de Done sait quels critères ont une preuve forte, sans recalculer.
- **`banc`** évalue les agents qui rédigent des critères : un agent dont les critères sont systématiquement infalsifiables est un agent à corriger.
- **`gammes`** peut exiger, pour une étape, que les critères du ticket soient couverts — la trace d'exécution et la trame se rejoignent.
- **`vigie`** reçoit « part des critères prouvés à jour » comme résultat clé de niveau A.
- **`placard-wiki`** fournit les détecteurs : un critère contenant une clé n'est jamais indexé.

### 32.9 Ce que la phase 2 coûterait

Trois à quatre semaines de plus que la v1, et deux paris techniques : la génération de squelettes de test (qualité très dépendante des conventions du dépôt) et le pas de CI (deux apps jumelles si les scopes Bitbucket et Jira ne cohabitent pas). À ne démarrer que si la v1 est déployée et utilisée.
