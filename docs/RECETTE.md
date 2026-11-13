# RECETTE — Trame

> Les vingt points de recette du §24 du cahier des charges : ce que chaque point
> vérifie, la **commande exacte** qui le lance, le fichier de test, et son **état
> réel au 13 novembre 2026**.
> Base mesurée : `main` @ `7c468f7` (`7c468f7bdb33d9d731b71551e2d30a8e7174e657`),
> `npx vitest run` → **49 fichiers, 428 tests verts**, ≈7 s sur une machine
> chaude.
> Le détail point par point — commande, sortie, code visé, limite — est dans
> [`RECETTE-POINTS.md`](RECETTE-POINTS.md).

## 0. Comment lire ce document

Un seul état est déclaré, et il veut dire une chose précise :

| État | Signification |
|---|---|
| `vert` | un test dont le **titre porte le numéro du point** (`§24.N`) a été lancé sur `main` @ `7c468f7` et passe, avec la commande écrite à côté |

C'est volontairement étroit : un point n'est pas `vert` parce que « le module
existe », mais parce qu'un test nommé d'après lui a produit `Tests 1 passed`
devant moi. La colonne « limite » du fichier de détail dit ce que ce test ne
prouve pas — c'est là que se lit l'honnêteté, pas dans l'état.

**Trois limites valables pour la table entière :**

1. **Aucun compte Atlassian dans les tests.** Les ports — Teamwork Graph,
   Confluence, LLM, horloge, file de messages, magasin — sont des **doubles en
   mémoire** (`tests/helpers/`). Un `vert` prouve un calcul, un view-model ou un
   handler ; il ne prouve pas un appel réseau réel.
2. **Les onze écrans et les quatorze outils ne sont plus des souches.** Depuis
   les lots L8, L9b et L10 : view-models dans `src/viewmodel/`, handlers dans
   `src/handlers/`, enregistrés dans `src/handlers/resolver.ts` ; actions dans
   `src/actions/`, dispatch dans `src/handlers/dispatch.ts`. Preuves :
   `tests/handlers/screens.test.ts` (3 verts, dont « aucun écran ne répond plus
   une souche §24 ») et `tests/contract/entry-points.test.ts` (5 verts, dont
   « expose exactly the fourteen MCP tools of §16 »). Ce qui reste une souche
   est nommé au §4 : **deux choses**.
3. **Le filtre `-t` est une expression**, pas une égalité : `-t '§24.1'`
   attraperait `§24.15` et `§24.16`. Chaque commande porte donc le numéro
   complet et vise **un fichier précis**.

État de l'arbre (mesuré, pas recopié) :

| Arbre | Fichiers de test | Tests | `npx vitest run` |
|---|---|---|---|
| `main` @ `7c468f7` | **49** | **428** | 49 fichiers, 428 tests verts, ≈7 s à chaud |
| `main` @ `b3f8cce` (rédaction précédente) | 26 | 339 | 26 fichiers, 339 tests verts |

Ce qui a changé entre les deux, dans l'ordre du `git log` :

| Lot | Contenu | Preuve |
|---|---|---|
| L8 | les quatorze outils MCP et les quatre actions internes, réels | `src/actions/*` (18 fichiers + 2 communs), `tests/actions/*.test.ts` (18 fichiers, 55 tests) |
| L9 | le view-model et le handler de la carte de trame | `src/viewmodel/weave-map.ts`, `tests/viewmodel/weave-map.test.ts` (5 tests) |
| L9b | les dix écrans restants, la file, les zones, la couverture | `src/viewmodel/*.ts` (13 fichiers), `src/handlers/*.ts`, `tests/handlers/screens.test.ts` |
| L10 | déclencheur, consumer, pont signé (`webtrigger`), quatre fonctions JQL, validateur | `src/handlers/{events,consumer,ingest,jql,validator,scheduled}.ts`, `tests/handlers/triggers.test.ts` (14 tests) |
| L11b | le site public et sa démo qui exécute le vrai moteur | `site/`, `tests/site/` (2 fichiers, 12 tests) |
| Forge | l'app déployée et installée en développement | `manifest.yml`, `forge lint` (voir §5) |

## 1. Marche à suivre pour un jury (5 minutes)

```bash
git clone https://github.com/Tradoooo/trame.git
cd trame
npm ci                 # dépendances (node_modules n'est pas versionné)
npm test               # vitest run — 49 fichiers, 428 tests
npm run typecheck      # tsc --noEmit
npm run check:limits   # garde : aucun fichier de plus de 500 lignes
```

Si `npm ci` échoue (réseau, cache vide), `npm install` fait le même travail ;
`npm test` ne télécharge rien de plus. Le dépôt est public, sous licence MIT.

Les vérifications, minute par minute (résultats mesurés le 13 novembre 2026) :

