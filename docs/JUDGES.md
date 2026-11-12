# JUDGES — Trame, guide du jury

> **Trame — the coverage of your acceptance criteria** · *le fil qui manque*
> Codegeist 2026 · catégorie **Apps for Software Teams**
> Guide rédigé le 12 novembre 2026, base `origin/main` @ `b3f8cce`
> (`b3f8cced169c9d10f92f94ee9b72c4930122df12`). Il dit ce qui marche, ce qui ne
> marche pas encore, et pourquoi — chaque chiffre est mesuré.

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
| **n'invente pas** de couverture | Une liaison déduite par similarité reste une proposition avec sa confiance ; elle ne compte que sur la ligne « provisoire » | `src/defaults.ts` (`DERIVED_LINK_THRESHOLD = 0.85`), `tests/domain/coverage.test.ts`, `links.test.ts` |
| **ne déclare pas** un critère vérifiable sans preuve | Artefact, exécution ou référence : sinon le critère est infalsifiable, pas couvert | `static/agent/prompt.md`, `src/domain/falsifiability.ts` |
| **ne note personne** | Aucun score par personne, aucune statistique individuelle | `tests/contract/honesty.test.ts`, `tests/db/persistence.test.ts` |
| **ne garde aucun secret** | Un critère contenant une clé est écarté avant d'être indexé ; le signalement ne contient jamais la valeur | `src/domain/secrets.ts`, `src/collect/index.ts` (`flagSecrets`) |
| **ne réécrit pas** le travail | Aucune proposition n'est appliquée automatiquement : tout passe par une file de validation | `docs/CAHIER-DES-CHARGES.md` §14, `tests/domain/proposals.test.ts` |

## 4. Installer et lancer la démo

### 4.1 Ce qui est jouable aujourd'hui, tout de suite (5 minutes)

```bash
git clone https://github.com/Tradoooo/trame.git
cd trame
npm ci
npm test               # 26 fichiers, 339 tests, tout vert
npm run typecheck      # tsc --noEmit
npm run check:limits   # garde : aucun fichier > 500 lignes
```

Aucun compte Atlassian, aucun réseau, aucune donnée réelle : les tests tournent
sur des doubles en mémoire et des portes injectables (graphe, LLM, horloge).
Le dépôt a été renommé le 12 novembre 2026 : l'adresse canonique est
`github.com/Tradoooo/trame` (l'ancienne, `github.com/BaptisteFaisy/trame`,
redirige vers elle).
Le jeu de données est le projet de démonstration du §26
(`src/sample/demo-project.ts`) : six tickets, vingt-quatre critères, et les
jugements comptés — 3 perforations, 2 trous, 3 tests désactivés, 2 critères
supprimés (voir le détail en §4.2).

### 4.2 Les moteurs de calcul — écrits, mergés, testés

Toute la couche de domaine est sur `origin/main` et testée. Les vingt points de
la recette du §24 : voir [`docs/RECETTE.md`](RECETTE.md). En résumé, 17 des 20
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

### 4.3 Le site public — il existe, sur une branche pas encore mergée

Honnêteté : le site public de démonstration **existe** sur la branche
`origin/lot/l11b-site` (commit `fec1ba8` « Lot L11b : le site public et la
démo vivante »), mais **n'est pas mergé** dans `origin/main`. C'est une VRAIE
page React (`site/src/`, i18n EN/FR) qui branche le **vrai moteur de domaine**
(`site/src/demo/engine.ts` appelle `computeCoverage`, `detectPerforations`,
`detectDangling`, `findHoles` et `buildBulletin` sur `buildDemoProject()`).

Pour la voir :

```bash
git checkout lot/l11b-site && npm ci
npm run site:dev        # Vite sert la page de démonstration localement
```

L'app Forge, elle, **ne tourne pas** dans Jira : les onze écrans répondent
`{ notImplemented: … }` et les quatorze outils MCP aussi. C'est une souche, pas
un bug.

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

Chiffres mesurés au 12 novembre 2026, sur `origin/main` @ `b3f8cce` :

