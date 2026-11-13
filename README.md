# Trame — the coverage of your acceptance criteria

*Le fil qui manque* · Codegeist 2026 · app Atlassian Forge pour Jira.

## L'idée

Chaque critère d'acceptation est un **fil de chaîne** ; chaque test qui le
vérifie est un **passage de trame** : l'app tisse les deux, montre les **trous**
de la trame, et surtout les **perforations** — les fils modifiés après avoir été
tissés, dont la couverture s'est évaporée sans que personne ne le sache.

## Ce que l'app montre

- les **trous** : les critères sans aucun acte de vérification, classés par
  priorité (type de critère, zone à risque, récurrence de défauts) ;
- les **perforations** : les critères modifiés après leur dernière vérification,
  avec les deux dates et l'écart ;
- les **fils détendus** : les actes de vérification qui ne couvrent plus rien
  (test désactivé, renommé, critère supprimé) — ils **font baisser** la
  couverture affichée ;
- les **critères infalsifiables** : comptés à part, jamais comme des trous,
  avec une proposition de reformulation vérifiable ;
- la couverture sur trois axes jamais fusionnés (force, type de liaison,
  fraîcheur), un bulletin daté, un certificat opposable, et des propositions
  (test à écrire, reformulation, re-tissage) qui passent toutes par une file de
  validation.

Discipline de vocabulaire : **couvert** (un acte de vérification existe)
≠ **couvert fortement** (force machine ou attestée) ≠ **couvert à jour** (le
critère n'a pas changé depuis) ≠ **prouvé** (couvert fortement **et** à jour
**et** lié de façon déclarée). Le rapport ne dit jamais « couvert » seul : il
dit « couvert, par une déclaration, sur un critère périmé depuis 40 jours ».

## Vocabulaire

