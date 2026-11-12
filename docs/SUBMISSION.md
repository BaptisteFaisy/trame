# SUBMISSION — Trame

> Fiche de soumission Codegeist 2026, rédigée le 12 novembre 2026 sur la
> branche `lot/l12-docs` (base `origin/main` @ `8f2acb8`).
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
| **Dépôt** | https://github.com/BaptisteFaisy/trame |
| **Échéance** | 22 décembre 2026, 21 h (Paris) — plan dans `docs/CAHIER-DES-CHARGES.md` §27 |
| **Angle mort visé** | un critère d'acceptation écrit et jamais vérifié — invisible jusqu'à l'incident |

## 2. Les bonus visés, et ce que le dépôt montre

### Teamwork Graph (bonus principal)

- `manifest.yml` demande **douze permissions `graph:*`** : `graph:work-item`,
  `graph:test-plan`, `graph:test-run`, `graph:test-execution`,
  `graph:test-status`, `graph:commit`, `graph:pull-request`,
  `graph:deployment`, `graph:project`, `graph:software-service`,
  `graph:document`, `graph:atlassian-user`.
- les **objets `test-*`** du graphe (`test-execution`, `test-run`,
  `test-status`, `test-plan`) sont la source de la force « machine » (§7,
  forme 1) et de la date qui permet de détecter une perforation.
- `src/ingest/graph.ts` implémente le port `GraphGateway` avec deux méthodes :
  `query(objectType, scope, since)` et `probe(objectType)`. La sonde distingue
  **« pas de droit »** de **« pas de données »** — un droit manquant vide le
  résultat sans erreur, et l'app le déclare au lieu d'afficher des trous
  (§18, §22).
- le graphe ne donne **pas** la relation critère ↔ test : Trame la reconstruit
  en quatre chemins (§9, §10), dont deux déterministes — mention explicite
  (`AC-3`) et convention de nommage (`PROJ-12.testShouldRetry`).
- **état honnête** : le connecteur n'est **pas encore écrit** (lot L2) —
  `query` renvoie `[]` et `probe` déclare honnêtement `no-right`. Le port, la
  politique de droits et la stratégie de reconstruction sont figés.

### Agents Rovo

- `manifest.yml`, module `rovo:agent`, clé **`le-fil`**, nom **« Le fil »**,
  avec quatre conversation starters (les questions du §16), les **quatorze
  actions** du §16 et un `followUpPrompt` (« Ask what is still not proven in
  this scope »).
- `static/agent/prompt.md` est le prompt système complet : **neuf règles
  non-négociables** — chaque chiffre porte son dénominateur et sa date, les
  trois axes ne sont jamais fusionnés, une liaison dérivée n'est jamais une
  couverture, les quatre absences sont distinguées, sous cinq critères l'agent
  refuse de conclure, jamais de classement de personne, jamais d'attestation à
  la place d'un humain, chaque critère est cité avec sa source, et rien de
  produit n'est appliqué sans validation.
- la skill **`before-closing-a-ticket`** est publiée en source ouverte :
  `static/skill/before-closing-a-ticket/SKILL.md`.
- **état honnête** : le prompt et la configuration sont réels et complets ;
  l'agent répondra des chiffres dès que les outils auront un corps (lot L8).

### MCP

- `manifest.yml`, module `rovo:mcp`, clé `trame-mcp`, liste **exactement les
  quatorze outils** du §16 : `get-coverage`, `list-holes`,
  `list-perforations`, `list-dangling`, `get-criterion`, `propose-test`,
  `propose-reformulation`, `confirm-link`, `reject-link`, `get-bulletin`,
  `get-certificate`, `list-unverifiable`, `get-zones-risk`,
  `get-coverage-timeline`.
- les mêmes quatorze sont exposés comme modules `action` (verbes GET, CREATE,
  UPDATE) ; les **quatre actions internes** (`recompute`, `set-metric-rule`,
  `save-witness`, `publish-certificate`) restent hors de Rovo, parce
  qu'elles écrivent dans les registres.
- `src/handlers/dispatch.ts` est le registre : `MCP_TOOL_KEYS` (14),
  `INTERNAL_ACTION_KEYS` (4), et une clé inconnue est **refusée**, jamais
  devinée.
- la surface est **vérifiée par un test** :
  `npx vitest run tests/contract/entry-points.test.ts` → « expose exactly the
  fourteen MCP tools of §16 », « keeps four internal actions out of Rovo ».
