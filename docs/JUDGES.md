# JUDGES — Trame, guide du jury

> **Trame — the coverage of your acceptance criteria** · *le fil qui manque*
> Codegeist 2026 · catégorie **Apps for Software Teams**
> Guide écrit le 12 novembre 2026, sur la branche `lot/l12-docs`
> (base `origin/main` @ `8f2acb8`). Il dit ce qui marche, ce qui ne marche
> pas encore, et pourquoi.

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
| **ne bloque pas** la clôture d'un ticket | Elle montre, elle propose ; la porte de non-régression est optionnelle et signale, elle n'interdit rien | `src/handlers/validator.ts` (`blocking: false`), `src/defaults.ts` |
| **n'atteste pas** à la place d'un humain | Elle enregistre qui a fait quoi pour l'audit ; elle refuse d'attribuer un acte à un agent | `static/agent/prompt.md` (règle 7), `src/types.ts` (`actorRef` : l'acteur d'un acte, jamais l'auteur d'une couverture) |
| **n'invente pas** de couverture | Une liaison déduite par similarité reste une proposition avec sa confiance ; elle ne compte que sur la ligne « provisoire » | `src/defaults.ts` (`DERIVED_LINK_THRESHOLD = 0.85`), `tests/contract/honesty.test.ts` |
| **ne déclare pas** un critère vérifiable sans preuve | Artefact, exécution ou référence : sinon le critère est infalsifiable, pas couvert | `static/agent/prompt.md` (règle 4), `src/ingest/llm.ts` (les contenus générés renvoient `notImplemented`, jamais un texte qui aurait l'air généré) |
| **ne note personne** | Aucun score par personne, aucune statistique individuelle ; les acteurs ne sont nommés que dans la piste d'audit d'un critère | `tests/contract/honesty.test.ts` (« no ranking of people »), `tests/db/persistence.test.ts` (« ne stocke aucune statistique par personne ») |
| **ne garde aucun secret** | Un critère ou un artefact contenant une clé est signalé avant d'être indexé ; le signalement ne contient jamais la valeur | `src/domain/secrets.ts`, `tests/domain/secrets.test.ts` (18 tests) |
| **ne réécrit pas** le travail | Aucune proposition n'est appliquée automatiquement : tout passe par une file de validation | `docs/CAHIER-DES-CHARGES.md` §14 |

## 4. Installer et lancer la démo

### 4.1 Ce qui est jouable aujourd'hui, tout de suite (5 minutes)

```bash
git clone https://github.com/BaptisteFaisy/trame.git
cd trame
npm ci
npm test               # 8 fichiers, 77 tests, tout vert (~4 s)
npm run typecheck      # tsc --noEmit
npm run check:limits   # aucun fichier > 500 lignes
```

Aucun compte Atlassian, aucun réseau, aucune donnée réelle : les tests
tournent sur des doubles en mémoire et une horloge figée au
`2026-11-12T09:00:00.000Z`. Le jeu de données est le scénario `TRAME-1`
(`tests/helpers/scenario.ts`) : un ticket, quatre critères, quatre actes de
vérification, six liaisons — dont un test désactivé, un critère perforé, un
critère infalsifiable et deux liaisons dérivées (0,91 et 0,62).

### 4.2 Les deux moteurs de calcul, déjà écrits et testés (en revue)

Le calcul de couverture et la détection des perforations sont écrits et
verts sur deux branches publiques, pas encore mergées :

```bash
git checkout lot/l4-couverture && npm ci && npm test   # 110 tests, dont 5 verts sous -t '§24.3'
git checkout lot/l5-perforations && npm ci && npm test  # 102 tests, dont 7 verts sous -t '§24.4'
```

### 4.3 La démo déployée — ce qui manque aujourd'hui

Honnêteté : **la démo en ligne n'existe pas encore au 12 novembre 2026**. Le
plan est le suivant, et il est daté (§27) :

| Jalon | Date | Ce qui sera jouable |
|---|---|---|
| gel des fonctionnalités | 15 décembre 2026 | écrans, outils MCP, agent, certificat |
| jeu de démonstration semé | 16 – 22 décembre 2026 | projet de 6 tickets, 24 critères, 14 exécutions (lot L11) |
| site public de démonstration | 16 – 22 décembre 2026 | `npm run site:dev` (`site/` n'existe pas encore) |
| déploiement de l'app Forge | 16 – 22 décembre 2026 | `forge deploy` puis `forge install` sur le site de développement |

En attendant, l'app **ne tourne pas** dans Jira : les onze écrans et les
quatorze outils répondent honnêtement `{ notImplemented: … }`. C'est une
souche, pas un bug.

## 5. Où trouver la recette

- **[docs/RECETTE.md](RECETTE.md)** — les vingt points du §24, un par un : ce que
  le point vérifie, la **commande exacte**, le fichier de test, et l'état réel
  (vert / vert sur une branche / en souche / à écrire) ;
- **[docs/VIDEO-SCRIPT.md](VIDEO-SCRIPT.md)** — le scénario de la vidéo, minuté,
  et la liste des quatre captures à tourner ;
- **[docs/SUBMISSION.md](SUBMISSION.md)** — la fiche de soumission ;
- **[README.md](../README.md)** — l'idée, le vocabulaire, l'architecture, l'état
  du chantier ;
- **[docs/CAHIER-DES-CHARGES.md](CAHIER-DES-CHARGES.md)** — la spécification
  complète ; les §24, §25, §26 et §27 sont ceux qui vous concernent ;
- **[docs/CONTRACTS.md](CONTRACTS.md)** — les contrats gelés et la carte des
  lots ; **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** — les couches et le flux
  de données.

## 6. Les dix questions que l'app sait répondre

Réponse honnête pour chacune : ce que l'app répond **aujourd'hui**, et le lot
qui livre la réponse complète.

| # | Question | Outil | Réponse honnête aujourd'hui | Lot |
|---|---|---|---|---|
| 1 | Quelle part des critères d'un périmètre est couverte, et à quelle force ? | `get-coverage` | L'outil est déclaré (module `rovo:mcp`, action `get-coverage`) et répond sans erreur, mais son corps renvoie `{ notImplemented: 'get-coverage' }`. **L'algorithme existe** sur `lot/l4-couverture` (`computeCoverage`, 21 tests dans `tests/domain/coverage.test.ts`) : il n'est pas encore branché sur l'outil. | L8 (branchement), L4 (déjà écrit) |
| 2 | Quels critères ne sont couverts que par une déclaration ? | `get-coverage` (mode `declared-only`) | Idem question 1. La question elle-même est déjà écrite dans le prompt de l'agent (`static/agent/prompt.md`) et dans les conversation starters du manifeste. | L8 |
| 3 | Qu'est-ce qui a été percé cette semaine : un critère a-t-il changé après son test ? | `list-perforations` | L'algorithme est écrit et testé (`lot/l5-perforations`, 7 tests verts sous le filtre `-t '§24.4'`) ; l'outil renvoie `notImplemented`. | L8 (branchement), L5 (déjà écrit) |
| 4 | Quels actes de vérification ne couvrent plus rien ? | `list-dangling` | Idem question 3, avec les fils détachés (`§24.5`, `§24.6` testés sur L5). | L8, L5 |
| 5 | Quels sont nos trous les plus risqués, et sur quelles zones ? | `list-holes`, `get-zones-risk` | Le métré (type de critère, zone à risque, récurrence) est en cours sur `lot/l7-metre` (code non commité) ; les poids sont déjà gelés et testés sur `main`. | L7, L8 |
| 6 | Quel pourcentage de nos critères est infalsifiable, et comment les réécrire ? | `list-unverifiable`, `propose-reformulation` | La détection est en cours sur `lot/l6-falsifiables` ; les marqueurs sont déjà figés (`UNFALSIFIABLE_MARKERS`). Le contenu généré par le LLM renvoie aujourd'hui `notImplemented` — jamais un texte qui aurait l'air généré. | L6, L8 |
| 7 | Écris un brouillon de test pour le critère `AC-3` de `TRAME-412`. | `propose-test` | Le gateway LLM est réel (cache par empreinte, budget quotidien tenu et compté), mais `draftTest` renvoie `{ title: '', body: 'notImplemented' }`. | L8 |
| 8 | La trame de la release est-elle complète ? Qu'est-ce qui manque ? | `get-bulletin`, `get-certificate` | Le bulletin existe et est testé (`lot/l4-couverture`, 4 tests verts sous le filtre `-t '§24.13'`) ; **le certificat de trame n'est pas écrit** (lot L10), et la page Confluence est déclarée dans le manifeste mais son corps est une souche. | L10, L8 |
| 9 | Ce critère a-t-il changé depuis son dernier test ? Quelles preuves a-t-il ? | `get-criterion` | L'outil répond `notImplemented`. Les briques existent : empreinte stable (`src/collect/fingerprint.ts`), versions de critère en base (`criterion_version`), piste d'audit. | L8 |
| 10 | Comment la couverture a-t-elle évolué depuis le sprint précédent ? | `get-coverage-timeline` | La lecture du temps existe (`src/domain/timeline.ts`, `witness.ts` sur L4) ; l'outil répond `notImplemented`. | L8, L4 |

**Ce qui est déjà vrai, sans attendre les lots** :

- l'empreinte d'un critère est stable, insensible à la casse, à la ponctuation
  de liste et aux équivalences Unicode, et sensible au sens — 10 tests verts
  (`tests/collect/fingerprint.test.ts`) ;
- le schéma Forge SQL tient les quinze tables du §19, sans aucune statistique
  par personne, et les mappings aller-retour sont testés — 13 tests verts
  (`tests/db/persistence.test.ts`) ;
- le budget LLM du jour est cumulé en base (`store.addBudget`), et le cache par
  empreinte est câblé dans le gateway (`src/ingest/llm.ts`) : un appel même en
  souche reste un appel compté ;
- les quatorze outils du §16 sont exactement les quatorze exposés par
  `rovo:mcp`, et les quatre actions internes ne sont pas exposées à Rovo —
  5 tests verts (`tests/contract/entry-points.test.ts`) ;
- un secret détecté n'est jamais recopié dans un signalement — 18 tests verts
  (`tests/domain/secrets.test.ts`) ;
- la skill `before-closing-a-ticket` est publiée en source ouverte dans le
  dépôt (`static/skill/before-closing-a-ticket/SKILL.md`) : elle dit exactement
  quoi demander avant de fermer un ticket.

## 7. Trois questions que les jurés poseront, et la réponse

- **« Est-ce que c'est juste un dashboard de couverture de tests ? »** Non : le
  pourcentage n'est pas le produit. Le produit, ce sont les **perforations**
  (un critère changé après sa vérification) et les **fils détendus** (un acte
  mort qui fait baisser le chiffre) — deux jugements que le tableau de bord
  classique ne fait pas.
- **« Ça ne va pas devenir un classement par personne ? »** Non : aucun écran,
  aucun export, aucun outil ne contient de statistique par personne ; c'est
  vérifié par des tests sur les types, le schéma et les dictionnaires.
- **« Et si le Teamwork Graph n'est pas accessible chez nous ? »** L'app le
  dit : elle distingue « pas de droit », « pas de données », « pas de test » et
  « pas de critère », et un droit manquant n'est jamais compté comme un trou.
  Aujourd'hui, cette distinction existe dans la sonde du port graphe
  (`src/ingest/graph.ts` répond `no-right`) et dans le moteur de couverture de
  la branche L4 ; l'écran de couverture lui-même est une souche.
