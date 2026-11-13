# JUDGES — Trame, guide du jury

> **Trame — the coverage of your acceptance criteria** · *le fil qui manque*
> Codegeist 2026 · catégorie **Apps for Software Teams**
> Guide rédigé le 13 novembre 2026, base `origin/main` @ `7c468f7`
> (`7c468f7bdb33d9d731b71551e2d30a8e7174e657`). Il dit ce qui marche, ce qui ne
> marche pas encore, et pourquoi — chaque chiffre est mesuré sur cette base.

## 1. Trame en 30 secondes

Chaque critère d'acceptation est un **fil de chaîne**. Chaque acte qui le
vérifie est un **passage de trame**. Trame tisse les deux et regarde ce que
personne ne regarde :

- les **trous** : un critère écrit, jamais vérifié ;
- les **perforations** : un critère modifié **après** sa vérification — la maille
  existe encore, elle ne tient plus ;
- les **fils détendus** : un test désactivé, renommé, ou un critère supprimé —
  ils **font baisser** la couverture affichée ;
- les **critères infalsifiables** : « l'application doit être rapide » —
  comptés à part, jamais comme des trous.

Trame ne bloque rien, n'atteste à la place de personne, n'invente pas de
couverture et ne note personne. Elle montre, elle propose, et elle dit ce
qu'elle ne voit pas.

## 2. Les trois jugements que personne ne fait

| Jugement | Ce que c'est | Pourquoi personne ne le fait |
|---|---|---|
| **La perforation** | Un critère dont l'empreinte a changé **après** la dernière vérification qui le couvrait. Le lien n'a pas bougé, le contrat est rompu. | Il faut conserver l'empreinte du critère **au moment du lien** ; la plupart des outils ne le font pas. |
| **Le fil détendu** | Un acte de vérification qui ne couvre plus rien : test désactivé, renommé, critère supprimé. | Les outils retirent les tests morts de leurs listes, mais ne les retirent pas du **chiffre** : la couverture ne peut alors que monter. |
| **Le critère infalsifiable** | Un critère que rien ne peut vérifier (« rapide », « simple », « agréable »). | On le compte comme couvert, ou on l'ignore. Trame le compte **à part** et propose une reformulation mesurable. |

Les deux premiers sont des jugements **dérivés du temps** : ils n'apparaissent
que quand la couverture change, ce qui est précisément le moment où personne
regarde.

## 3. Ce que l'app ne fait pas

La discipline du cahier des charges (§5, §14) est opposable, et une partie
est vérifiée par des tests :

| L'app ne… | Pourquoi | Où c'est vérifié |
|---|---|---|
| **ne bloque pas** la clôture d'un ticket | Elle montre, elle propose ; la porte de non-régression alerte, elle n'interdit rien | `src/handlers/validator.ts` (`blocking: false`), `src/defaults.ts` |
| **n'atteste pas** à la place d'un humain | Elle refuse d'attribuer un acte à un agent | `static/agent/prompt.md` (règle 7), `src/types.ts` |
| **n'invente pas** de couverture | Une liaison déduite par similarité reste une proposition avec sa confiance ; elle ne compte que sur la ligne « provisoire » | `src/defaults.ts` (`DERIVED_LINK_THRESHOLD = 0.85`), `tests/domain/coverage.test.ts`, `tests/domain/links.test.ts` |
| **ne déclare pas** un critère vérifiable sans preuve | Artefact, exécution ou référence : sinon le critère est infalsifiable, pas couvert | `static/agent/prompt.md`, `src/domain/falsifiability.ts` |
| **ne note personne** | Aucun score par personne, aucune statistique individuelle | `tests/contract/honesty.test.ts`, `tests/db/persistence.test.ts` |
| **ne garde aucun secret** | Un critère contenant une clé est écarté avant d'être indexé ; le signalement ne contient jamais la valeur | `src/domain/secrets.ts`, `src/collect/index.ts` (`flagSecrets`), `tests/domain/secrets.test.ts` |
| **ne réécrit pas** le travail | Aucune proposition n'est appliquée automatiquement : tout passe par une file de validation | `docs/CAHIER-DES-CHARGES.md` §14, `tests/domain/proposals.test.ts` |

