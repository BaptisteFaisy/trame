# SUBMISSION — Trame

> Fiche de soumission Codegeist 2026, rédigée le 12 novembre 2026 et remise à
> jour le 13 novembre 2026 sur la base `origin/main` @ `7c468f7`
> (`7c468f7bdb33d9d731b71551e2d30a8e7174e657`).
> Tout ce qui est écrit ici est vérifiable dans le dépôt ; ce qui n'est pas
> encore écrit dans le dépôt est marqué comme tel.
>
> Mesures du 13 novembre 2026 au soir : `npx vitest run` → **455 tests verts,
> 53 fichiers** ; `forge lint` → **0 erreur, 4 avertissements** (les quatre
> actions internes, attendues) ; application `v2.1.0` **déployée en production
> et installée** en Jira et en Confluence sur `one-atlas-cndz.atlassian.net`.

## 1. La fiche

| Champ | Valeur |
|---|---|
| **Nom public** | **Trame — the coverage of your acceptance criteria** |
| **Slogan** | *le fil qui manque* (*the thread that is missing*) |
| **Catégorie** | **Apps for Software Teams** |
| **Une phrase** | Trame tisse les critères d'acceptation et les actes qui les vérifient, et montre les trous, les perforations et les fils détendus — la couverture qui a disparu sans que personne ne le sache. |
| **Type** | App Atlassian Forge pour Jira (lecture-écriture légère), écriture du certificat dans Confluence |
| **Droit** | MIT (`LICENSE`) |
| **Dépôt** | https://github.com/Tradoooo/trame |
| **Échéance** | 22 décembre 2026, 21 h (Paris) — plan dans `docs/CAHIER-DES-CHARGES.md` §27 |
| **Angle mort visé** | un critère d'acceptation écrit et jamais vérifié — invisible jusqu'à l'incident |

## 2. Les bonus visés, et ce que le dépôt montre

### Teamwork Graph (bonus principal)

- `manifest.yml` demande **dix permissions `read:graph:*`** (issues Jira,
  work items externes, projets, commits, demandes de fusion, deploiements,
  documents, pages Confluence, utilisateurs, services) ; dix-huit permissions
  au total. Les objets de test du graphe (`test-plan`, `test-run`,
  `test-execution`, `test-status`) **n'ont aucune permission publiable** au
  13/11/2026 : le catalogue Forge (646 portees, CLI 14.2) n'en expose pas
  une seule. Les actes de verification sont donc lus la ou ils existent
  vraiment — tickets Jira, commits, demandes de fusion, deploiements — et la
  couverture se calcule sur ces sources.
- le connecteur est **écrit et câblé** : `src/ingest/graph.ts` exécute la
  requête documentée du type d'objet (`src/ingest/graph-queries.ts`),
  convertit les nœuds (`src/ingest/graph-mapping.ts`) et lit au nom de
  l'utilisateur (`api.asUser().requestTeamworkGraph`). Le transport est
  injectable : les tests n'ont jamais besoin du réseau.
- la sonde `probe` distingue **« pas de droit »** (`no-right`), **« pas de
  données »** (`no-data`) et **« pas de test »** (`no-test`) : un droit manquant
  vide le résultat sans erreur et n'est jamais rapporté comme un trou
  (`tests/ingest/probe.test.ts`, 9 tests, `§24.15`).
- le graphe ne donne **pas** la relation critère ↔ test : Trame la reconstruit
  en quatre chemins (§9, §10), dont deux déterministes — mention explicite et
  convention de nommage (`PROJ-12.`), testés dans `tests/domain/links.test.ts`
  et `tests/ingest/bitbucket-mapping.test.ts` (`§24.17`).

### Agents Rovo

- `manifest.yml`, module `rovo:agent`, clé **`le-fil`**, nom **« Le fil »**,
  quatre conversation starters, les **quatorze actions** du §16 et un
  `followUpPrompt` (« Ask what is still not proven in this scope »).