| Mesure | Valeur |
|---|---|
| Fichiers de test | **26** |
| Tests | **339**, tous verts (`npx vitest run`) |
| Fichiers sources TypeScript | 97 (`src/`) |
| Lots mergés | L1 extraction · L2 ingestion · L3 tissage · L4 couverture · L5 perforations/fils · L6 infalsifiables/propositions · L7 métré/zones · L10 certificat (§12.5) · L11 projet de démonstration · L12 docs |
| Lots écrits, non mergés | `origin/lot/l10-triggers` (déclencheurs, consumer, pont signé, JQL) · `origin/lot/l11b-site` (site public + démo vivante) |
| Projet de démonstration §26 | `src/sample/demo-project.ts` — 6 tickets, 24 critères, 14 exécutions, 3 tests désactivés, 2 critères supprimés, 3 perforations, 2 trous |
| Site public | branche `origin/lot/l11b-site` (`fec1ba8`), non mergé |

Ce qui est encore une **souche** (surface écrite, corps vide) : les quatorze
outils MCP et quatre actions internes (`src/actions/*`), les onze écrans
(`src/ui/frontend/index.tsx` affiche un registre de souches), les quatre
fonctions JQL (`src/handlers/jql.ts`), le validateur, le déclencheur, le
consumer et le pont signé (`src/handlers/{events,consumer,scheduled,ingest}.ts`),
le connecteur Confluence (`src/ingest/confluence.ts`) et la génération LLM
(cache/budget réels, contenus `notImplemented`). Les déclencheurs, le consumer
et le pont signé sont déjà écrits et testés sur la branche `origin/lot/l10-triggers`,
pas encore mergée.

## 7. Les questions auxquelles l'app sait répondre

L'app répond **aujourd'hui** par son moteur de domaine (testé), même si les
outils MCP qui exposent ces réponses sont encore des souches. Pour chaque
question : la réponse que le **moteur** sait déjà produire, et le test qui le
prouve.

| # | Question | Ce que le moteur sait déjà répondre | Test qui le prouve |
|---|---|---|---|
| 1 | Quelle part des critères d'un périmètre est couverte, et à quelle force ? | `computeCoverage` décompose en force, liaison et fraîcheur, avec effectif et jamais de pourcentage nu | `tests/domain/coverage.test.ts` (21 tests, `§24.2`, `§24.3`, `§24.7`) |
| 2 | Quels critères ne sont couverts que par une déclaration ? | la force « déclarée » est distinguée de « machine » et « attestée » | `tests/ingest/comments-mapping.test.ts` (`§24.2`), `tests/domain/coverage.test.ts` |
| 3 | Qu'est-ce qui a été percé cette semaine ? | `detectPerforations` liste les critères modifiés après leur test, deux dates et classement | `tests/domain/perforations.test.ts` (14 tests, `§24.4`) |
| 4 | Quels actes ne couvrent plus rien ? | `detectDangling` liste tests désactivés et critères supprimés, avec impact | `tests/domain/dangling.test.ts` (11 tests, `§24.5`, `§24.6`) |
| 5 | Quels sont nos trous les plus risqués, et sur quelles zones ? | `findHoles` + le métré classent les trous et affichent le calcul | `tests/domain/holes.test.ts` (24), `tests/domain/metric.test.ts` (17), `tests/domain/zones.test.ts` (12) |
| 6 | Quels critères sont infalsifiables, comment les réécrire ? | `falsifiability` les compte à part, `proposeReformulation` propose une mesure + un percentile | `tests/domain/falsifiability.test.ts` (20), `tests/domain/proposals.test.ts` (10) |
| 7 | Écris un brouillon de test pour le critère `AC-3` | le brouillon n'est proposé que par la file de validation, jamais appliqué | `tests/domain/proposals.test.ts` ; la génération LLM est en souche |
| 8 | La trame de la release est-elle complète ? Qu'est-ce qui manque ? | `buildBulletin` et le certificat listent perforations, fils détendus et infalsifiables, et déclarent les manques | `tests/domain/bulletin.test.ts` (12, `§24.13`), `tests/domain/certificate.test.ts` (4, `§24.14`) |
| 9 | Ce critère a-t-il changé depuis son dernier test ? | l'empreinte stable + la version du critère rendent la perforation détectable | `tests/collect/fingerprint.test.ts` (10), `tests/domain/perforations.test.ts` |
| 10 | Comment la couverture a-t-elle évolué depuis le sprint précédent ? | le témoin et la chronologie se comparent | `tests/domain/bulletin.test.ts` (`§24.13`) |

**Ce qui est déjà vrai, sans attendre les branches** :

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
  (`tests/contract/no-forge-in-domain.test.ts`).

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