### 3.1 Les deux souches qui restent — nommées, assumées

| Souche | Ce qui manque exactement | Ce qui marche déjà autour |
|---|---|---|
| **Entrée UI Kit 2** — `src/ui/frontend/index.tsx` | le rendu **dessiné** des onze écrans : ce fichier rend le registre des clés de resolver, pas les écrans | les onze écrans sont réels **côté serveur** : `src/viewmodel/*.ts` et `src/handlers/*.ts` derrière `src/handlers/resolver.ts`, prouvés par `tests/handlers/screens.test.ts` ; `@forge/react` v10 n'expose pas `render`, la surface UI Kit 2 se branche sur les mêmes clés sans toucher au moteur |
| **Génération LLM** — `src/ingest/llm.ts` | le **texte** rédigé par le modèle : `proposeReformulation` et `draftTest` renvoient la marque `notImplemented`, jamais un faux texte | le cache par empreinte, le budget du jour cumulé en base et le comptage des appels sont réels et testés ; les brouillons servis par l'outil `propose-test` sont déterministes (le critère cité, la forme de vérification attendue, le composant suggéré) |

Deux souches, pas trois. Tout le reste de la surface est **réel** : les onze
écrans du §17 (`src/viewmodel/*.ts`, `src/handlers/*.ts`), les quatorze outils
MCP plus quatre actions internes (`src/actions/*.ts`, `src/handlers/dispatch.ts`,
`tests/contract/entry-points.test.ts`), le déclencheur, le consumer, le
webtrigger signé, les quatre fonctions JQL et le validateur
(`src/handlers/{events,consumer,ingest,jql,scheduled,validator}.ts`).

### 3.2 La limite du Teamwork Graph

Le connecteur du graphe est écrit et testé (`src/ingest/graph.ts`, mapping
`tests/ingest/graph-mapping.test.ts`, sonde `tests/ingest/probe.test.ts`), et le
manifeste demande **dix permissions `read:graph:*`**. Mais les objets `test-*`
du graphe n'ont aujourd'hui **aucune permission publiable** (catalogue de 646
portées) : rien ne peut donc se promettre sur leur lecture chez un client.

La v1 lit les actes **là où ils existent vraiment** : tickets Jira, commits,
fusions, déploiements. Un droit manquant n'est jamais compté comme un trou — la
sonde distingue « pas de droit » (`no-right`), « pas de données » et « pas de
test ».

**Repli déclaré, qui n'est pas une souche** : l'écriture Confluence suit le
repli du §21. La page globale « Weave certificates » existe et s'ouvre, et le
connecteur (`src/ingest/confluence.ts`) rend le vide sans erreur ; le certificat
est produit dans l'app puis exporté à la main, comme le prévoit le cahier des
charges quand l'écriture est impossible.

## 4. Voir l'app tourner

### 4.1 Le site public, tout de suite