- `static/agent/prompt.md` est le prompt système complet (neuf règles
  non-négociables : chaque chiffre porte son dénominateur et sa date, les trois
  axes ne sont jamais fusionnés, une liaison dérivée n'est jamais une
  couverture, les quatre absences sont distinguées, sous cinq critères l'agent
  refuse de conclure, jamais de classement de personne, jamais d'attestation à
  la place d'un humain, chaque critère est cité avec sa source, rien n'est
  appliqué sans validation).
- la skill **`before-closing-a-ticket`** est publiée en source ouverte :
  `static/skill/before-closing-a-ticket/SKILL.md`.
- **état honnête** : le prompt et la configuration sont réels et complets, et les
  **corps des quatorze actions sont écrits** (`src/actions/*.ts`, un fichier par
  outil, dix-huit fichiers de test dans `tests/actions/`). L'agent répond donc de
  vrais chiffres, calculés par `src/domain/*` sur les données lues par
  `src/ingest/*`. Ce qui reste ouvert : les deux contenus **générés** —
  reformulation d'un critère et brouillon de test — renvoient `notImplemented`
  (`src/ingest/llm.ts`) ; le cache par empreinte et le budget du modèle, eux,
  sont réels.

### MCP

- `manifest.yml`, module `rovo:mcp`, clé `trame-mcp`, liste **exactement les
  quatorze outils** du §16 (de `get-coverage` à `get-coverage-timeline`).
- les mêmes quatorze sont exposés comme modules `action` (verbes GET/CREATE/
  UPDATE) ; les **quatre actions internes** (`recompute`, `set-metric-rule`,
  `save-witness`, `publish-certificate`) restent hors de Rovo.
- `src/handlers/dispatch.ts` est le registre : `MCP_TOOL_KEYS` (14),
  `INTERNAL_ACTION_KEYS` (4), et une clé inconnue est **refusée**, jamais
  devinée (`src/index.ts` `actionKeyOf`).
- la surface est **vérifiée par un test** :
  `npx vitest run tests/contract/entry-points.test.ts` → cinq tests, dont
  « expose exactly the fourteen MCP tools of §16 », « keeps four internal
  actions out of Rovo », « answers on every action key » et « refuses an
  unknown action instead of guessing ».
- **état honnête** : la surface MCP est réelle, testée, et **les quatorze
  outils répondent** — plus aucune coquille `{ notImplemented: … }` dans
  `src/actions/` (seul `src/ingest/llm.ts` en porte encore, pour les deux
  contenus générés cités plus haut).

### Marketplace

- `manifest.yml` est complet et cohérent : application Jira (Confluence
  optionnel), runtime `nodejs22.x` / x86_64 / 512 Mo, **dix-huit types de
  modules** — `jira:issuePanel`, `jira:customField` ×3, `jira:globalPage`,
  `jira:projectPage`, `jira:dashboardGadget`, `jira:jqlFunction` ×4,
  `jira:workflowValidator`, `confluence:globalPage`,
  `webtrigger`, `consumer`, `trigger`, `scheduledTrigger`, `sql`, `llm`,
  `function` ×11, `action` ×18, `rovo:agent`, `rovo:mcp` — et **dix-huit
  permissions** dont **dix `read:graph:*`**. Le module `confluence:macro`
  n'existe pas dans la CLI Forge 14.2 : il a été retiré au lieu d'écrire une
  forme qui ne se déploie pas (le bulletin se lit dans Jira).
- `LICENSE` (MIT), `README.md`, et le dossier `docs/` (spécification complète,
  contrats, architecture, recette, instructions aux jugés, scénario vidéo).
- **état honnête** : l'application Forge existe et tourne —
  identifiant `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51`,
  version `2.1.0` **en production**, `forge lint` sans erreur
  (4 avertissements : les quatre actions internes), installée sur le site réel
  `one-atlas-cndz.atlassian.net` en **Jira** et en **Confluence** (page
  « weave-certificates »).
  Le bundleur Forge (webpack/ts-loader) ne résout pas les imports relatifs
  `./x.js` : le code source les écrit sans extension (convention Forge).
