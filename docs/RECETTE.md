# RECETTE — Trame

> Les vingt points de la recette du §24 du cahier des charges, un par un :
> ce que le point vérifie, la **commande exacte** qui le lance, le fichier de
> test, et son **état réel au 12 novembre 2026**.
> Base de la rédaction : `origin/main` @ `8f2acb8` (12 novembre 2026).
> Aucun point n'est déclaré vert sans un test que j'ai lancé.

## 0. Comment lire ce document

Quatre états, et rien d'autre :

| État | Signification |
|---|---|
| `vert` | un test nommé d'après le point passe aujourd'hui sur `origin/main` |
| `vert (branche)` | le test existe et passe sur une branche de lot **pas encore mergée** (`origin/lot/l4-couverture`, `origin/lot/l5-perforations`) |
| `en souche` | le point d'entrée existe mais renvoie une souche (`{ notImplemented: … }` ou `[]`) : l'algorithme n'est pas écrit |
| `à écrire` | ni le test ni l'implémentation n'existent |

Les commandes qui visent une branche s'écrivent
`(branche lot/lX-…) npx vitest …` : on se place d'abord sur la branche
(dans un clone frais : `git checkout lot/l4-couverture && npm ci`), puis on
lance la commande. Les commandes sans mention de branche tournent sur
`origin/main`.

Deux limites que « vert » ne dit pas :

1. un test vert prouve un **algorithme**, pas un **écran** : les onze écrans
   (§17) sont des souches aujourd'hui, donc les gestes manuels décrits plus
   bas sont le **plan de recette**, pas une manipulation possible en l'état ;
2. les tests tournent sur des doubles en mémoire (`tests/helpers/`) et une
   horloge figée (`TODAY = 2026-11-12T09:00:00.000Z`) : aucun réseau, aucun
   compte Atlassian, aucune donnée réelle.

État de l'arbre au moment de la rédaction (chiffres mesurés) :

| Arbre | Fichiers de test | Tests | `npx vitest run` |
|---|---|---|---|
| `origin/main` | 8 | 77 | 8 fichiers, 77 tests verts (~4 s) |
| `origin/lot/l4-couverture` | 10 | 110 | 10 fichiers, 110 tests verts |
| `origin/lot/l5-perforations` | 10 | 102 | 10 fichiers, 102 tests verts |
| `lot/l1-extraction`, `lot/l2-ingestion`, `lot/l6-falsifiables`, `lot/l7-metre` | branches créées | — | code écrit mais **non commité** |
| `lot/l3-tissage` | branche créée | — | rien d'écrit pour l'instant |
| L8 (outils), L9 (écrans), L10 (certificat, déclencheurs), L11 (site, jeu de démo) | — | — | non commencés |

## 1. Marche à suivre pour un jury (5 minutes)

### 1.1 Ce qu'il faut installer