- **état honnête** : la surface MCP est réelle et testée ; les **corps** des
  quatorze outils renvoient `{ notImplemented: … }` (lot L8).

### Marketplace

- `manifest.yml` est complet et cohérent : application Jira (Confluence
  optionnel), runtime `nodejs22.x` / x86_64 / 512 Mo, **dix-neuf types de
  modules** — `jira:issuePanel`, `jira:customField` ×3, `jira:globalPage`,
  `jira:projectPage`, `jira:dashboardGadget`, `jira:jqlFunction` ×4,
  `jira:workflowValidator`, `confluence:globalPage`, `confluence:macro`,
  `rovo:agent`, `rovo:mcp`, `action` ×18, `function` ×11, `webtrigger`,
  `consumer`, `trigger`, `scheduledTrigger`, `sql`, `llm` — et
  **dix-neuf permissions** dont **douze `graph:*`**.
- `LICENSE` (MIT), `README.md`, et le dossier `docs/` (six documents issus du
  socle, plus les quatre documents de soumission de ce lot).
- **état honnête** : `forge deploy` n'a pas encore été exécuté et l'identifiant
  d'application du manifeste est provisoire
  (`ari:cloud:ecosystem::app/3dfebaa0-bb65-471b-be6b-aaee3033ed99`) : il sera
  remplacé par `forge create` avant la mise en Marketplace.

## 3. L'architecture en dix lignes

1. `src/index.ts` — câblage Forge **gelé** : handler, dispatch, webtrigger,
   trigger, scheduledTrigger, consumer, validateur, quatre fonctions JQL.
2. `src/handlers/*` — les onze clés d'écran du §17, plus les déclencheurs et le
   consumer ; une clé = un fichier = un lot.
3. `src/actions/*` — les quatorze outils MCP, un fichier par outil, signature
   gelée `run(deps, payload, actor)`.
4. `src/domain/*` — **logique pure** : tissage, couverture, perforations, fils
   détendus, falsifiabilité, métré, bulletin, certificat. Jamais de `@forge/*`,
   jamais d'horloge système : la date vient de l'entrée.
5. `src/ports.ts` — **la frontière unique** : passerelles Jira, Teamwork Graph,
   Bitbucket, Confluence, pipeline, LLM, secrets, et le `TrameStore`.
6. `src/collect/*` — les **six gîtes** d'un critère (champ, description,
   tableau, page Confluence, ticket de test, pièce jointe) et l'**empreinte
   stable** qui rend la perforation détectable.
7. `src/ingest/*` — les actes de vérification : graphe, Bitbucket, Jira,
   Confluence, pipeline signé, et le LLM (cache par empreinte, budget quotidien
   tenu et affiché).
8. `src/db/*` — Forge SQL, **quinze tables** (§19), mappings aller-retour
   testés, aucune statistique par personne.
