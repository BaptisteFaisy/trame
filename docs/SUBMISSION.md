# SUBMISSION — Trame

> Fiche de soumission Codegeist 2026, rédigée le 12 novembre 2026, base
> `origin/main` @ `b3f8cce` (`b3f8cced169c9d10f92f94ee9b72c4930122df12`).
> Tout ce qui est écrit ici est vérifiable dans le dépôt ; ce qui n'est pas
> encore écrit dans le dépôt est marqué comme tel.

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
- **état honnête** : le prompt et la configuration sont réels et complets ;
  les **corps** des quatorze outils renvoient encore `{ notImplemented: … }`
  (`src/actions/*.ts`), donc l'agent ne répond pas encore de chiffres. Le moteur
  de domaine qui produira ces chiffres, lui, est écrit et testé.

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
  `npx vitest run tests/contract/entry-points.test.ts` → « expose exactly the
  fourteen MCP tools of §16 », « keeps four internal actions out of Rovo ».
- **état honnête** : la surface MCP est réelle et testée ; les **corps** des
  quatorze outils renvoient `{ notImplemented: … }`.

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
- **état honnête** : l'application Forge existe et tourne — `forge create`
  (espace développeur `laddition`), `forge lint` sans erreur,
  `forge deploy -e development`, puis installation sur le site réel
  `one-atlas-cndz.atlassian.net` en **Jira** et en **Confluence**
  (identifiant `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51`).
  Le bundleur Forge (webpack/ts-loader) ne résout pas les imports relatifs
  `./x.js` : le code source les écrit sans extension (convention Forge). Les modules
  `trigger`, `scheduledTrigger`, `consumer` et `webtrigger` sont déclarés dans
  le manifeste et câblés dans `src/index.ts`, mais leurs corps restent des
  souches dans `origin/main` (ils arrivent avec `origin/lot/l10-triggers`).

## 3. L'architecture en dix lignes

1. `src/index.ts` — câblage Forge **gelé** : handler, dispatch, webtrigger,
   trigger, scheduledTrigger, consumer, validateur, quatre fonctions JQL.
2. `src/handlers/*` — le dispatch, le resolver (les onze clés d'écran du §17)
   et les points d'entrée Forge (déclencheur, consumer, pont signé webtrigger,
   validateur, quatre fonctions JQL). Onze clés d'écran renvoient une souche ;
   le déclencheur, le consumer, le pont signé, les fonctions JQL et le
   validateur sont les souches du socle dans `origin/main` (leurs corps arrivent
   avec le lot `origin/lot/l10-triggers`, non mergé).
3. `src/actions/*` — les quatorze outils MCP et quatre actions internes, un
   fichier par outil, signature `run(deps, payload, actor)` ; corps en souche.
4. `src/domain/*` — **logique pure**, écrite et testée : tissage, couverture,
   perforations, fils détendus, falsifiabilité, métré, zones, bulletin,
   certificat, témoin, chronologie. Jamais de `@forge/*`.
5. `src/ports.ts` — **la frontière unique** : passerelles Jira, Teamwork Graph,
   Bitbucket, Confluence, pipeline, LLM, secrets, et le `TrameStore`.
6. `src/collect/*` — les **six gîtes** d'un critère (champ, description,
   tableau, page Confluence, ticket de test, pièce jointe), l'**empreinte
   stable**, le dédoublonnage et la renumérotation.
7. `src/ingest/*` — les actes de vérification : graphe, Bitbucket, commentaires,
   pipeline signé (réels), Confluence et génération LLM (souches ; le cache par
   empreinte et le budget du LLM sont réels).
8. `src/db/*` — Forge SQL, **quinze tables** (§19), mappings aller-retour
   testés, aucune statistique par personne.