- les modules `trigger` (événement de ticket), `scheduledTrigger` (recalcul
  nocturne), `consumer` (file de recalcul par tranches), `webtrigger` (pont
  signé des pipelines), le `jira:workflowValidator` et les quatre
  `jira:jqlFunction` sont déclarés dans le manifeste **et câblés avec leurs
  corps réels** dans `src/index.ts` / `src/handlers/*`
  (`tests/handlers/triggers.test.ts`, 14 tests) : ce ne sont plus des souches.

## 3. L'architecture en dix lignes

1. `src/index.ts` — câblage Forge **réel** : handler du resolver, dispatch des
   actions, pont signé webtrigger, trigger d'événement de ticket,
   scheduledTrigger, consumer de recalcul, validateur de workflow et quatre
   fonctions JQL. Une clé inconnue est refusée.
2. `src/handlers/*` — le dispatch, le resolver et les points d'entrée Forge. Les
   **onze clés d'écran du §17** sont déclarées dans l'ordre et chacune rend un
   view-model réel (`src/handlers/resolver.ts`) ; déclencheur, consumer, pont
   signé, quatre fonctions JQL et validateur ont leurs corps réels, testés.
3. `src/actions/*` — les **quatorze outils MCP et quatre actions internes**, un
   fichier par outil, signature `run(deps, payload, actor)` ; les dix-huit corps
   sont écrits et chacun a son fichier de test.
4. `src/viewmodel/*` — treize modules purs qui préparent l'affichage des onze
   écrans : carte de trame, fiche critère, trous, perforations, fils détendus,
   bulletin, certificat, file de validation, zones à risque, couverture,
   chronologie, plus les libellés et l'outillage partagés.
5. `src/domain/*` — **logique pure**, écrite et testée : tissage, couverture,
   perforations, fils détendus, falsifiabilité, métré, zones, bulletin,
   certificat, témoin, chronologie. Jamais de `@forge/*`.
6. `src/ports.ts` et `src/deps.ts` — **la frontière unique** : passerelles Jira,
   Teamwork Graph, Bitbucket, Confluence, pipeline, LLM, secrets, et le
   `TrameStore`. Tout est injectable, donc tout est testable sans réseau.
7. `src/collect/*` — les **six gîtes** d'un critère (champ, description,
   tableau, page Confluence, ticket de test, pièce jointe), l'**empreinte
   stable**, le dédoublonnage et la renumérotation.
8. `src/ingest/*` — les actes de vérification : graphe Teamwork Graph,
   Bitbucket, commentaires, pipeline signé et tickets Jira sont **réels** ;
   le connecteur Confluence est en **repli explicite** (lecture vide, écriture
   du certificat non câblée, journalisée) et la génération LLM est une souche
   marquée `notImplemented` — cache par empreinte et budget réels.
9. `src/ui/*` et `src/i18n/*` — l'**interface UI Kit 2 est réelle** : la façade
   (`src/ui/kit.tsx`), le pont vers le resolver (`src/ui/bridge.ts`), le
   montage (`src/ui/mount.ts`, via l'export par défaut `ForgeReconciler.render`
   de `@forge/react`), les onze écrans (`src/ui/screens/*`) et cinq entrées,
   une par module (`src/ui/frontend/{panel,page,project,gadget,certificates}.tsx`).
   Un garde (`tests/ui/no-raw-html.test.ts`) refuse toute balise HTML brut : le
   moteur de rendu d'Atlassian rejette les éléments inconnus et une telle balise
   casserait l'écran en production sans laisser de trace. Les dictionnaires
   EN/FR sont à parité vérifiée par le compilateur et par
   `tests/i18n/dictionary.test.ts`.
10. `src/sample/*` et `tests/helpers/*` — le projet de démonstration du §26, le
    scénario `TRAME-1`, store en mémoire, passerelles fictives, horloge
    injectable : **tout est testable sans Forge et sans réseau** — 455 tests,
    53 fichiers.