9. `src/i18n/*` et `src/ui/frontend/index.tsx` — dictionnaires EN/FR à parité
   vérifiée, resource UI (souche jusqu'au lot L9).
10. `tests/helpers/*` — store en mémoire, passerelles fictives, horloge figée,
    scénario `TRAME-1` : **tout est testable sans Forge et sans réseau**.

## 4. Ce qui est prêt, ce qui reste

### Prêt et vérifié aujourd'hui (sur `origin/main`)

| Domaine | Preuve |
|---|---|
| Contrats gelés : types, ports, valeurs par défaut, seuils | `src/types.ts`, `src/ports.ts`, `src/defaults.ts` ; `tests/contract/honesty.test.ts` (10 tests) |
| Persistance : quinze tables, mappings aller-retour, aucun score par personne | `src/db/*` ; `tests/db/persistence.test.ts` (13 tests) |
| Empreinte stable des critères (le fond de la perforation) | `src/collect/fingerprint.ts` ; `tests/collect/fingerprint.test.ts` (10 tests) |
| Détection de secrets, sans jamais recopier la valeur | `src/domain/secrets.ts` ; `tests/domain/secrets.test.ts` (18 tests) |
| Surface MCP et écrans : quatorze outils, quatre actions internes, onze écrans | `src/handlers/dispatch.ts`, `src/handlers/resolver.ts` ; `tests/contract/entry-points.test.ts` (5 tests) |
| Manifeste Forge complet, agent Rovo, skill, plan de pipeline | `manifest.yml`, `static/agent/prompt.md`, `static/skill/` |
| Pipeline CI : `ci`, `ci-budget`, `couche0`, file Mergify, budget 5 min | `docs/CI.md`, `tools/` |

Bilan : **8 fichiers de test, 77 tests, tout vert** (`npm test`, ~4 s).

### Écrit, testé, en revue — pas encore mergé

| Lot | Contenu | Mesuré |
|---|---|---|
| L4 couverture | `src/domain/coverage.ts`, `bulletin.ts`, `witness.ts`, `timeline.ts`, `percent.ts` | branche `origin/lot/l4-couverture` : 10 fichiers, **110 tests verts** |
| L5 perforations | `src/domain/perforations.ts`, `dangling.ts` | branche `origin/lot/l5-perforations` : 10 fichiers, **102 tests verts** |

### Ce qui reste à écrire

| Lot | Contenu | Pourquoi c'est prioritaire |
|---|---|---|
| L1 extraction | les six origines de critères, l'empreinte branchée | sans quoi il n'y a pas de maille |
| L2 actes | Teamwork Graph, Bitbucket, Jira, Confluence, pipeline signé | sans quoi la force « machine » n'existe pas |
| L3 tissage | les quatre chemins de liaison, la confiance, l'apprentissage | sans quoi il n'y a pas de lien |
| L6 falsifiabilité | détection et reformulation | sans quoi les infalsifiables sont des trous |
| L7 métré | priorité des trous, zones à risque | sans quoi les trous ne sont pas classés |
| L8 outils et agent | les corps des quatorze outils, l'agent, la file de validation | sans quoi les surfaces ne répondent rien |
| L9 écrans | les onze écrans UI Kit 2 | sans quoi la démo n'est pas jouable |
| L10 certificat | certificat de trame, déclencheurs, consumer | sans quoi le certificat n'existe pas |
| L11 démo | projet de démonstration semé (§26), site public | sans quoi les jugés n'ont rien à tester |
| L12 docs | les quatre documents de ce dossier | fait par ce lot |

## 5. Les liens

| Lien | Où | État |
|---|---|---|
| Dépôt | https://github.com/BaptisteFaisy/trame | public ; branche de soumission `lot/l12-docs`, base `origin/main` |
| Recette | [`docs/RECETTE.md`](RECETTE.md) | prêt : les vingt points, états vérifiés |
| Instructions aux jugés | [`docs/JUDGES.md`](JUDGES.md) | prêt |
| Scénario de la vidéo | [`docs/VIDEO-SCRIPT.md`](VIDEO-SCRIPT.md) | plan minuté prêt ; **la vidéo n'est pas tournée** |
| Démonstration | site public de démonstration (lot L11) et app déployée sur un site de développement | **à publier** — l'URL sera communiquée au gel du 15 décembre ; le dossier `site/` n'existe pas encore |
| Spécification | [`docs/CAHIER-DES-CHARGES.md`](CAHIER-DES-CHARGES.md) | en dépôt |
| Architecture | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/CONTRACTS.md`](CONTRACTS.md) | en dépôt |

## 6. Checklist de soumission

| # | Élément | Où | État |
|---|---|---|---|
| 1 | nom public, slogan, catégorie | §1 de cette fiche | fait |
| 2 | README : l'idée, le vocabulaire, ce que l'app ne fait pas, l'état du chantier | `README.md` | fait (l'état du chantier est daté : socle posé, L1–L11 listés) |
| 3 | recette des vingt points, avec la commande exacte et l'état réel | `docs/RECETTE.md` | fait |
| 4 | jeu de données de démonstration | `tests/helpers/scenario.ts` (`TRAME-1`) ; projet complet du §26 | **partiel** — le scénario existe et est réel ; le projet de 6 tickets et 24 critères reste à semer (lot L11) |
| 5 | scénario de la vidéo minuté et liste des captures | `docs/VIDEO-SCRIPT.md` | fait (plan) ; **la vidéo reste à tourner** |
| 6 | instructions aux jugés, y compris l'installation en cinq minutes | `docs/JUDGES.md` | fait |
| 7 | application déployée sur un site de développement, démonstration jouable | à faire au gel du 15 décembre | **à faire** |
| 8 | liens de démonstration et de vidéo publiés dans la fiche de soumission | §5 | **à faire** (URL à confirmer) |
| 9 | bonus Teamwork Graph, Agents Rovo, MCP, Marketplace cochés, avec la preuve dans le dépôt | §2 | fait (les permissions, l'agent, le prompt, la skill, les quatorze outils et le test de surface sont dans le dépôt) |
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