| Outil | Version | Pourquoi | Obligatoire ? |
|---|---|---|---|
| Node.js | 20 ou plus (comme l'annonce le README) | tests, build | oui |
| npm | celui de Node 20 | installation des dépendances | oui |
| CLI Forge (`npm i -g @forge/cli`) | dernière | `forge lint`, `forge deploy` | non pour la recette, oui pour la démo |
| navigateur | — | la démo n'est pas déployée à ce jour | non |

### 1.2 Ce qu'il faut lancer, dans cet ordre

```bash
git clone https://github.com/BaptisteFaisy/trame.git
cd trame
npm ci                 # dépendances (node_modules n'est pas versionné)
npm test               # vitest run — 8 fichiers, 77 tests, ~4 s
npm run typecheck      # tsc --noEmit
npm run check:limits   # garde : aucun fichier de plus de 500 lignes
```

Si `npm ci` échoue (réseau, cache vide), `npm install` fait le même travail ;
`npm test` ne télécharge rien de plus.

### 1.3 Les vérifications, minute par minute

| Minute | Vérification | Commande | Résultat attendu (mesuré) |
|---|---|---|---|
| 0:00 | la suite passe | `npm test` | `Test Files 8 passed (8)` · `Tests 77 passed (77)` |
| 0:30 | les types passent | `npm run typecheck` | aucune sortie, code 0 |
| 1:00 | la garde de taille passe | `npm run check:limits` | `OK : tous les fichiers tiennent dans la limite.` |
| 1:30 | les quatorze outils existent | `npx vitest run tests/contract/entry-points.test.ts` | 5 tests verts, dont « expose exactly the fourteen MCP tools of §16 » |
| 2:30 | les chiffres ne sont jamais nus | `npx vitest run tests/contract/honesty.test.ts` | 10 tests verts, dont « carries a denominator on every coverage figure » |
| 3:30 | le détecteur de secrets ne dit jamais la valeur | `npx vitest run tests/domain/secrets.test.ts` | 18 tests verts |
| 4:00 | le schéma ne stocke aucune statistique par personne | `npx vitest run tests/db/persistence.test.ts` | 13 tests verts, dont « ne stocke aucune statistique par personne (§5) » |
| 4:30 | le store et le scénario de démonstration | `npx vitest run tests/contract/store.test.ts` | 12 tests verts |

**Ce que ces huit minutes prouvent** : le socle est honnête — les contrats,
la persistance, l'empreinte, le budget LLM, la liste des quatorze outils et
la discipline d'honnêteté sont vérifiés par des tests. **Ce qu'elles ne
prouvent pas** : le calcul de couverture, les écrans et la lecture du graphe
Teamwork Graph ne sont pas encore écrits (voir §2).

### 1.4 Voir les deux moteurs de calcul en cours de revue

Les moteurs de couverture (L4) et de perforations (L5) sont sur des branches
publiques, en revue, pas encore mergées. Pour les lire :

```bash
git clone https://github.com/BaptisteFaisy/trame.git && cd trame
git checkout lot/l4-couverture && npm ci && npm test   # 10 fichiers, 110 tests
git checkout lot/l5-perforations && npm ci && npm test  # 10 fichiers, 102 tests
```

## 2. Les vingt points, un par un

Résumé (le détail est sous chaque point) :

| # | Ce que le point vérifie | Où ça se trouve | État |
|---|---|---|---|
| 1 | couverture avec effectif et force par critère | `src/domain/coverage.ts` (branche L4) | à écrire |
| 2 | force selon la forme de l'acte | `tests/contract/honesty.test.ts` + L4 | vert (branche) |
| 3 | les trois axes ne sont jamais fusionnés | `tests/domain/coverage.test.ts` (L4) | vert (branche) |
| 4 | perforation : les deux dates et le classement | `tests/domain/perforations.test.ts` (L5) | vert (branche) |
| 5 | un test désactivé retire sa couverture | `tests/domain/dangling.test.ts` (L5) | vert (branche) |
| 6 | un critère supprimé fait un fil détendu | `tests/domain/dangling.test.ts` (L5) | vert (branche) |
| 7 | une liaison dérivée reste provisoire | `tests/domain/coverage.test.ts` (L4) | vert (branche) |
| 8 | une liaison confirmée devient déclarée | — | à écrire |
| 9 | une liaison rejetée affaiblit la suivante | — | à écrire |
| 10 | infalsifiable compté à part, reformulation | `src/domain/falsifiability.ts` (L6, non commité) | à écrire |
| 11 | le trou est priorisé, le calcul est affiché | `src/domain/metric.ts` (L7, non commité) | à écrire |
| 12 | la zone à risque remonte le classement | `src/domain/zones.ts` (L7, non commité) | à écrire |
| 13 | bulletin daté, comparable au témoin | `tests/domain/bulletin.test.ts` (L4) | vert (branche) |
| 14 | le certificat déclare ce qui n'est pas couvert | `src/domain/certificate.ts` (L10) | à écrire |
| 15 | un droit manquant n'est pas un trou | `tests/domain/coverage.test.ts` (L4) | vert (branche) |
| 16 | aucun critère écrit ≠ « 0 % » | `tests/domain/coverage.test.ts` (L4) | vert (branche) |
| 17 | la convention de nommage est déterministe | `src/domain/links.ts` (L3) | à écrire |
| 18 | le cache par empreinte ne recalcule que ce qui change | `src/collect/fingerprint.ts`, `src/ingest/llm.ts` | `en souche` (le cache existe, le recalcul des liaisons n'existe pas) |
| 19 | aucune statistique par personne | `tests/contract/honesty.test.ts`, `tests/db/persistence.test.ts` | vert |
| 20 | un critère avec une clé n'est pas indexé | `src/domain/secrets.ts` | `vert` (scan) / `en souche` (indexation) |

### 1. Couverture avec effectif et force par critère

- **Vérifie** : un ticket à trois critères et deux tests exécutés affiche une
  couverture qui porte l'effectif (combien de critères couverts sur combien)
  et la force de chaque couverture.
- **Lancer** : `npx vitest run tests/domain/coverage.test.ts -t '§24.1'`
  — le fichier n'existe pas sur `main` (`No test files found, exiting with code 1`).
- **Où** : l'algorithme est écrit sur la branche L4 (`computeCoverage`,
  `src/domain/coverage.ts`) ; le dénominateur y est testé sous un autre nom
  (« §8.1 — le dénominateur compte les critères vérifiables seulement »).
- **État** : `à écrire` — le test qui porte le numéro du point manque.

### 2. La force suit la forme de l'acte de vérification

- **Vérifie** : un test automatisé exécuté est compté « machine », une
  attestation « attestée », un commentaire « déclarée ».
- **Lancer** : `(branche `lot/l4-couverture`) `npx vitest run tests/domain/coverage.test.ts -t '§24.2'`
  → 4 tests verts. Sur `main`, le contrat de force est déjà vérifié :
  `npx vitest run tests/contract/honesty.test.ts -t 'gives the seven forms their default strength'` → vert.
- **Où** : `src/defaults.ts` (`DEFAULT_STRENGTH_BY_FORM`, `STRENGTH_RANK`),
  `tests/contract/honesty.test.ts`, `tests/domain/coverage.test.ts` (L4).
- **État** : `vert (branche)` pour le calcul, `vert` sur `main` pour le contrat.

### 3. Les trois axes sont décomposés et jamais fusionnés

- **Vérifie** : force, type de liaison et fraîcheur sont trois lignes
  distinctes ; la provisoire n'entre pas dans la déclarée.
- **Lancer** : `(branche `lot/l4-couverture`) `npx vitest run tests/domain/coverage.test.ts -t '§24.3'`
  → 5 tests verts.
- **Où** : `tests/domain/coverage.test.ts` (L4), `src/domain/coverage.ts`.
- **État** : `vert (branche)`.

### 4. Une perforation porte ses deux dates et son classement

- **Vérifie** : un critère modifié après son test est listé en perforation avec
  la date du critère et la date de la vérification, classé fraîche (< 7 j),
  sèche (> 30 j) ou multiple (3 changements).
- **Lancer** : `(branche `lot/l5-perforations`) `npx vitest run tests/domain/perforations.test.ts -t '§24.4'`
  → 7 tests verts.
- **Où** : `tests/domain/perforations.test.ts` (L5), `src/domain/perforations.ts`.
- **État** : `vert (branche)`.

### 5. Un test désactivé fait disparaître sa couverture

- **Vérifie** : la couverture affichée baisse quand un test est ignoré ; le fil
  détendu est listé avec son impact chiffré.
- **Lancer** : `(branche `lot/l5-perforations`) `npx vitest run tests/domain/dangling.test.ts -t '§24.5'`
  → 3 tests verts ; côté calcul de couverture :
  `(branche `lot/l4-couverture`) `npx vitest run tests/domain/coverage.test.ts -t '§24.5'` → vert.
- **Où** : `tests/domain/dangling.test.ts` (L5), `tests/domain/coverage.test.ts` (L4).
- **État** : `vert (branche)`.

### 6. Un critère supprimé fait apparaître un fil détendu

- **Vérifie** : le critère supprimé produit un fil détendu avec sa raison ; il ne
  retire que sa propre maille.
- **Lancer** : `(branche `lot/l5-perforations`) `npx vitest run tests/domain/dangling.test.ts -t '§24.6'`
  → 2 tests verts.
- **Où** : `tests/domain/dangling.test.ts` (L5), `src/domain/dangling.ts`.
- **État** : `vert (branche)`.

### 7. Une liaison dérivée au-dessus du seuil est provisoire

- **Vérifie** : une liaison dérivée à 0,91 est « provisoire » et n'entre pas dans
  la couverture déclarée ; à 0,62 elle reste une proposition et le critère
  redevient un trou.
- **Lancer** : `(branche `lot/l4-couverture`) `npx vitest run tests/domain/coverage.test.ts -t '§24.7'`
  → 3 tests verts.
- **Où** : `tests/domain/coverage.test.ts` (L4) ; seuil `DERIVED_LINK_THRESHOLD = 0.85`
  dans `src/defaults.ts`, testé par `tests/contract/honesty.test.ts`.
- **État** : `vert (branche)`.

### 8. Une liaison dérivée confirmée devient déclarée

- **Vérifie** : après confirmation, la liaison passe en déclarée et apparaît dans
  l'historique du critère (le retricotage est un acte humain tracé).
- **Lancer** : `npx vitest run tests/actions/confirm-link.test.ts -t '§24.8'`
  — ni le fichier ni le corps de l'action n'existent (`src/actions/confirm-link.ts`
  renvoie `{ notImplemented: 'confirm-link' }`).
- **Où** : à écrire (lots L3 pour le tissage, L8 pour l'action et sa file).
- **État** : `à écrire`.

### 9. Une liaison dérivée rejetée affaiblit la suggestion suivante

- **Vérifie** : un rejet motivé rend la suggestion suivante du même type plus
  faible (apprentissage du tissage).
- **Lancer** : `npx vitest run tests/actions/reject-link.test.ts -t '§24.9'` — à écrire.
- **Où** : à écrire (lots L3 et L8).
- **État** : `à écrire`.

### 10. Un critère infalsifiable est compté à part

- **Vérifie** : un critère infalsifiable n'est ni trou ni couverture ; une
  reformulation vérifiable est proposée.
- **Lancer** : `npx vitest run tests/domain/falsifiability.test.ts -t '§24.10'` — à écrire.
- **Où** : `src/domain/falsifiability.ts` et `src/domain/proposals.ts` sont en
  cours sur la branche `lot/l6-falsifiables` (non commité) ; les marqueurs
  `UNFALSIFIABLE_MARKERS` sont déjà gelés et testés dans
  `tests/contract/honesty.test.ts`.
- **État** : `à écrire`.

### 11. Un trou est priorisé par le métré, calcul affiché

- **Vérifie** : le classement des trous suit le type de critère, la zone à
  risque et la récurrence, et le score affiche ses termes.
- **Lancer** : `npx vitest run tests/domain/metric.test.ts -t '§24.11'` — à écrire.
- **Où** : `src/domain/metric.ts` et `src/domain/holes.ts` (lot L7, non commité) ;
  poids gelés dans `src/defaults.ts` (`KIND_WEIGHTS`, `ZONE_RISK_WEIGHT`,
  `RECURRENCE_WEIGHT`), testés par `tests/contract/honesty.test.ts`.
- **État** : `à écrire`.

### 12. Une zone qui a déjà cassé remonte dans le classement

- **Vérifie** : un critère d'une zone à risque (défauts passés) remonte dans le
  classement des trous, devant un critère plus nombreux d'une zone sans antécédent.
- **Lancer** : `npx vitest run tests/domain/zones.test.ts -t '§24.12'` — à écrire.
- **Où** : `src/domain/zones.ts` (lot L7, non commité) ; l'entrée du métré est
  déjà prévue dans `src/actions/get-zones-risk.ts` (souche).
- **État** : `à écrire`.

### 13. Un bulletin daté et comparable au témoin précédent

- **Vérifie** : le bulletin porte sa date et celle du témoin précédent ; sans
  témoin, il n'en invente pas.
- **Lancer** : `(branche `lot/l4-couverture`) `npx vitest run tests/domain/bulletin.test.ts -t '§24.13'`
  → 4 tests verts.
- **Où** : `tests/domain/bulletin.test.ts` (L4), `src/domain/bulletin.ts`.
- **État** : `vert (branche)`.

### 14. Le certificat déclare ce qui n'est pas couvert

- **Vérifie** : le certificat de trame liste les actes de vérification (type,
  date, acteur, force), les perforations et fils détendus ouverts, les critères
  infalsifiables, et **déclare explicitement ce qui n'est pas couvert** ; la
  page Confluence est générée.
- **Lancer** : `npx vitest run tests/domain/certificate.test.ts -t '§24.14'` — à écrire.
- **Où** : `src/domain/certificate.ts` et les déclencheurs (lot L10) ; le
  module `confluence:globalPage` et l'action `publish-certificate` sont déjà
  déclarés dans `manifest.yml`, leurs corps sont des souches.
- **État** : `à écrire`.

### 15. Un droit manquant n'est jamais compté comme un trou

- **Vérifie** : un droit absent sur `test-execution` apparaît comme angle mort
  (« pas de droit »), et aucun trou n'est attribué à ce motif.
- **Lancer** : `(branche `lot/l4-couverture`) `npx vitest run tests/domain/coverage.test.ts -t '§24.15'`
  → 1 test vert.
- **Où** : `tests/domain/coverage.test.ts` (L4) ; la sonde `probe` du port
  `GraphGateway` distingue déjà `no-right` de `no-data` dans
  `src/ingest/graph.ts` (renvoie `no-right` tant que le connecteur n'est pas câblé).
- **État** : `vert (branche)`.

### 16. Un projet sans critère affiche « aucun critère écrit »

- **Vérifie** : l'absence de critère n'est pas rendue par « 0 % ».
- **Lancer** : `(branche `lot/l4-couverture`) `npx vitest run tests/domain/coverage.test.ts -t '§24.16'`
  → 2 tests verts.
- **Où** : `tests/domain/coverage.test.ts` (L4) ; le refus de conclure sous
  cinq critères (`MIN_SAMPLE_FOR_CONCLUSION`) est testé sur `main` dans
  `tests/contract/honesty.test.ts`.
- **État** : `vert (branche)`.

### 17. La convention de nommage lie de façon déterministe

- **Vérifie** : un test nommé `PROJ-12.testShouldRetry` est rattaché à
  `PROJ-12` sans passer par le modèle.
- **Lancer** : `npx vitest run tests/domain/links.test.ts -t '§24.17'` — à écrire.
- **Où** : `src/domain/links.ts` (lot L3) ; le scénario de démonstration
  sème déjà deux liaisons par convention de nommage
  (`link_machine`, `link_perforated` dans `tests/helpers/scenario.ts`).
- **État** : `à écrire`.

### 18. Le cache par empreinte ne recalcule que ce qui change

- **Vérifie** : modifier un critère ne relance que les liaisons concernées ;
  un texte inchangé ne rappelle jamais le modèle.
- **Lancer** : `npx vitest run tests/ingest/llm.test.ts -t '§24.18'` — à écrire.
- **Où** : le cache existe et est réel dans `src/ingest/llm.ts` (clé
  `operation:fingerprint(text)`), l'empreinte dans `src/collect/fingerprint.ts`
  (10 tests verts sur `main`) ; ce qui manque : la **recalcul** des liaisons
  concernées, et le branchement du cache sur le tissage.
- **État** : `en souche`.

### 19. Aucun écran, export ou outil ne contient de statistique par personne

- **Vérifie** : aucune figure rapportée ne porte de champ de personne ;
  `authorRef` reste cantonné à la piste d'audit d'un critère ; le schéma ne
  stocke aucune statistique individuelle.
- **Lancer** : `npx vitest run tests/contract/honesty.test.ts -t 'no ranking of people'`
  → 3 tests verts ; et
  `npx vitest run tests/db/persistence.test.ts -t 'ne stocke aucune statistique par personne'`
  → 1 test vert.
- **Où** : `src/types.ts`, `src/db/schema.ts` (quinze tables), `src/ports.ts`.
  Limite honnête : les écrans sont des souches, donc rien n'est encore
  affiché — la garantie est au niveau des types, du schéma et des dictionnaires.
- **État** : `vert`.

### 20. Un critère contenant une clé n'est pas indexé

- **Vérifie** : un texte qui contient un secret est signalé avant d'être indexé ;
  le signalement ne contient jamais la valeur trouvée.
- **Lancer** : `npx vitest run tests/domain/secrets.test.ts` → 18 tests verts
  (une famille de détecteur par test, plus « les findings ne contiennent jamais
  la valeur du secret »).
- **Où** : `src/domain/secrets.ts` (douze familles : AWS, GitHub, GitLab, Slack,
  Google, PEM, JWT, mot de passe, chaîne de connexion, IBAN, e-mail, téléphone).
- **État** : `vert` pour le scan et l'honnêteté du signalement ; `en souche`
  pour le branchement « ne pas indexer » (les six origines d'extraction de
  `src/collect/` renvoient `[]`) et l'ouverture du signalement dans Jira.
  Le point est donc **partiellement couvert**.

## 3. Le jeu de données de démonstration

### 3.1 Ce qui existe déjà : le scénario `TRAME-1`

`tests/helpers/scenario.ts` est un scénario déterministe, écrit pour que
n'importe quel point de recette soit à un test de distance. Il est semé par
`buildScenario()` et ne touche ni le réseau ni le disque.

| Élément | Contenu exact du scénario |
|---|---|
| Ticket | `TRAME-1` (projet `TRAME`, sprint `Sprint 7`, version `2026.11`) |
| Critères | `AC-1` fonctionnel, `AC-2` sécurité, `AC-3` performance **infalsifiable** (« l'application doit être rapide »), `AC-4` non-régression **perforé** (version 2, changé il y a 3 jours, test vieux de 40 jours) |
| Actes de vérification | `TRAME-1.testShouldWeaveCriteria` (vert, machine), un commentaire de déclaration (`ver_comment`, déclarée), `TRAME-1.testShouldCountHoles` **désactivé** (`status: 'ignored'`), `TRAME-1.testShouldKeepCoverageStable` (exécuté il y a 40 jours) |
| Liaisons | 1 machine (convention de nommage), 1 déclarée, 1 vers un acte désactivé, 1 perforée, 1 dérivée à **0,91** (provisoire), 1 dérivée à **0,62** (proposition) |
| Horloge | figée au `2026-11-12T09:00:00.000Z` (`TODAY`) |

Comment le charger, dans un test :

```ts
import { buildScenario } from '../helpers/index.js';

const { deps, ids, store } = await buildScenario();
// deps.store.putCriterion(...) déjà fait : les quatre critères sont là.
```

Comment le lancer aujourd'hui :

```bash
# sur origin/main : le store et le scénario
npx vitest run tests/contract/store.test.ts

# sur la branche lot/l5-perforations : le scénario vu par la perforation
git checkout lot/l5-perforations && npm ci
npx vitest run tests/domain/perforations.test.ts -t 'scénario de démonstration TRAME-1'

# sur la branche lot/l4-couverture : le scénario vu par la couverture
git checkout lot/l4-couverture && npm ci
npx vitest run tests/domain/coverage.test.ts -t '§24'
```

Ce que le scénario ne couvre pas : le multi-ticket, les 24 critères, les
14 exécutions, les 3 tests désactivés, les 2 critères supprimés et la
convention de nommage partiellement appliquée du §26.

### 3.2 Ce qui reste à semer (le projet de démonstration du §26)

Le projet complet du §26 **n'existe pas encore**. Le cahier des charges en
fixe le contenu exact :

| Élément du §26 | Quantité | État |
|---|---|---|
| Tickets | 6 | à semer |
| Critères | 24, dont 4 infalsifiables, 3 modifiés après leurs tests, 2 sans aucun test | à semer |
| Exécutions de test dans le graphe | 14 | à semer, et le connecteur Teamwork Graph n'est pas encore câblé (`src/ingest/graph.ts` renvoie `[]`) |
| Tests désactivés | 3 | à semer |
| Critères supprimés | 2 | à semer |
| Convention de nommage `PROJ-xx.` | partiellement appliquée | à semer |
| Liaisons dérivées à confirmer | une série | à semer |
| Témoin du sprint précédent | semé, pour comparer avec le bulletin | à semer |

Où cela doit landing : le lot L11 (`src/sample/**`, `docs/DEMO-DATA.md`, le
script de semis et le site public de démonstration). Aucun de ces fichiers
n'existe dans l'arbre au 12 novembre 2026 ; `docs/DEMO-DATA.md` n'est pas
dans le dépôt.

En attendant, le scénario `TRAME-1` est le seul jeu de données exécutable, et
il est réel : il est semé, il est déterministe, et deux lots de domaine
(l'algorithme de perforations, celui de couverture) l'utilisent déjà dans
leurs tests.

## 4. Ce que cette recette ne prouve pas

- **Pas d'écran.** Les onze écrans du §17 renvoient `{ notImplemented: … }` ;
  le fichier `src/ui/frontend/index.tsx` affiche un registre de souches. Les
  gestes manuels (ouvrir la carte de trame, lire une perforation, publier un
  certificat) sont donc, aujourd'hui, un **plan** et non une manipulation.
- **Pas de Forge.** Les tests n'utilisent ni `forge`, ni Jira, ni Confluence,
  ni le Teamwork Graph : `tests/contract/no-forge-in-domain.test.ts` vérifie
  au contraire que le domaine n'importe jamais `@forge/*`.
- **Pas de données réelles.** Aucune donnée client, aucun secret, aucun accès
  réseau : c'est voulu, et c'est vérifié (`tests/domain/secrets.test.ts`).
- **Pas de déploiement.** `forge deploy` n'a pas été exécuté pour cette
  rédaction ; l'identifiant d'application du `manifest.yml` est provisoire
  (`ari:cloud:ecosystem::app/3dfebaa0-bb65-471b-be6b-aaee3033ed99`).
