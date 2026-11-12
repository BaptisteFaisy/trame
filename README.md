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

## Installer et développer

Prérequis : Node.js 20+, npm, et le CLI Forge (`npm i -g @forge/cli`) pour
linter et déployer.

```bash
npm ci                # dépendances
npm test              # vitest run — tests unitaires (fakes en mémoire, aucun réseau)
npm run typecheck     # tsc --noEmit
npm run check:limits  # garde : fichiers < 500 lignes
forge lint            # lint Forge
forge deploy          # déploiement vers le site de développement
```

La CI (checks requis `ci`, `ci-budget`, `couche0`) et la file de merge Mergify
sont décrites dans [docs/CI.md](docs/CI.md).

## Architecture

1. `src/index.ts` — câblage Forge uniquement (gelé).
2. `src/handlers/*`, `src/actions/*` — onze clés d'écran, quatorze outils MCP + quatre actions internes.
3. `src/viewmodel/*` — mise en forme pour l'UI et les rapports.
4. `src/domain/*` — logique pure : tissage, couverture, perforations, fils détendus, falsifiabilité, métré.
5. `src/ports.ts` — frontière unique (interfaces gelées) ; le domaine n'importe jamais `@forge/*`.
6. `src/collect/*` — six gîtes de critères ; `src/ingest/*` — actes de vérification.
7. `src/db/*` — Forge SQL, quinze tables (DDL dans `src/db/schema.ts`).
8. `tests/helpers/fakes.ts` — store en mémoire, passerelles fictives, horloge fixe : tout est testable sans Forge.

Détail : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## État du chantier

Le **socle (L0) est posé** : contrats gelés (types, ports, valeurs par défaut),
points d'entrée en souches, DDL, fakes, pipeline CI. Les écrans ne sont pas
encore fonctionnels — ce sont des souches. Les lots L1 à L12 restent à livrer
(ownership map : [docs/CONTRACTS.md](docs/CONTRACTS.md) §4) :

| Lot | Périmètre | Dépend de |
|---|---|---|
| L0 socle | contrats, points d'entrée, DDL, pipeline, fakes | — |
| L1 extraction | `src/collect/*`, `tests/collect/*` | L0 |
| L2 vérifications | `src/ingest/*`, `tests/ingest/*` | L0 |
| L3 tissage | `src/domain/links.ts`, `confidence.ts` | L0 |
| L4 couverture | `src/domain/coverage.ts`, `bulletin.ts`, `witness.ts`, `timeline.ts` | L0 |
| L5 perforations | `src/domain/perforations.ts`, `dangling.ts` | L0 |
| L6 falsifiabilité | `src/domain/falsifiability.ts`, `proposals.ts` | L0 |
| L7 métré | `src/domain/metric.ts`, `zones.ts`, `holes.ts` | L0 |
| L8 outils et agent | `src/actions/*`, `static/agent/`, `static/skill/` | L3–L7 |
| L9 écrans | `src/viewmodel/*`, `src/ui/*`, `src/handlers/*` | L3–L7 |
| L10 certificat | `src/domain/certificate.ts`, triggers et consumers | L4, L5 |
| L11 site public et démo | `site/**`, `src/sample/**` | L3–L7 |
| L12 docs de soumission | `docs/RECETTE.md`, `JUDGES.md`, `SUBMISSION.md`, `README.md` | tous |

## Documentation

- [docs/CAHIER-DES-CHARGES.md](docs/CAHIER-DES-CHARGES.md) — la spécification complète (§n cité partout ailleurs) ;
- [docs/CONTRACTS.md](docs/CONTRACTS.md) — fichiers gelés, ownership map, conventions ;
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — couches et flux de données ;
- [docs/METHODE.md](docs/METHODE.md) — un lot, un worktree, une PR ;
- [docs/CI.md](docs/CI.md) — checks requis, runner, budget, file Mergify, pièges ;
- [docs/CONFLICTS.md](docs/CONFLICTS.md) — l'agent de résolution de conflits InferHub.

## Licence

MIT — voir [LICENSE](LICENSE).