| Minute | Vérification | Commande | Résultat attendu |
|---|---|---|---|
| 0:00 | la suite passe | `npm test` | `Test Files 49 passed (49)` · `Tests 428 passed (428)` |
| 0:30 | les types passent | `npm run typecheck` | aucune sortie, code 0 |
| 1:00 | la garde de taille passe | `npm run check:limits` | `220 fichier(s) audité(s), limite 500 lignes.` puis `OK` |
| 1:30 | les quatorze outils répondent | `npx vitest run tests/contract/entry-points.test.ts` | 5 verts |
| 2:00 | les onze écrans répondent | `npx vitest run tests/handlers/screens.test.ts` | 3 verts |
| 2:30 | les déclencheurs, le consumer, le pont signé | `npx vitest run tests/handlers/triggers.test.ts` | 14 verts |
| 3:00 | les chiffres ne sont jamais nus | `npx vitest run tests/contract/honesty.test.ts` | 10 verts |
| 3:30 | le domaine n'importe jamais `@forge/*` | `npx vitest run tests/contract/no-forge-in-domain.test.ts` | 3 verts |
| 4:00 | la démo du site exécute le vrai moteur | `npx vitest run tests/site` | 2 fichiers, 12 verts |
| 4:30 | le projet de démonstration tient les chiffres du §26 | `npx vitest run tests/sample/demo-project.test.ts` | 10 verts |

**Ce que ces minutes prouvent** : les algorithmes de domaine du §24, les onze
écrans du §17 comme *handlers*, les quatorze outils MCP du §16, le pont signé et
le consumer fonctionnent, et les chiffres affichés portent toujours leur
effectif. **Ce qu'elles ne prouvent pas** : voir le §4 et le §5.

## 2. Les vingt points du §24

Les commandes du tableau s'écrivent avec le préfixe `npx ` : par exemple
`vitest run tests/domain/coverage.test.ts -t '§24.3'`. Le fichier est toujours
donné, le nombre de tests est celui qui passe **avec ce filtre** (le reste du
fichier compte en `skipped`).

| # | Ce que le point vérifie | Commande (`npx …`) | Verts | État |
|---|---|---|---|---|
| 1 | couverture avec effectif et force par critère | `vitest run tests/viewmodel/weave-map.test.ts -t '§24.1'` | 1 | vert |
| 2 | force selon la forme de l'acte | `vitest run tests/domain/coverage.test.ts -t '§24.2'` | 4 | vert |
| 3 | les trois axes ne sont jamais fusionnés | `vitest run tests/domain/coverage.test.ts -t '§24.3'` | 5 | vert |
| 4 | perforation : les deux dates et le classement | `vitest run tests/domain/perforations.test.ts -t '§24.4'` | 7 | vert |
| 5 | un test désactivé retire sa couverture | `vitest run tests/domain/dangling.test.ts -t '§24.5'` | 3 | vert |
| 6 | un critère supprimé fait un fil détendu | `vitest run tests/domain/dangling.test.ts -t '§24.6'` | 2 | vert |
| 7 | une liaison dérivée reste provisoire | `vitest run tests/domain/coverage.test.ts -t '§24.7'` | 3 | vert |
| 8 | une liaison confirmée devient déclarée | `vitest run tests/domain/links.test.ts -t '§24.8'` | 1 | vert |
| 9 | une liaison rejetée affaiblit la suivante | `vitest run tests/domain/links.test.ts -t '§24.9'` | 1 | vert |
| 10 | infalsifiable compté à part, reformulation | `vitest run tests/domain/falsifiability.test.ts -t '§24.10'` | 4 | vert |
| 11 | le trou est priorisé, le calcul est affiché | `vitest run tests/domain/holes.test.ts -t '§24.11'` | 4 | vert |
| 12 | la zone à risque remonte le classement | `vitest run tests/domain/holes.test.ts -t '§24.12'` | 5 | vert |
| 13 | bulletin daté, comparable au témoin | `vitest run tests/domain/bulletin.test.ts -t '§24.13'` | 4 | vert |
| 14 | le certificat déclare ce qui n'est pas couvert | `vitest run tests/domain/certificate.test.ts -t '§24.14'` | 1 | vert |
| 15 | un droit manquant n'est pas un trou | `vitest run tests/ingest/probe.test.ts -t '§24.15'` | 6 | vert |
| 16 | aucun critère écrit ≠ « 0 % » | `vitest run tests/domain/coverage.test.ts -t '§24.16'` | 2 | vert |
| 17 | la convention de nommage lie de façon déterministe | `vitest run tests/domain/links.test.ts -t '§24.17'` | 2 | vert |
| 18 | le recalcul ne reprend que ce qui a changé | `vitest run tests/actions/recompute.test.ts -t '§24.18'` | 1 | vert |
| 19 | aucune statistique par personne | `vitest run tests/actions/get-coverage.test.ts -t '§24.19'` | 2 | vert |
| 20 | un critère avec une clé n'est pas indexé | `vitest run tests/collect/extraction.test.ts -t '§24.20'` | 2 | vert |