## 4. Ce qui est prêt, ce qui reste

### Prêt et vérifié aujourd'hui (sur `origin/main` @ `7c468f7`)

| Domaine | Preuve |
|---|---|
| Contrats gelés : types, ports, valeurs par défaut, seuils | `src/types.ts`, `src/ports.ts`, `src/defaults.ts` ; `tests/contract/honesty.test.ts` |
| Logique de domaine du §24 (les 20 points portent au moins un test nommé d'après le point) | `src/domain/*` ; `tests/domain/*.test.ts` (12 fichiers) |
| Extraction multi-origine (§6) | `src/collect/*` ; `tests/collect/extraction.test.ts` (27 tests) |
| Actes de vérification : graphe, Bitbucket, commentaires, pipeline | `src/ingest/*` ; `tests/ingest/*.test.ts` (5 fichiers, dont `probe.test.ts` 9 tests) |
| Persistance : quinze tables, mappings aller-retour, aucun score par personne | `src/db/*` ; `tests/db/persistence.test.ts` (13 tests) |
| Détection de secrets, sans jamais recopier la valeur | `src/domain/secrets.ts` ; `tests/domain/secrets.test.ts` (18 tests) |
| Les 14 outils MCP et 4 actions internes, corps réels | `src/actions/*` (20 fichiers : dix-huit outils, plus `common.ts` et `link-decision.ts`) ; `tests/actions/` (18 fichiers de test, un par outil) ; `tests/contract/entry-points.test.ts` (5 tests) |
| Les 11 écrans du §17 : view-models et handlers réels | `src/viewmodel/*`, `src/handlers/*` ; `tests/handlers/screens.test.ts`, `tests/viewmodel/weave-map.test.ts` |
| Déclencheur, consumer, webtrigger signé, 4 JQL, validateur | `src/index.ts`, `src/handlers/*` ; `tests/handlers/triggers.test.ts` (14 tests) |
| Projet de démonstration §26 et site public | `src/sample/demo-project.ts` (10 tests) ; `site/` et `tests/site/` (12 tests) qui exécutent le vrai moteur |
| Manifeste Forge complet, agent Rovo, skill | `manifest.yml`, `static/agent/prompt.md`, `static/skill/` |
| Pipeline CI : `ci`, `ci-budget`, `couche0`, file Mergify, budget 5 min, runner `r630-trame-01` | `docs/CI.md`, `tools/`, `.github/workflows/` |
| Agent de conflits « hermes » sur InferHub | `docs/CONFLICTS.md` ; PR #19 mergée, PR #21 `CONFLICTING` réconciliée par l'agent |

Bilan mesuré le 13 novembre 2026 au soir : **53 fichiers de test, 455 tests,
tout vert** (`npx vitest run`).

### Ce qui reste réellement ouvert

| Chantier | Où c'est | État exact |
|---|---|---|
| Écriture du certificat dans Confluence | `src/ingest/confluence.ts` | `publishCertificate` renvoie `null` et journalise le repli §21 : le certificat est produit dans l'app puis exporté |
| Génération LLM : reformulation d'un critère, brouillon de test | `src/ingest/llm.ts` | `notImplemented` explicite ; cache par empreinte et budget réels |
| Vidéo de démonstration | `docs/VIDEO-SCRIPT.md` | plan minuté prêt ; **la vidéo n'est pas tournée** |
| Publication Marketplace | app Forge `v2.1.0` en **production** | déployée en production et installée en Jira et en Confluence ; **pas** soumise à la Marketplace (l'app porte un `webtrigger`, ce qui la rend inéligible au programme « Runs on Atlassian » — le pont signé des pipelines est la source de la force « machine », c'est un arbitrage de gelée) |

## 5. Les liens

| Lien | Où | État |
|---|---|---|
| Dépôt | https://github.com/Tradoooo/trame | public ; base `origin/main` @ `7c468f7` |
| Démonstration publique | https://tradoooo.github.io/trame/ | **en ligne** ; la page exécute le vrai moteur (`site/`, mesuré par `tests/site/`, 12 tests) |
| App Forge déployée | `one-atlas-cndz.atlassian.net` (Jira + Confluence) | **en production**, `v2.1.0`, ARI `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51` ; page globale : <https://one-atlas-cndz.atlassian.net/jira/apps/5faa12e1-3a13-4d3c-977e-da1ad6931a51/c9c1adb8-adee-411d-b534-3583eebbc5b9> (capture : `docs/captures/06-app-jira-production.png`) |
| Recette | [`docs/RECETTE.md`](RECETTE.md), [`docs/RECETTE-POINTS.md`](RECETTE-POINTS.md) | vingt points, commandes exactes ; états mesurés le 13/11/2026 sur `7c468f7` |
| Instructions aux jugés | [`docs/JUDGES.md`](JUDGES.md) | en dépôt, base `7c468f7` |
| Scénario de la vidéo | [`docs/VIDEO-SCRIPT.md`](VIDEO-SCRIPT.md) | plan minuté prêt ; **la vidéo n'est pas tournée** |
| Conflits et agent hermes | [`docs/CONFLICTS.md`](CONFLICTS.md) | en dépôt, preuves PR #19 et #21 |
| Spécification | [`docs/CAHIER-DES-CHARGES.md`](CAHIER-DES-CHARGES.md) | en dépôt |
| Architecture | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/CONTRACTS.md`](CONTRACTS.md) | en dépôt |

## 6. Checklist de soumission

| # | Élément | Où | État |
|---|---|---|---|
| 1 | nom public, slogan, catégorie | §1 de cette fiche | fait |
| 2 | README : l'idée, le vocabulaire, ce que l'app ne fait pas, l'état du chantier | `README.md` | fait |
| 3 | recette des vingt points, avec la commande exacte et l'état réel | `docs/RECETTE.md`, `docs/RECETTE-POINTS.md` | **fait** : 20/20 points mesurés le 13/11/2026 sur `7c468f7` |
| 4 | jeu de données de démonstration | `src/sample/demo-project.ts` (§26, testé) | fait |
| 5 | scénario de la vidéo minuté et liste des captures | `docs/VIDEO-SCRIPT.md` | fait (plan) ; **la vidéo reste à tourner** |
| 6 | instructions aux jugés, y compris l'installation en cinq minutes | `docs/JUDGES.md` | **fait** : 455 tests, app déployée en production |
| 7 | application déployée sur un site | `one-atlas-cndz.atlassian.net`, `v2.1.0` **production** | **fait** (déployée en production, installée en Jira et en Confluence) ; l'interface UI Kit 2 rend les onze écrans — capture à l'appui |
| 8 | liens de démonstration et de vidéo publiés dans la fiche de soumission | §5 | démonstration **fait** (site public en ligne) ; vidéo **à faire** |
| 9 | bonus Teamwork Graph, Agents Rovo, MCP, Marketplace cochés, avec la preuve dans le dépôt | §2 | fait : permissions et rectification TWG, agent `le-fil`, prompt, skill, 14 outils + 4 actions internes avec leurs corps et leurs tests, manifeste de 18 types de modules |
| 10 | discipline d'honnêteté opposable | §5 et §14 du cahier des charges ; `tests/contract/honesty.test.ts` | fait |
| 11 | licence | `LICENSE` (MIT) | fait |

## 7. Ce que le jury retiendra

Une phrase : **Trame ne demande pas à l'équipe de tester davantage, elle lui
montre les mailles qui ne tiennent plus** — les perforations et les fils
détendus, les deux jugements que personne ne fait parce qu'ils demandent de
comparer le critère d'aujourd'hui au critère d'hier.

Et une limite assumée : **l'app ne bloque rien, n'atteste rien à la place de
personne et ne note personne.** Elle montre, elle propose, et elle déclare ce
qu'elle ne voit pas.