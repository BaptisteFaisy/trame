# CI — Trame

La CI de Trame tourne intégralement sur un runner self-hosted. Trois checks
requis, un budget intangible de 5 minutes par job, une file Mergify comme seul
pilote de merge.

## Les trois checks requis

| check | workflow | ce qu'il vérifie / interdit |
|---|---|---|
| `ci` | `.github/workflows/ci.yml` | types faux (`tsc --noEmit`), tests rouges (`vitest run`), fichier > 500 lignes, workflow YAML invalide, manifeste Forge incohérent (toléré tant que `tools/check-manifest.mjs` est absent), site public non buildable (toléré tant que `site/src` est absent), doc vide ou illisible en UTF-8, garde de CI en échec (couche0, inferhub, fireworks), script shell à la syntaxe cassée (`bash -n`) |
| `ci-budget` | `.github/workflows/ci-budget.yml` | un job sans `timeout-minutes`, ou un timeout > 5 min sur un workflow déclenché par `pull_request` (`python3 .github/ci-budget/check_timeouts.py`) |
| `couche0` | `.github/workflows/couche0.yml` | fichier modifié hors du `## Scope` du corps de PR (ou fichier déclaré mais non touché), motifs interdits dans le diff (poussée forcée, déclencheur à privilèges, clé en clair), workflow de garde modifié sans la mention `SAMVISION_ALLOW_GUARD_BUMP`. Le juge vient de `main`, jamais du head de la PR |

C'est le **nom du job** qui nomme le check (`name: ci`). Les trois sont exigés
par le ruleset de `main` et par les `queue_conditions` de la file Mergify :
sans eux, la PR n'entre pas dans la file.

## Étapes du job `ci` (dans cet ordre)

1. `npx tsc --noEmit` — aucun type faux sur `src/`, `tests/` (et `site/src` quand il existe).
2. `npx vitest run --passWithNoTests` — aucun test rouge ; vert même sans tests (lots naissants).
3. `python3 tools/check-file-limits.py` — aucun fichier > 500 lignes.
4. `python3 tools/check-workflows-yaml.py` — chaque workflow listé est un YAML valide.
5. `node tools/check-manifest.mjs` — manifeste Forge cohérent (message + code 0 tant que le script est absent).
6. `npm run site:build` — seulement si `site/src` existe (lot L11).
7. Sanity docs — tout `.md` / `.mdx` / `.txt` est lisible en UTF-8 et non vide.
8. Tests des gardes CI — `.github/couche0/test_check_couche0.py`, puis chaque
   `test_*.py` de `.github/inferhub/` et de `.github/fireworks/` (sauf
   `fireworks/test_agent.py`, pilote CLI exercé par `test_test_agent.py`).
9. `bash -n` sur chaque script `.sh` hors `node_modules` (message si aucun).

## Le runner

Un seul runner self-hosted : **`r630-trame-01`**, label **`trame-worker`**,
sur le serveur r630 — le service GitHub Actions runner y tourne comme unité
systemd utilisateur. Les jobs ciblent
`runs-on: [self-hosted, linux, x64, trame-worker]`.

Le runner est **persistant** : `node_modules` survit d'un run à l'autre
(`git clean -ffdx -e /node_modules -e /.npm-state`), et l'installation npm n'a
lieu que si `package-lock.json` a changé — magasin chaud
`$HOME/.trame-ci-deps/<hash-du-lock>`, marqueur `node_modules/.trame-lock-hash`,
copie par liens durs (`cp -al`). C'est ce qui tient le budget à froid comme à
chaud.

## Budget : 5 minutes, jamais plus

Chaque job porte `timeout-minutes: 5` (règle user du 24 octobre 2026,
`~/Bureau/CI-BUDGET-5MIN.md`) et `ci-budget` l'interdit au-delà. Pourquoi on ne
l'allonge **jamais** : un run trop long n'est pas « lent », il est cassé — un
timeout allongé masque une dépendance réseau, un test qui boucle ou une
installation à froid qui se répète. On optimise (magasin de dépendances,
`fetch-depth: 1`, tests stdlib sans réseau) ou on découpe le job. `concurrency`
est posée sur chaque workflow, `cancel-in-progress: false` sur les checks
requis.

## Les gardes, en local

```bash
npm ci --prefer-offline
npm run typecheck                    # tsc --noEmit
npm test                             # vitest run
npm run check:limits                 # tools/check-file-limits.py  (< 500 lignes)
node tools/check-function-limits.mjs # fonctions < 50 lignes de code
node tools/check-manifest.mjs        # si le manifeste est touché
python3 tools/check-workflows-yaml.py
python3 .github/ci-budget/check_timeouts.py
python3 .github/couche0/test_check_couche0.py
```

`tools/check-function-limits.mjs` ne compte que le code (commentaires et corps
de chaînes multilignes exclus). `.github/couche0/check_couche0.py` contrôle le
périmètre déclaré ; `.github/ci-budget/check_timeouts.py` borne les jobs.

## La file Mergify

`.mergify.yml` : conditions de file `ci`, `ci-budget`, `couche0` verts,
`-conflict`, `-draft`, `base = main` ; batch de 1 à 3 PR (attente 30 s),
`merge_method: rebase`, `update_method: rebase`, `max_parallel_checks: 1`
(un seul runner : la spéculation affamerait la CI des PR), et
`merge_protections_settings.auto_merge_conditions: true` (auto-queue natif).
Rien ne se merge à la main : la file est le seul pilote. Les conflits sont
résolus par l'agent InferHub (`docs/CONFLICTS.md`).

## Relancer un run, lire un échec

```bash
gh run list --branch "$(git branch --show-current)" --limit 5
gh run view <run-id> --log-failed        # le journal des étapes en échec
gh run rerun <run-id> --failed           # ne rejoue que les jobs rouges
gh workflow run couche0.yml -f pr=<n>    # ré-armer couche0 sur une PR
gh workflow run "CI" --ref main          # réveiller la chaîne (sweeper inclus)
```

Un échec se lit dans l'ordre : l'annotation `::error::` nomme le fichier
fautif (garde de taille, doc vide, timeout) ; le pas en échec nomme la garde ;
le corps de PR nomme le `## Scope`. Sur la file, un check `cancelled` ou
`skipped` se lit comme un échec — d'où les pièges ci-dessous.

## Pièges connus

1. **`concurrency` + `cancel-in-progress: true` sur un check requis** : le
   second push annule le run en cours et publie `cancelled`, que la file lit
   comme rouge. Les checks requis utilisent `false`.
2. **`strict: true`** sur la protection de branche (required status checks) est
   **incompatible** avec la file Mergify : `strict` reste `false`.
3. **`## Scope` exact** : générer la liste avec
   `git -c core.quotepath=off diff --name-only origin/main` (les chemins
   accentués ne doivent pas être échappés). Un fichier touché non déclaré, ou
   déclaré mais non touché, fait échouer `couche0`.
4. **Fichiers de garde** : `.github/workflows/*`, `.github/couche0/`,
   `.github/ci-budget/`, `.github/inferhub/`, `.mergify.yml`, `tools/` sont
   gelés (`docs/CONTRACTS.md` §2) ; les modifier exige la mention
   `SAMVISION_ALLOW_GUARD_BUMP` dans le corps de PR.
5. **Un seul runner** : pas de spéculation (`max_parallel_checks: 1`), pas de
   jobs parallèles lourds, pas de réseau dans les tests de gardes — tout ce qui
   occupe `r630-trame-01` au-delà de quelques secondes retarde toutes les PR.