| Terme | Sens |
|---|---|
| Critère (fil de chaîne) | élément de la liste d'acceptation d'un ticket : identifiant stable (`AC-n`), texte, empreinte |
| Passage de trame | acte de vérification qui couvre un critère (exécution, attestation, déclaration) |
| Maille | case critère × vérification ; vide, elle est un trou |
| Trou | critère sans aucun acte de vérification |
| Perforation | critère modifié **après** sa vérification : couverture périmée |
| Fil détendu | acte de vérification qui ne couvre plus rien (test désactivé, renommé, critère supprimé) |
| Force | solidité d'un passage : machine (exécution verte), attestée (tiers + artefact), déclarée (affirmation) |
| Liaison | lien critère ↔ passage : déclarée (écrite) ou dérivée (proposée par similarité, avec confiance) |
| Critère infalsifiable | critère que rien ne peut vérifier (« l'application doit être rapide ») |
| Métré | règle qui décide de la priorité d'un trou (type, zone, récurrence) |

## Ce que l'app ne fait pas

- elle **ne bloque pas** la clôture d'un ticket : elle montre, elle propose,
  elle n'interdit rien ;
- elle **n'atteste jamais** à la place d'un humain : elle enregistre qui a fait
  quoi pour l'audit, et refuse d'attribuer un acte à un agent ;
- elle **n'invente pas** la couverture : une liaison déduite par similarité
  reste une proposition tant qu'elle n'est pas confirmée ;
- elle **ne déclare pas** un critère vérifiable sans preuve (artefact,
  exécution, référence) ;
- elle **ne note personne** : aucun score par personne, aucune statistique
  individuelle ;
- elle **ne garde aucun secret** : un critère ou un artefact contenant une clé
  est signalé avant d'être indexé.

## État (13/11/2026, `main @ 7c468f7`)

Trame n'est plus un socle : l'app tourne, elle est déployée, et le site public
exécute le vrai moteur.

- **455 tests verts, 53 fichiers** (`npm test`, quelques secondes à chaud) :
  domaine, écrans, outils, points d'entrée, tout passe sur des fakes en mémoire,
  sans réseau.
- **11 écrans réels** (§17) — carte de trame, fiche critère, explorateur de
  trous, registre des perforations, file des fils détendus, bulletin, certificat,
  file de validation, zones à risque, couverture, historique : view-models et
  handlers complets, enregistrés dans `src/handlers/resolver.ts`.
- **14 outils MCP réels** (§16) plus **4 actions internes**, un fichier par outil
  dans `src/actions/`, registre dans `src/handlers/dispatch.ts`.
- **Déclencheurs réels** : `trigger` sur ticket modifié, `scheduledTrigger`
  quotidien, `consumer` par tranches (900 s), `webtrigger` signé pour les
  pipelines, les **4 fonctions JQL** (`holes`, `perforated`, `dangling`,
  `uncovered`) et le validateur de workflow non bloquant.
- **L'interface UI Kit 2 est réelle** : 2 700 lignes, une façade
  (`src/ui/kit.tsx`), un pont vers le resolver (`src/ui/bridge.ts`), les onze
  écrans (`src/ui/screens/*`) et **cinq entrées**, une par module
  (`src/ui/frontend/{panel,page,project,gadget,certificates}.tsx`). Le montage
  passe par l'export **par défaut** de `@forge/react` (`ForgeReconciler.render`).
  Un garde (`tests/ui/no-raw-html.test.ts`) refuse toute balise HTML brut :
  le moteur de rendu d'Atlassian rejette les éléments inconnus, et une telle
  balise passerait les tests pour casser l'écran en production.
- **App Forge déployée en PRODUCTION** (v2.1.0) :
  `ari:cloud:ecosystem::app/5faa12e1-3a13-4d3c-977e-da1ad6931a51`, installée sur
  `one-atlas-cndz.atlassian.net`, en Jira et en Confluence. La chaîne complète
  y tourne : le trigger ingère un ticket modifié, le consumer recalcule le
  périmètre, les quatre fonctions JQL répondent.
- **Site public en ligne** : <https://tradoooo.github.io/trame/> — la démo
  importe `src/domain/*` et `src/sample/demo-project.ts`, les chiffres affichés
  sortent du moteur, ils ne sont pas écrits à la main.

Une souche reste, assumée et nommée ; un refus explicite s'y ajoute :

1. **La génération LLM** — `src/ingest/llm.ts` (reformulation, lecture de texte
   libre) est une souche ; le reste de l'ingestion est réel.
2. **L'écriture du certificat dans Confluence** n'est pas un silence : le
   connecteur refuse d'écrire (`src/ingest/confluence.ts`, `publishCertificate`
   → `null`) et l'action répond un refus explicite, avec le repli du cahier
   (certificat produit dans l'app, puis exporté à la main).

Le découpage en lots L1–L12 est livré ; l'ownership map par fichier reste dans
[docs/CONTRACTS.md](docs/CONTRACTS.md) §4.

## Voir l'app

- **Site public**, sans installation ni compte : <https://tradoooo.github.io/trame/>
  (démo jouable : perforations, trous, bulletin, certificat).
- **App Forge installée en production** (v2.1.0) sur
  `one-atlas-cndz.atlassian.net` — la page globale, en direct :
  <https://one-atlas-cndz.atlassian.net/jira/apps/5faa12e1-3a13-4d3c-977e-da1ad6931a51/c9c1adb8-adee-411d-b534-3583eebbc5b9>
  (capture : `docs/captures/06-app-jira-production.png`) :
  - Jira → menu **Apps** → **Trame** : la page globale, onze écrans derrière une
    seule route ;
  - ouverture d'un ticket → panneau **Criteria** (fiche critère) ;
  - page d'un projet → **Trame** (trame du projet et zones à risque) ;
  - tableau de bord → gadget **Weave bulletin** ;
  - Confluence → page globale **Weave certificates** ;
  - en JQL : `issue in holes()`, `issue in perforated()`, `issue in dangling()`,
    `issue in uncovered()`.

Pour redéployer : `forge deploy -e production`, puis `forge install --upgrade`
sur le site (voir la note Node ci-dessous). L'environnement de développement a
été désinstallé : le quota Forge SQL est partagé par installation d'app, et une
app site-wide qui réagit à chaque ticket le sature.

## Développer

Prérequis : Node.js (voir la note plus bas), npm, `python3` pour la garde des
limites, et la CLI Forge pour linter et déployer.

```bash
npm ci                # dépendances (package-lock)
npm test              # vitest run — 455 tests, fakes en mémoire, aucun réseau
npm run typecheck     # tsc --noEmit
npm run site:build    # construit le site public (Vite) dans dist/
npm run check:limits  # garde locale : fichiers < 500 lignes, fonctions < 50
npm run site:dev      # sert le site public en local, avec le vrai moteur
forge deploy -e production    # déploiement vers la production
```

La CI (checks requis `ci`, `ci-budget`, `couche0`) et la file de merge Mergify
sont décrites dans [docs/CI.md](docs/CI.md).

**Note Node — `forge lint` en local.** Au 13/11/2026, la CLI Forge (1.9.0) ne
supporte que `^22.23.4 || ^24.22.1 || >=26.12.1`. Le poste de développement
tourne Node v26.9.0, hors plage : `forge lint` y répond `nothing to lint`
(code 0) au lieu de linter — à lire comme un refus silencieux, pas comme un feu
vert. Avant un lint ou un déploiement : `nvm install 24 && nvm use 24`. Le reste
(`npm test`, `typecheck`, `site:build`, `check:limits`) tourne sur les Node
récents sans rien demander.

## Architecture

1. `src/index.ts` — câblage Forge uniquement (gelé).
2. `src/handlers/*`, `src/actions/*` — onze clés d'écran, quatorze outils MCP + quatre actions internes.
3. `src/viewmodel/*` — mise en forme pour l'UI et les rapports.
4. `src/domain/*` — logique pure : tissage, couverture, perforations, fils détendus, falsifiabilité, métré.
5. `src/ports.ts` — frontière unique (interfaces gelées) ; le domaine n'importe jamais `@forge/*`.
6. `src/collect/*` — six gîtes de critères ; `src/ingest/*` — actes de vérification.
7. `src/db/*` — Forge SQL, schéma complet (DDL dans `src/db/schema.ts`).
8. `tests/helpers/fakes.ts` — store en mémoire, passerelles fictives, horloge fixe : tout est testable sans Forge.

Détail : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Structure du dépôt

| Chemin | Contenu |
|---|---|
| `src/domain/` | logique pure : tissage, couverture, perforations, fils détendus, falsifiabilité, métré, certificat, propositions |
| `src/collect/` | extraction des critères — six gîtes (description, champ, tableau, pièce jointe, Confluence, ticket de test), normalisation, empreinte |
| `src/ingest/` | actes de vérification : Jira, Confluence, Bitbucket, commentaires, pipelines, requêtes graphe, `llm.ts` (seule souche) |
| `src/handlers/` | points d'entrée Forge : resolver (11 écrans), dispatch (outils), trigger, scheduled, consumer, webtrigger, 4 fonctions JQL, validateur |
| `src/actions/` | un fichier par outil : 14 outils MCP + 4 actions internes |
| `src/viewmodel/` | mise en forme pour les écrans et les rapports, une clé = un fichier |
| `src/db/` | Forge SQL : client, dépôts, correspondances et DDL (`schema.ts`) |
| `src/ui/frontend/` | les cinq entrées UI Kit 2 : `panel`, `page`, `project`, `gadget`, `certificates` |
| `src/i18n/` | dictionnaires EN / FR à parité |
| `src/sample/` | le projet de démonstration que joue le site public |
| `src/index.ts`, `ports.ts`, `types.ts`, `deps.ts` | câblage Forge gelé, frontière de ports, contrats |
| `site/` | le site public (Vite + React) ; sa démo importe `src/domain/*`, `npm run site:build` |
| `static/` | icône, prompt de l'agent Rovo, skill `before-closing-a-ticket` |
| `tests/` | 53 fichiers, miroir de `src/`, fakes en mémoire et horloge fixe |
| `tools/` | gardes locales : limites de fichiers et de fonctions, manifeste, workflows |
| `docs/` | spécification (§n cité partout), contrats, architecture, recette, dossier de soumission |
| `manifest.yml` | les modules Forge (panneaux, pages, champs, JQL, validateur, déclencheurs, outils) et leurs permissions |

## Documentation

- [docs/CAHIER-DES-CHARGES.md](docs/CAHIER-DES-CHARGES.md) — la spécification complète (§n cité partout ailleurs) ;
- [docs/CONTRACTS.md](docs/CONTRACTS.md) — fichiers gelés, ownership map, conventions ;
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — couches et flux de données ;
- [docs/METHODE.md](docs/METHODE.md) — un lot, un worktree, une PR ;
- [docs/CI.md](docs/CI.md) — checks requis, runner, budget, file Mergify, pièges ;
- [docs/CONFLICTS.md](docs/CONFLICTS.md) — l'agent de résolution de conflits InferHub.

### Dossier de soumission (Codegeist 2026)

- [docs/RECETTE.md](docs/RECETTE.md) — les vingt points du §24, un par un : ce que le
  point vérifie, la commande exacte, le fichier de test, l'état réel ;
- [docs/JUDGES.md](docs/JUDGES.md) — guide du jury : Trame en trente secondes, les
  trois jugements, ce que l'app ne fait pas, les dix questions ;
- [docs/VIDEO-SCRIPT.md](docs/VIDEO-SCRIPT.md) — le scénario de la vidéo, minuté
  (0:00 → 4:45), et les quatre captures à tourner ;
- [docs/SUBMISSION.md](docs/SUBMISSION.md) — la fiche de soumission : nom public,
  slogan, bonus visés, architecture, ce qui est prêt, checklist.

## Licence

MIT — voir [LICENSE](LICENSE).