9. `src/i18n/*` et `src/ui/frontend/index.tsx` — dictionnaires EN/FR à parité
   vérifiée, resource UI (souche jusqu'au lot L9).
10. `src/sample/*` et `tests/helpers/*` — le projet de démonstration du §26,
    le scénario `TRAME-1`, store en mémoire, passerelles fictives, horloge
    injectable : **tout est testable sans Forge et sans réseau**.

## 4. Ce qui est prêt, ce qui reste

### Prêt et vérifié aujourd'hui (sur `origin/main`)

| Domaine | Preuve |
|---|---|
| Contrats gelés : types, ports, valeurs par défaut, seuils | `src/types.ts`, `src/ports.ts`, `src/defaults.ts` |
| Logique de domaine du §24 (17 points sur 20 avec test nominatif) | `src/domain/*` ; `tests/domain/*.test.ts` |
| Extraction multi-origine (§6) | `src/collect/*` ; `tests/collect/extraction.test.ts` (27 tests) |
| Actes de vérification : graphe, Bitbucket, commentaires, pipeline | `src/ingest/*` ; `tests/ingest/*.test.ts` |
| Persistance : quinze tables, mappings aller-retour, aucun score par personne | `src/db/*` ; `tests/db/persistence.test.ts` (13 tests) |
| Détection de secrets, sans jamais recopier la valeur | `src/domain/secrets.ts` ; `tests/domain/secrets.test.ts` (18 tests) |
| Surface MCP et écrans : quatorze outils, quatre actions internes, onze écrans | `src/handlers/dispatch.ts`, `src/handlers/resolver.ts` ; `tests/contract/entry-points.test.ts` (5 tests) |
| Projet de démonstration §26 | `src/sample/demo-project.ts` ; `tests/sample/demo-project.test.ts` (10 tests) |
| Manifeste Forge complet, agent Rovo, skill | `manifest.yml`, `static/agent/prompt.md`, `static/skill/` |
| Pipeline CI : `ci`, `ci-budget`, `couche0`, file Mergify, budget 5 min | `docs/CI.md`, `tools/` |

Bilan : **26 fichiers de test, 339 tests, tout vert** (`npm test`).

### Écrit, non mergé (branche publique)

| Branche | Contenu | Mesuré |
|---|---|---|
| `origin/lot/l10-triggers` | les déclencheurs, le consumer, le pont signé et les fonctions JQL | commit `261de13` ; `tests/handlers/triggers.test.ts` (233 lignes) |
| `origin/lot/l11b-site` | le site public de démonstration et la démo vivante | commit `fec1ba8` ; `site/` + `tests/site/demo-numbers.test.ts`, `demo-render.test.tsx` |

### Ce qui reste à écrire

| Lot | Contenu | Pourquoi c'est prioritaire |
|---|---|---|
| L8 outils | les corps des quatorze outils MCP et quatre actions internes | sans quoi les surfaces ne répondent rien |
| L9 écrans | les onze écrans UI Kit 2 | sans quoi la démo n'est pas jouable |
| L10 (reste) | le connecteur Confluence (écriture du certificat), la génération LLM, et le merge des déclencheurs (sur `origin/lot/l10-triggers`) | sans quoi le certificat n'atterrit pas et le recalcul ne se déclenche pas |
| L11b (fin) | merger le site public dans `main` | sans quoi les jugés n'ont pas de page publique |
| Cas nominatifs §24.1, §24.18, §24.19 | trois tests de recette numérotés | discipliner la recette, pas combler la logique |
| déploiement | `forge create` puis `forge deploy` | sans quoi rien ne tourne dans Jira |

## 5. Les liens

| Lien | Où | État |
|---|---|---|
| Dépôt | https://github.com/Tradoooo/trame | public ; base `origin/main` @ `b3f8cce` |
| Recette | [`docs/RECETTE.md`](RECETTE.md) | prêt : les vingt points, états vérifiés |
| Instructions aux jugés | [`docs/JUDGES.md`](JUDGES.md) | prêt |
| Scénario de la vidéo | [`docs/VIDEO-SCRIPT.md`](VIDEO-SCRIPT.md) | plan minuté prêt ; **la vidéo n'est pas tournée** |
| Démonstration | site public (`origin/lot/l11b-site`) et app déployée sur un site de développement | site **en branche, non mergé** ; l'app déployée **à publier** |
| Spécification | [`docs/CAHIER-DES-CHARGES.md`](CAHIER-DES-CHARGES.md) | en dépôt |
| Architecture | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/CONTRACTS.md`](CONTRACTS.md) | en dépôt |

## 6. Checklist de soumission

| # | Élément | Où | État |
|---|---|---|---|
| 1 | nom public, slogan, catégorie | §1 de cette fiche | fait |
| 2 | README : l'idée, le vocabulaire, ce que l'app ne fait pas, l'état du chantier | `README.md` | fait |
| 3 | recette des vingt points, avec la commande exacte et l'état réel | `docs/RECETTE.md` | fait |
| 4 | jeu de données de démonstration | `src/sample/demo-project.ts` (§26, testé) | fait |
| 5 | scénario de la vidéo minuté et liste des captures | `docs/VIDEO-SCRIPT.md` | fait (plan) ; **la vidéo reste à tourner** |
| 6 | instructions aux jugés, y compris l'installation en cinq minutes | `docs/JUDGES.md` | fait |
| 7 | application déployée sur un site de développement, démonstration jouable | à faire au gel du 15 décembre | **à faire** |
| 8 | liens de démonstration et de vidéo publiés dans la fiche de soumission | §5 | **à faire** (URL à confirmer) |
| 9 | bonus Teamwork Graph, Agents Rovo, MCP, Marketplace cochés, avec la preuve dans le dépôt | §2 | fait (permissions, agent, prompt, skill, quatorze outils et test de surface dans le dépôt) |
| 10 | discipline d'honnêteté opposable | §5 et §14 du cahier des charges, tests de contrat | fait |
| 11 | licence | `LICENSE` (MIT) | fait |

## 7. Ce que le jury retiendra

Une phrase : **Trame ne demande pas à l'équipe de tester davantage, elle lui
montre les mailles qui ne tiennent plus** — les perforations et les fils
détendus, les deux jugements que personne ne fait parce qu'ils demandent de
comparer le critère d'aujourd'hui au critère d'hier.

Et une limite assumée : **l'app ne bloque rien, n'atteste rien à la place de
personne et ne note personne.** Elle montre, elle propose, et elle déclare ce
qu'elle ne voit pas.