**[https://tradoooo.github.io/trame/](https://tradoooo.github.io/trame/)** — une
vraie page React (i18n EN/FR) qui **exécute le vrai moteur** : `site/src/demo/engine.ts`
appelle `computeCoverage`, `detectPerforations`, `detectDangling`, `findHoles` et
`buildBulletin` sur `buildDemoProject()`. Les chiffres affichés sont calculés à
chaque chargement, jamais recopiés — 6 tests de rendu
(`tests/site/demo-render.test.tsx`) et 6 tests de chiffres
(`tests/site/demo-numbers.test.ts`).

### 4.2 L'app Forge, installée

Application publique MIT : **[github.com/Tradoooo/trame](https://github.com/Tradoooo/trame)**.
L'app déployée est `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51`,
version **2.1.0** en environnement `development`, installée sur
**`one-atlas-cndz.atlassian.net`**, en Jira **et** en Confluence. `forge lint` :
**0 erreur, 5 avertissements**.

| Où | Ce que le juge trouve |
|---|---|
| **Jira** | page globale « Trame » (les onze clés de resolver du §17), panneau « Criteria » sur la fiche d'un ticket, trois champs en lecture seule (`Trame`, `Holes`, `Perforations`), gadget « Weave bulletin », validateur de clôture (alerte, ne bloque pas), quatre fonctions JQL : `holes()`, `perforated()`, `dangling()`, `uncovered()` |
| **Confluence** | page globale « Weave certificates » (route `weave-certificates`) : le certificat opposable de la version |
| **Rovo** | l'agent « Le fil » et les quatorze outils du §16, exposés par `rovo:mcp` |

Ce que le juge verra **et** ce qu'il ne verra pas : les modules existent, sont
câblés et répondent ; mais les pages Jira et Confluence affichent encore le
registre des clés, pas les écrans dessinés (souche §3.1). Les données, elles,
sont bien là derrière chaque clé : c'est la seule surface qui reste à habiller,
et elle est nommée.

### 4.3 En local, cinq minutes

```bash
git clone https://github.com/Tradoooo/trame.git
cd trame
npm ci
npm test               # 49 fichiers, 428 tests, tout vert
npm run typecheck      # tsc --noEmit
npm run check:limits   # garde : aucun fichier > 500 lignes
npm run site:dev       # la démo du site, servie par Vite
```

**La réserve honnête** : ces tests tournent sur des doubles en mémoire
(`tests/helpers/` : store, passerelles, scénario) et des portes injectables
(graphe, LLM, horloge fixe). Aucun compte Atlassian, aucun réseau, aucune donnée
réelle — les 428 tests prouvent le comportement du code, pas la lecture d'un
vrai site client.

Le dépôt a changé d'organisation : l'adresse canonique est
`github.com/Tradoooo/trame`, l'ancienne redirige vers elle.

Le jeu de données est le projet de démonstration du §26
(`src/sample/demo-project.ts`) : six tickets, vingt-quatre critères dont quatre
infalsifiables, quatorze exécutions, trois tests désactivés, deux critères
supprimés. Passé dans le moteur, il donne exactement **3 perforations,
2 fils détendus et 4 trous** — deux critères n'ont jamais été vérifiés, deux
autres ont perdu leur seule vérification quand leur test a été désactivé.

### 4.4 Les moteurs de calcul — écrits, mergés, testés

Toute la couche de domaine est sur `origin/main` et testée. Les vingt points
de la recette du §24 : voir [`docs/RECETTE.md`](RECETTE.md). En résumé, 17 des 20
points ont leur test nominatif et il passe ; 3 points (§24.1, §24.18, §24.19)
n'ont pas encore de test nominatif.

Quelques comptages mesurés, fichier par fichier :

```bash
npx vitest run tests/domain/coverage.test.ts       # 21 tests
npx vitest run tests/domain/perforations.test.ts   # 14 tests
npx vitest run tests/domain/holes.test.ts          # 24 tests
npx vitest run tests/domain/certificate.test.ts    # 4 tests
npx vitest run tests/sample/demo-project.test.ts   # 10 tests
```

## 5. Où trouver la recette

- **[docs/RECETTE.md](RECETTE.md)** — les vingt points du §24, un par un : ce que
  le point vérifie, la **commande exacte**, le fichier de test, et l'état réel ;
- **[docs/VIDEO-SCRIPT.md](VIDEO-SCRIPT.md)** — le scénario de la vidéo, minuté,
  et les captures à tourner ;
- **[docs/SUBMISSION.md](SUBMISSION.md)** — la fiche de soumission ;
- **[README.md](../README.md)** — l'idée, le vocabulaire, l'architecture, l'état
  du chantier ;
- **[docs/CAHIER-DES-CHARGES.md](CAHIER-DES-CHARGES.md)** — la spécification
  complète ; les §24, §25, §26 et §27 sont ceux qui vous concernent.

## 6. Ce que le dépôt contient aujourd'hui

Chiffres mesurés au 13 novembre 2026, sur `origin/main` @ `7c468f7` :

| Mesure | Valeur |
|---|---|
| Fichiers de test | **49** |
| Tests | **428**, tous verts (`npx vitest run`) |
| Fichiers sources TypeScript | 113 dans `src/` (112 `.ts` + 1 `.tsx`), 26 dans `site/` |
| Écrans du §17 | les **11** sont réels : view-models `src/viewmodel/*.ts`, handlers `src/handlers/*.ts`, registre `src/handlers/resolver.ts` — `tests/handlers/screens.test.ts` |
| Outils du §16 | les **14** sont réels, plus 4 actions internes : `src/actions/*.ts`, `src/handlers/dispatch.ts` — `tests/contract/entry-points.test.ts` |
| Points d'entrée Forge | déclencheur, consumer, webtrigger, 4 fonctions JQL, validateur : `src/handlers/{events,consumer,ingest,jql,scheduled,validator}.ts` |
| Lots | L1 à L12 mergés sur `main` (extraction, ingestion, tissage, couverture, perforations/fils, infalsifiables/propositions, métré/zones, outils/agent, écrans, certificat et déclencheurs, site public et démo, docs de soumission) |
| Projet de démonstration §26 | `src/sample/demo-project.ts` — 6 tickets, 24 critères, 14 exécutions, 3 tests désactivés, 2 critères supprimés → 3 perforations, 2 fils détendus, 4 trous |
| Site public | `site/**`, publié par `.github/workflows/site.yml` sur GitHub Pages |
| App Forge | ARI `5faa12e1-3a13-4d3c-977e-da1ad6931a51`, v2.1.0 dev, installée sur `one-atlas-cndz.atlassian.net` (Jira et Confluence) |
| CI | runner `r630-trame-01` en ligne, file de merge Mergify active, agent de conflits hermes/InferHub éprouvé (PR #19 et #21) |

## 7. Les questions auxquelles l'app sait répondre

Les quatorze outils MCP sont réels : chaque question ci-dessous a **son outil**
(`src/actions/*.ts`) et **son test**. Pour chaque question : ce que l'app
répond, et le test qui le prouve.

| # | Question | Ce que l'app répond | Test qui le prouve |
|---|---|---|---|
| 1 | Quelle part des critères d'un périmètre est couverte, et à quelle force ? | `get-coverage` décompose en force, liaison et fraîcheur, avec effectif et jamais de pourcentage nu | `tests/domain/coverage.test.ts` (21 tests, `§24.2`, `§24.3`, `§24.7`), `tests/actions/get-coverage.test.ts` |
| 2 | Quels critères ne sont couverts que par une déclaration ? | la force « déclarée » est distinguée de « machine » et « attestée » | `tests/ingest/comments-mapping.test.ts` (`§24.2`), `tests/domain/coverage.test.ts` |
| 3 | Qu'est-ce qui a été percé cette semaine ? | `list-perforations` liste les critères modifiés après leur test, deux dates et classement | `tests/domain/perforations.test.ts` (14 tests, `§24.4`), `tests/actions/list-perforations.test.ts` |
| 4 | Quels actes ne couvrent plus rien ? | `list-dangling` liste tests désactivés et critères supprimés, avec impact | `tests/domain/dangling.test.ts` (11 tests, `§24.5`, `§24.6`), `tests/actions/list-dangling.test.ts` |
| 5 | Quels sont nos trous les plus risqués, et sur quelles zones ? | `list-holes` et `get-zones-risk` classent les trous et affichent le calcul | `tests/domain/holes.test.ts` (24), `tests/domain/metric.test.ts` (17), `tests/domain/zones.test.ts` (12) |
| 6 | Quels critères sont infalsifiables, comment les réécrire ? | `list-unverifiable` les compte à part, `propose-reformulation` propose une mesure et un percentile | `tests/domain/falsifiability.test.ts` (20), `tests/domain/proposals.test.ts` (10) |
| 7 | Écris un brouillon de test pour le critère `AC-3` | `propose-test` produit un brouillon réel (critère cité, forme attendue, zone) et le met en file de validation, jamais appliqué ; seule la rédaction par LLM reste en souche | `tests/actions/propose-test.test.ts`, `tests/domain/proposals.test.ts` |
| 8 | La trame de la release est-elle complète ? Qu'est-ce qui manque ? | `get-bulletin` et `get-certificate` listent perforations, fils détendus et infalsifiables, et déclarent les manques | `tests/domain/bulletin.test.ts` (12, `§24.13`), `tests/domain/certificate.test.ts` (4, `§24.14`) |
| 9 | Ce critère a-t-il changé depuis son dernier test ? | `get-criterion` s'appuie sur l'empreinte stable et la version du critère | `tests/collect/fingerprint.test.ts` (10), `tests/domain/perforations.test.ts` |
| 10 | Comment la couverture a-t-elle évolué depuis le sprint précédent ? | `get-coverage-timeline` compare les témoins successifs | `tests/domain/bulletin.test.ts` (`§24.13`), `tests/actions/get-coverage-timeline.test.ts` |

**Ce qui est déjà vrai sur `main`, et testé** :

- l'empreinte d'un critère est stable, insensible à la casse, à la ponctuation
  de liste et aux équivalences Unicode, et sensible au sens — 10 tests verts
  (`tests/collect/fingerprint.test.ts`) ;
- l'extraction multi-origine (§6) est réelle : six origines, dédoublonnage,
  renumérotation `AC-n`, secrets signalés — 27 tests verts
  (`tests/collect/extraction.test.ts`) ;
- les trois connecteurs d'actes réels sont câblés avec un transport injectable :
  graphe (`src/ingest/graph.ts`, `api.asUser().requestTeamworkGraph`), Bitbucket
  (`src/ingest/bitbucket.ts`), commentaires (`src/ingest/comments.ts`) et pipeline
  signé (`src/ingest/pipeline.ts`) — 15 + 21 + 11 + 9 tests verts ;
- les onze écrans répondent des données, aucun ne renvoie plus de souche —
  3 tests verts (`tests/handlers/screens.test.ts`) ; les déclencheurs, le
  consumer, le webtrigger et les quatre JQL en comptent 14
  (`tests/handlers/triggers.test.ts`) ;
- les dix-huit actions (quatorze outils et quatre actions internes) sont
  couvertes une par une — 18 fichiers, 55 tests (`tests/actions/*.test.ts`), et
  le contrat d'entrée refuse une clé inconnue ;
- le schéma Forge SQL tient les quinze tables du §19, sans aucune statistique
  par personne — 13 tests verts (`tests/db/persistence.test.ts`) ;
- le budget LLM du jour est cumulé en base et le cache par empreinte est câblé
  (`src/ingest/llm.ts`) : un appel, même en souche, reste un appel compté ;
- les quatorze outils du §16 sont exactement les quatorze exposés par
  `rovo:mcp`, et les quatre actions internes ne sont pas exposées à Rovo —
  5 tests verts (`tests/contract/entry-points.test.ts`) ;
- un secret détecté n'est jamais recopié dans un signalement — 18 tests verts
  (`tests/domain/secrets.test.ts`) ;
- le domaine n'importe jamais `@forge/*` — 3 tests verts
  (`tests/contract/no-forge-in-domain.test.ts`) ;
- la démo du site affiche les chiffres du moteur, pas des valeurs recopiées —
  12 tests verts (`tests/site/*`).

## 8. Trois questions que les jurés poseront, et la réponse

- **« Est-ce que c'est juste un dashboard de couverture de tests ? »** Non : le
  pourcentage n'est pas le produit. Le produit, ce sont les **perforations**
  (un critère changé après sa vérification) et les **fils détendus** (un acte
  mort qui fait baisser le chiffre) — deux jugements que le tableau de bord
  classique ne fait pas.
- **« Ça ne va pas devenir un classement par personne ? »** Non : aucun écran,
  aucun export, aucun outil ne contient de statistique par personne ; c'est
  vérifié par des tests sur les types et le schéma.
- **« Et si le Teamwork Graph n'est pas accessible chez nous ? »** L'app le
  dit : la sonde du port graphe distingue « pas de droit » (`no-right`), « pas
  de données » et « pas de test », et un droit manquant n'est jamais compté
  comme un trou — testé dans `tests/ingest/probe.test.ts` (`§24.15`).