# RECETTE — Trame

> Les vingt points de la recette du §24 du cahier des charges, un par un :
> ce que le point vérifie, la **commande exacte** qui le lance, le fichier de
> test, et son **état réel au 12 novembre 2026**.
> Base de la rédaction : `origin/main` @ `b3f8cce` (`b3f8cced169c9d10f92f94ee9b72c4930122df12`).
> Aucun point n'est déclaré vert sans un test que j'ai lancé, et chaque chiffre
> ci-dessous est mesuré (`npx vitest run`).

## 0. Comment lire ce document

Quatre états, et rien d'autre :

| État | Signification |
|---|---|
| `vert` | un test nommé d'après le point passe aujourd'hui sur `origin/main` |
| `vert (souche d'écran)` | le test passe, mais l'écran qui doit le montrer est une souche — c'est le cas de **tous** les `vert` de cette table : les onze écrans et les quatorze outils renvoient `{ notImplemented: … }` |
| `en souche` | le point d'entrée existe mais renvoie une souche (`{ notImplemented: … }` ou `[]`) |
| `à écrire` | aucun test ne porte le numéro du point |

Chaque point ci-dessous donne sa **commande exacte**, fichier par fichier : le
filtre `-t` de vitest compare des chaînes, donc `§24.1` attrape aussi `§24.15`
et `§24.16`, et `§24.2` attrape `§24.20`. D'où le choix de viser un fichier
précis à chaque fois.

**Deux limites que « vert » ne dit pas**, et qui valent pour la table entière :

1. un test vert prouve un **algorithme de domaine**, pas un **écran** : les onze
   écrans (§17) et les quatorze outils MCP (§16) sont encore des souches
   aujourd'hui — aucun `vert` du §2 ne peut être *montré* dans Jira, il se lit
   dans `src/domain/*` et se lance à la ligne de commande ;
2. les tests tournent sur des doubles en mémoire (`tests/helpers/`) et un
   calendrier injectable : aucun réseau, aucun compte Atlassian, aucune donnée
   réelle.

État de l'arbre au moment de la rédaction (chiffres mesurés) :