Chaque point est couvert **plusieurs fois** — le domaine, l'action interne, le
view-model de l'écran : `RECETTE-POINTS.md` donne, pour les vingt, les
commandes secondaires (par exemple `tests/actions/list-perforations.test.ts`
pour le point 4, `tests/handlers/screens.test.ts` pour le point 16). Au total,
**129 tests portent un numéro `§24.N`** dans leur titre.

## 3. Le jeu de données de démonstration

`src/sample/demo-project.ts` construit le projet exact du §26 ;
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

Le semis déclare **2 trous** ; passé dans le **vrai moteur**, le même projet en
produit **4** : les 2 jamais vérifiés, plus 2 dont la seule maille est un test
**désactivé** — leur couverture a disparu, ils redeviennent des trous. Même
mécanique pour les fils détendus : 3 tests désactivés sont semés, 2 seulement
sont encore liés à un critère, donc le moteur compte **2 fils détendus**. Les
deux chiffres sont testés : le semis dans `tests/sample/demo-project.test.ts`,
le moteur dans `tests/site/demo-numbers.test.ts`.

```bash
npx vitest run tests/sample/demo-project.test.ts   # 10 verts
npx vitest run tests/site/demo-numbers.test.ts     # 6 verts (le moteur)
npm test                                           # 49 fichiers, 428 tests
```

Le site public <https://tradoooo.github.io/trame/> (Vite + React) branche la
démo sur ce même moteur : `computeCoverage`, `detectPerforations`,
`detectDangling`, `findHoles`. Rien n'y est recalculé à la main.

## 4. Les souches qui restent (deux, assumées)

**1. L'entrée UI Kit 2 — `src/ui/frontend/index.tsx` (43 lignes).**
Elle rend le **registre** des onze écrans (`screenRegistry()`), chaque clé
marquée `implemented: true, rendered: false` : l'écran existe côté serveur, il
n'est pas monté ici — `@forge/react` v10 n'expose pas `render`, donc un module
`render: native` ne monte pas d'arbre React testable. Ce qui n'est **pas**
souche : les onze view-models (`src/viewmodel/`) et les onze handlers
(`src/handlers/`), réels et testés (`tests/handlers/screens.test.ts`, 3 verts).
La démo visuelle est le site public.

**2. La génération LLM — `src/ingest/llm.ts`.**
Les contenus générés (`proposeReformulation`, `draftTest`) renvoient
`NOT_IMPLEMENTED`, et `suggestLinks` ne propose rien : c'est volontaire (§22 —
mieux vaut un vide déclaré qu'un texte qui aurait l'air généré). Ce qui est
**réel** : le cache par empreinte, le budget, les quatre chemins de liaison
déterministes, la reformulation calculée.

Une nuance qui n'est pas une souche d'écran mais qu'il faut dire : le
**connecteur Confluence** (`src/ingest/confluence.ts`) refuse d'écrire et le
déclare — `publishCertificate` → `null`, d'où le repli prévu au §21 (certificat
généré dans l'app puis exporté). L'action `publish-certificate` répond alors un
**refus explicite**, jamais une page vide : les deux branches sont testées.

## 5. Ce que cette recette ne prouve pas

- **Les pages Jira existent, mais rendent le registre.** Les modules
  `jira:projectPage`, `jira:globalPage`, `jira:issuePanel` et
  `confluence:globalPage` sont déclarés, déployés et installés ; l'entrée UI Kit
  2 qu'ils montent rend le registre des écrans (souche n° 1). Ouvrir la carte de
  trame pour de vrai se fait donc par le **site public**, pas par un écran Jira.
- **Aucun appel Atlassian dans les tests.** Graphe, Confluence, LLM, horloge,
  file : des doubles. `tests/contract/no-forge-in-domain.test.ts` (3 verts)
  vérifie au contraire que le domaine n'importe jamais `@forge/*`.
- **Pas de publication Confluence réelle** : repli §21 (voir §4).
- **Le déploiement, lui, existe** mais ne se teste pas ici : app Forge
  `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51` en version
  2.1.0, environnement de développement, installée sur
  `one-atlas-cndz.atlassian.net` (Jira + Confluence). `forge lint` (CLI 14.2) :
  **0 erreur, 5 avertissements**. Aucun test de ce dépôt ne touche ce site.
- **Le Teamwork Graph reste partiel, et c'est dit dans l'app** : les objets
  `test-plan`, `test-run`, `test-execution`, `test-status` n'ont **aucune
  permission publiable** au catalogue Forge (646 portées, CLI 14.2). La v1 lit
  donc les actes là où ils existent — tickets Jira, commits, demandes de
  fusion, déploiements — via un connecteur de graphe écrit et testé (transport
  injectable, 10 permissions `read:graph:*`). Un droit manquant produit un
  **angle mort affiché**, jamais un trou (point 15).