| Arbre | Fichiers de test | Tests | `npx vitest run` |
|---|---|---|---|
| `origin/main` @ `b3f8cce` | **26** | **339** | 26 fichiers, 339 tests verts (≈2 s sur une machine chaude, ≈15 s la première fois : c'est la transformation TypeScript qui coûte) |

Lots **mergés** dans `origin/main` (dans l'ordre du `git log`) :

| Lot | Contenu | Preuve |
|---|---|---|
| L1 | extraction des critères sur les six origines du §6 | `src/collect/*`, `tests/collect/extraction.test.ts` (27 tests) |
| L2 | ingestion des actes : graphe, Bitbucket, commentaires, pipeline | `src/ingest/*`, `tests/ingest/*.test.ts` |
| L3 | les quatre chemins de liaison et la confiance apprise | `src/domain/links.ts`, `confidence.ts` |
| L4 | couverture sur trois axes, bulletin, témoin, historique | `src/domain/coverage.ts`, `bulletin.ts`, `timeline.ts`, `witness.ts` |
| L5 | perforations et fils détendus | `src/domain/perforations.ts`, `dangling.ts` |
| L6 | critères infalsifiables et propositions | `src/domain/falsifiability.ts`, `proposals.ts`, `reformulation.ts` |
| L7 | le métré, les zones à risque et les trous classés | `src/domain/metric.ts`, `zones.ts`, `holes.ts` |
| L10 | le certificat de trame (la page opposable) — §12.5 | `src/domain/certificate.ts`, `tests/domain/certificate.test.ts` (4 tests) |
| L11 | le projet de démonstration du §26 | `src/sample/demo-project.ts`, `tests/sample/demo-project.test.ts` (10 tests) |
| L12 | dossier de soumission | `docs/` |

Ce qui reste une **souche** aujourd'hui (point d'entrée écrit, corps vide) :

| Surface | Fichiers | Corps |
|---|---|---|
| quatorze outils MCP + quatre actions internes | `src/actions/*.ts` (18 fichiers) | `{ notImplemented: … }` |
| onze écrans du §17 | `src/handlers/{weave-map,perforations,dangling,holes,bulletin,certificate,criterion-detail,timeline,validation-queue,visibility,zone-risks}.ts` | `{ notImplemented: … }` |
| quatre fonctions JQL | `src/handlers/jql.ts` | `[]` |
| validateur de transition | `src/handlers/validator.ts` | `blocking: false` |
| déclencheur `avi:jira:updated:issue`, déclencheur planifié nocturne, consumer `trame-recompute` | `src/handlers/events.ts`, `scheduled.ts`, `consumer.ts` | journalisent l'événement, ne calculent rien |
| pont signé `ci-results` | `src/handlers/ingest.ts` | HTTP `501`, `{ error: 'not-implemented' }` |
| connecteur Confluence | `src/ingest/confluence.ts` | `readChecklist` → `[]`, `publishCertificate` → `null` |
| génération LLM | `src/ingest/llm.ts` | contenus `notImplemented` (cache et budget réels) |

Écrit mais **pas encore mergé** dans `origin/main` :

| Branche | Contenu | Mesuré |
|---|---|---|
| `origin/lot/l10-triggers` (`261de13`) | les déclencheurs, le consumer, le pont signé et les fonctions JQL — avec `tests/handlers/triggers.test.ts` (233 lignes) | absent de `origin/main` |
| `origin/lot/l11b-site` (`fec1ba8`) | le site public et la démo vivante — `site/` et `tests/site/demo-numbers.test.ts`, `demo-render.test.tsx` | absent de `origin/main` |

## 1. Marche à suivre pour un jury (5 minutes)

```bash
git clone https://github.com/Tradoooo/trame.git
cd trame
npm ci                 # dépendances (node_modules n'est pas versionné)
npm test               # vitest run — 26 fichiers, 339 tests
npm run typecheck      # tsc --noEmit
npm run check:limits   # garde : aucun fichier de plus de 500 lignes
```

Si `npm ci` échoue (réseau, cache vide), `npm install` fait le même travail ;
`npm test` ne télécharge rien de plus.

Le dépôt a été renommé le 12 novembre 2026 : l'ancienne adresse
`github.com/BaptisteFaisy/trame` redirige (301) vers `github.com/Tradoooo/trame`,
qui est l'adresse canonique utilisée ci-dessus.

Les vérifications, minute par minute :

| Minute | Vérification | Commande | Résultat attendu (mesuré) |
|---|---|---|---|
| 0:00 | la suite passe | `npm test` | `Test Files 26 passed (26)` · `Tests 339 passed (339)` |
| 0:30 | les types passent | `npm run typecheck` | aucune sortie, code 0 |
| 1:00 | la garde de taille passe | `npm run check:limits` | `OK : tous les fichiers tiennent dans la limite.` |
| 1:30 | les quatorze outils existent | `npx vitest run tests/contract/entry-points.test.ts` | 5 tests verts, dont « expose exactly the fourteen MCP tools of §16 » |
| 2:30 | les chiffres ne sont jamais nus | `npx vitest run tests/contract/honesty.test.ts` | 10 tests verts |
| 3:00 | le domaine n'importe jamais `@forge/*` | `npx vitest run tests/contract/no-forge-in-domain.test.ts` | 3 tests verts |
| 3:30 | le détecteur de secrets ne dit jamais la valeur | `npx vitest run tests/domain/secrets.test.ts` | 18 tests verts |
| 4:00 | le schéma ne stocke aucune statistique par personne | `npx vitest run tests/db/persistence.test.ts` | 13 tests verts |
| 4:30 | le projet de démonstration tient les chiffres du §26 | `npx vitest run tests/sample/demo-project.test.ts` | 10 tests verts |

**Ce que ces minutes prouvent** : les algorithmes de domaine du §24 sont
écrits, mergés et testés (couverture, perforations, fils détendus, métré,
certificat, projet de démonstration). **Ce qu'elles ne prouvent pas** : aucun
écran n'est branché, aucun outil MCP ne répond autre chose qu'une souche, et
le connecteur Confluence n'écrit rien — voir le tableau des souches plus haut.

## 2. Les vingt points, un par un

Résumé (le détail est sous chaque point) :

| # | Ce que le point vérifie | Fichier(s) de test qui portent `§24.N` | État |
|---|---|---|---|
| 1 | couverture avec effectif et force par critère | — (aucun test numéroté) | à écrire |
| 2 | force selon la forme de l'acte | `coverage` · `comments-mapping` · `graph-mapping` · `pipeline` | vert |
| 3 | les trois axes ne sont jamais fusionnés | `coverage` | vert |
| 4 | perforation : les deux dates et le classement | `perforations` | vert |
| 5 | un test désactivé retire sa couverture | `dangling` · `coverage` | vert |
| 6 | un critère supprimé fait un fil détendu | `dangling` | vert |
| 7 | une liaison dérivée reste provisoire | `coverage` · `links` · `bulletin` | vert |
| 8 | une liaison confirmée renforce la confiance | `links` | vert |
| 9 | une liaison rejetée affaiblit la suivante | `links` · `proposals` | vert |
| 10 | infalsifiable compté à part, reformulation | `falsifiability` · `proposals` | vert |
| 11 | le trou est priorisé, le calcul est affiché | `holes` · `metric` | vert |
| 12 | la zone à risque remonte le classement | `holes` | vert |
| 13 | bulletin daté, comparable au témoin | `bulletin` | vert |
| 14 | le certificat déclare ce qui n'est pas couvert | `certificate` | vert |
| 15 | un droit manquant n'est pas un trou | `probe` (ingest) · `coverage` | vert |
| 16 | aucun critère écrit ≠ « 0 % » | `coverage` · `bulletin` | vert |
| 17 | la convention de nommage lie de façon déterministe | `links` · `bitbucket-mapping` | vert |
| 18 | le cache par empreinte ne recalcule que ce qui change | — (aucun test numéroté) | à écrire |
| 19 | aucune statistique par personne | — (garanti par `honesty` + `persistence`) | à écrire |
| 20 | un critère avec une clé n'est pas indexé | `extraction` | vert |

### 1. Couverture avec effectif et force par critère

- **Vérifie** : un ticket à trois critères et deux tests exécutés affiche une
  couverture qui porte l'effectif et la force de chaque maille.
- **Lancer** : aucun test ne porte **exactement** `§24.1` (le filtre
  `-t '§24.1'` attrape par préfixe `§24.15` et `§24.16`, qui relèvent d'autres
  points). L'algorithme existe et est testé sous un autre nom (`§8.1 — le
  dénominateur compte les critères vérifiables seulement`, `§22 — un
  pourcentage porte toujours son effectif`).
- **Où** : `src/domain/coverage.ts` (`computeCoverage`), 21 tests dans
  `tests/domain/coverage.test.ts`.
- **État** : `à écrire` — le test qui porte le numéro du point manque.

### 2. La force suit la forme de l'acte de vérification

- **Vérifie** : un test automatisé exécuté est compté « machine », une
  attestation « attestée », un commentaire « déclarée ».
- **Lancer** : `npx vitest run tests/domain/coverage.test.ts -t '§24.2 —'`
  → 3 tests verts ; la même règle est aussi testée dans
  `tests/ingest/comments-mapping.test.ts`, `tests/ingest/graph-mapping.test.ts`
  et `tests/ingest/pipeline.test.ts` (commentaire, attestation, machine).
- **Où** : `src/defaults.ts` (`DEFAULT_STRENGTH_BY_FORM`, `STRENGTH_RANK`).
- **État** : `vert`.

### 3. Les trois axes sont décomposés et jamais fusionnés

- **Vérifie** : force, type de liaison et fraîcheur sont trois lignes
  distinctes ; la provisoire n'entre pas dans la déclarée.
- **Lancer** : `npx vitest run tests/domain/coverage.test.ts -t '§24.3'`
  → 5 tests verts.
- **Où** : `tests/domain/coverage.test.ts`, `src/domain/coverage.ts`.
- **État** : `vert`.

### 4. Une perforation porte ses deux dates et son classement

- **Vérifie** : un critère modifié après son test est listé en perforation avec
  la date du critère et la date de la vérification, classé fraîche (< 7 j),
  sèche (> 30 j) ou multiple (3 changements).
- **Lancer** : `npx vitest run tests/domain/perforations.test.ts -t '§24.4'`
  → 7 tests verts.
- **Où** : `tests/domain/perforations.test.ts`, `src/domain/perforations.ts`.
- **État** : `vert`.

### 5. Un test désactivé fait disparaître sa couverture

- **Vérifie** : la couverture affichée baisse quand un test est ignoré ; le fil
  détendu est listé avec son impact chiffré.
- **Lancer** : `npx vitest run tests/domain/dangling.test.ts -t '§24.5'`
  → 3 tests verts ; côté calcul de couverture :
  `npx vitest run tests/domain/coverage.test.ts -t '§24.5'` → vert.
- **Où** : `tests/domain/dangling.test.ts`, `tests/domain/coverage.test.ts`.
- **État** : `vert`.

### 6. Un critère supprimé fait apparaître un fil détendu

- **Vérifie** : le critère supprimé produit un fil détendu avec sa raison ; il ne
  retire que sa propre maille.
- **Lancer** : `npx vitest run tests/domain/dangling.test.ts -t '§24.6'`
  → 2 tests verts.
- **Où** : `tests/domain/dangling.test.ts`, `src/domain/dangling.ts`.
- **État** : `vert`.

### 7. Une liaison dérivée au-dessus du seuil est provisoire

- **Vérifie** : une liaison dérivée à 0,91 est « provisoire » et n'entre pas dans
  la couverture déclarée ; à 0,62 elle reste une proposition et le critère
  redevient un trou.
- **Lancer** : `npx vitest run tests/domain/coverage.test.ts -t '§24.7'`
  → 3 tests verts ; confirmé dans `links.test.ts` et `bulletin.test.ts`.
- **Où** : seuil `DERIVED_LINK_THRESHOLD = 0.85` dans `src/defaults.ts`.
- **État** : `vert`.

### 8. Une liaison dérivée confirmée renforce la confiance

- **Vérifie** : la confirmation d'une liaison renforce les jetons partagés de la
  confiance apprise (§9.4, §24.8).
- **Lancer** : `npx vitest run tests/domain/links.test.ts -t '§24.8'`
  → 1 test vert.
- **Où** : `src/domain/links.ts`, `src/domain/confidence.ts`.
- **État** : `vert`.

### 9. Une liaison dérivée rejetée affaiblit la suggestion suivante

- **Vérifie** : un rejet affaiblit les jetons partagés, donc la suggestion
  suivante du même type.
- **Lancer** : `npx vitest run tests/domain/links.test.ts -t '§24.9'`
  → 1 test vert ; le flux de proposition est testé dans
  `tests/domain/proposals.test.ts`.
- **Où** : `src/domain/links.ts`, `src/domain/confidence.ts`, `src/domain/proposals.ts`.
- **État** : `vert`.

### 10. Un critère infalsifiable est compté à part

- **Vérifie** : un critère infalsifiable n'est ni trou ni couverture ; une
  reformulation vérifiable (mesure + percentile) est proposée.
- **Lancer** : `npx vitest run tests/domain/falsifiability.test.ts -t '§24.10'`
  → 4 tests verts ; la reformulation est testée dans `tests/domain/proposals.test.ts`.
- **Où** : `src/domain/falsifiability.ts`, `reformulation.ts`, `proposals.ts`.
- **État** : `vert`.

### 11. Un trou est priorisé par le métré, calcul affiché

- **Vérifie** : le classement des trous suit le métré, le score est affiché avec
  ses trois termes, borné dans [0, 1], recalculé terme par terme.
- **Lancer** : `npx vitest run tests/domain/holes.test.ts -t '§24.11'`
  → 4 tests verts ; le score est testé dans `tests/domain/metric.test.ts`.
- **Où** : `src/domain/holes.ts`, `src/domain/metric.ts`, `src/defaults.ts`.
- **État** : `vert`.

### 12. Une zone qui a déjà cassé remonte dans le classement

- **Vérifie** : un critère d'une zone à risque remonte dans le classement des
  trous, devant un critère d'une zone calme ; le score observé de la zone est affiché.
- **Lancer** : `npx vitest run tests/domain/holes.test.ts -t '§24.12'`
  → 5 tests verts.
- **Où** : `src/domain/holes.ts`, `src/domain/zones.ts`.
- **État** : `vert`.

### 13. Un bulletin daté et comparable au témoin précédent

- **Vérifie** : le bulletin porte sa date et celle du témoin précédent ; deux
  témoins se comparent d'un sprint à l'autre.
- **Lancer** : `npx vitest run tests/domain/bulletin.test.ts -t '§24.13'`
  → 4 tests verts.
- **Où** : `tests/domain/bulletin.test.ts`, `src/domain/bulletin.ts`, `witness.ts`.
- **État** : `vert`.

### 14. Le certificat déclare ce qui n'est pas couvert

- **Vérifie** : le certificat liste les actes (type, date, acteur, force), les
  perforations et fils détendus, les infalsifiables, et déclare explicitement ce
  qui n'est pas couvert.
- **Lancer** : `npx vitest run tests/domain/certificate.test.ts -t '§24.14'`
  → 1 test vert (fichier : 4 tests).
- **Où** : `src/domain/certificate.ts`. Limite honnête : la **page Confluence**
  n'est pas générée (`src/ingest/confluence.ts` `publishCertificate` → `null`,
  et l'action `publish-certificate` est une souche) ; le contenu du certificat,
  lui, est réel.
- **État** : `vert` (pour le contenu ; la publication Confluence est en souche).

### 15. Un droit manquant n'est jamais compté comme un trou

- **Vérifie** : un droit absent sur `test-execution` apparaît comme angle mort
  (`no-right`), et aucun trou n'est attribué à ce motif.
- **Lancer** : `npx vitest run tests/ingest/probe.test.ts -t '§24.15'`
  → 6 tests verts ; côté couverture :
  `npx vitest run tests/domain/coverage.test.ts -t '§24.15'` → vert.
- **Où** : `src/ingest/graph.ts` (sonde `probe`), `src/domain/coverage.ts`.
- **État** : `vert`.

### 16. Un projet sans critère affiche « aucun critère écrit »

- **Vérifie** : l'absence de critère n'est pas rendue par « 0 % ».
- **Lancer** : `npx vitest run tests/domain/coverage.test.ts -t '§24.16'`
  → 2 tests verts ; confirmé dans `tests/domain/bulletin.test.ts`.
- **Où** : `src/domain/coverage.ts`, `src/domain/bulletin.ts`.
- **État** : `vert`.

### 17. La convention de nommage lie de façon déterministe

- **Vérifie** : un test nommé `PROJ-12.testShouldRetry` est rattaché à `PROJ-12`
  sans passer par le modèle ; la reconnaissance est déterministe.
- **Lancer** : `npx vitest run tests/domain/links.test.ts -t '§24.17'`
  → 2 tests verts ; conversion Bitbucket dans
  `tests/ingest/bitbucket-mapping.test.ts` → 2 tests verts.
- **Où** : `src/domain/links.ts`, `src/ingest/bitbucket-mapping.ts`.
- **État** : `vert`.

### 18. Le cache par empreinte ne recalcule que ce qui change

- **Vérifie** : modifier un critère ne relance que les liaisons concernées ; un
  texte inchangé ne rappelle jamais le modèle.
- **Lancer** : `npx vitest run tests/ -t '§24.18'` → aucun test ne porte le
  numéro.
- **Où** : le cache existe et est réel (`src/ingest/llm.ts`, clé
  `operation:fingerprint(text)`, empreinte `src/collect/fingerprint.ts` — 10
  tests verts). Ce qui manque : le **recalcul sélectif des liaisons concernées**
  (le gateway `suggestLinks` ne propose rien) et un test qui porte le numéro.
- **État** : `à écrire`.

### 19. Aucun écran, export ni outil ne contient de statistique par personne

- **Vérifie** : aucune figure rapportée ne porte de champ de personne ; le schéma
  ne stocke aucune statistique individuelle.
- **Lancer** : `npx vitest run tests/ -t '§24.19'` → aucun test ne porte le
  numéro. La garantie est **déjà** portée par d'autres tests :
  `npx vitest run tests/contract/honesty.test.ts -t 'no ranking of people'`
  (3 tests) et `tests/db/persistence.test.ts -t 'ne stocke aucune statistique
  par personne'` (1 test).
- **Où** : `src/types.ts`, `src/db/schema.ts`, `src/ports.ts`.
- **État** : `à écrire` — le test numéroté manque, la garantie existe déjà.

### 20. Un critère contenant une clé n'est pas indexé

- **Vérifie** : un critère contenant une clé n'est pas retourné par l'extraction ;
  le signalement ne contient jamais la valeur, seulement la famille.
- **Lancer** : `npx vitest run tests/collect/extraction.test.ts -t '§24.20'`
  → 2 tests verts. Le détecteur complet : `tests/domain/secrets.test.ts` (18 tests).
- **Où** : `src/collect/index.ts` (`flagSecrets`), `src/domain/secrets.ts`.
- **État** : `vert`.

## 3. Le jeu de données de démonstration

### 3.1 Le projet de démonstration du §26, semé et testé

`src/sample/demo-project.ts` construit le projet exact du §26, et
`tests/sample/demo-project.test.ts` (10 tests) en vérifie chaque chiffre :

| Élément | Quantité (mesurée) |
|---|---|
| Tickets | 6 (`TRAME-101` … `TRAME-106`) |
| Critères | 24, dont 4 infalsifiables |
| Exécutions de test automatisées | 14 |
| Tests désactivés | 3 |
| Critères supprimés | 2 |
| Perforations (critère modifié après son test) | 3 |
| Trous déclarés dans le semis (`buildDemoProject().holes`) | 2 |
| Liaisons dérivées à confirmer | 4 (confiances 0,91 · 0,88 · 0,62 · 0,41) |
| Horloge | figée au `2026-11-12T09:00:00.000Z` (`DEMO_NOW`) |

À noter, honnêtement : le semis déclare **2 trous** (les critères jamais
vérifiés du §26). Passé dans le **vrai moteur** (`findHoles`, branché sur le
site de la branche `lot/l11b-site`), le projet en produit **4** : les 2 jamais
vérifiés, plus 2 dont la seule maille est un test **désactivé** — leur
couverture a disparu, ils (re)deviennent des trous. Même chose pour les fils
détendus : 3 tests désactivés sont semés, dont 2 seulement sont encore liés à un
critère, donc le moteur compte **2 fils détendus**. Les deux chiffres sont
testés : `tests/sample/demo-project.test.ts` (le semis) et
`tests/site/demo-numbers.test.ts` sur la branche site (le moteur).

Comment le vérifier :

```bash
npx vitest run tests/sample/demo-project.test.ts    # 10 tests verts
# et la suite complète :
npm test                                            # 26 fichiers, 339 tests
```

Le projet est **réel et réutilisé** : le site public de démonstration (branche
`origin/lot/l11b-site`, pas encore mergée) branché sur ce même moteur de domaine
calcule la couverture, les perforations, les fils détendus et le bulletin du
projet semé (`site/src/demo/engine.ts` → `buildDemoProject()` +
`computeCoverage` + `detectPerforations` + `detectDangling` + `findHoles`).

### 3.2 L'ancien scénario `TRAME-1`

`tests/helpers/scenario.ts` reste disponible (un ticket, quatre critères, six
liaisons), mais il n'est plus le seul jeu de données : le projet du §26 est le
jeu de démonstration de référence, semé et testé dans `tests/sample/`.

## 4. Ce que cette recette ne prouve pas

- **Pas d'écran.** Les onze écrans du §17 renvoient `{ notImplemented: … }` ;
  `src/ui/frontend/index.tsx` affiche un registre de souches. Les gestes
  manuels (ouvrir la carte de trame, lire une perforation, publier un
  certificat) sont un **plan**, pas une manipulation.
- **Pas d'outil.** Les quatorze outils MCP renvoient `{ notImplemented: … }` ;
  aucune question posée à l'agent Rovo ne reçoit encore de chiffre.
- **Pas de Confluence.** Le connecteur n'écrit pas (`publishCertificate` → `null`).
- **Pas de Forge.** Les tests n'utilisent ni `forge`, ni Jira, ni Confluence,
  ni le Teamwork Graph : `tests/contract/no-forge-in-domain.test.ts` vérifie au
  contraire que le domaine n'importe jamais `@forge/*` (le transport du graphe
  est injectable, la lecture réelle se fait via `api.asUser().requestTeamworkGraph`).
- **Pas de déploiement.** `forge deploy` n'a pas été exécuté ; l'identifiant
  d'application du `manifest.yml` est provisoire
  (`ari:cloud:ecosystem::app/3dfebaa0-bb65-471b-be6b-aaee3033ed99`).