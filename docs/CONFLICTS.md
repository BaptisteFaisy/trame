# CONFLICTS — l'agent « hermes » (InferHub)

Mergify est le **seul pilote de merge** : elle met en file, met à jour (rebase)
et merge tant que la PR est `CLEAN` ou `BEHIND`. Ce qu'elle ne sait pas faire,
c'est résoudre un conflit : une PR `DIRTY` (`mergeable == CONFLICTING`) attend
son auteur. Le système « hermes » prend le relais, en trois rôles qui ne se
chevauchent jamais :

1. **Mergify** (`.mergify.yml`) — queue, rebase, merge. Rien d'autre ne merge.
2. **Le balayeur** (`.github/workflows/pr-auto-merge.yml`) — rebase les PR
   `BEHIND`, pilote les agents, ne résout pas les conflits de contenu.
3. **L'agent de conflits** (`.github/workflows/conflict-resolver.yml` +
   `.github/inferhub/conflict_agent.py`) — sur conflit **réel** : rebase sur
   `main`, fait résoudre chaque conflit élémentaire par le modèle, vérifie,
   pousse avec bail et commente la PR.

Rien ici ne merge, ne labellise « approuvé » ni ne ferme quoi que ce soit.

## Le modèle

`combo/cheap`, servi par InferHub sur
`https://api.inferhub.dev/v1/chat/completions` (URL **complète**, voir piège 1).
L'agent résout **un bloc de conflit à la fois** : le reste du fichier est copié
verbatim, jamais de réécriture complète (un gros fichier serait tronqué).
Codes de sortie : `0` poussé, `1` échec commenté sur la PR, `2` rien à faire.

## Configuration exacte du dépôt

| Kind | Nom | Valeur |
|---|---|---|
| secret | `INFERHUB_API_KEY` | clé InferHub — jamais imprimée, jamais commitée |
| var | `INFERHUB_BASE_URL` | `https://api.inferhub.dev/v1/chat/completions` — l'endpoint **complet**, malgré le nom |
| var | `INFERHUB_MODEL` | `combo/cheap` |
| var | `INFERHUB_AGENT_RESOLVE` | `1` (`0` = coupe-circuit) |
| var | `CI_RUNNER` | `["self-hosted","trame-worker"]` |
| secret | `AUTOMERGE_PAT` | jeton du propriétaire : un push signé `github-actions[bot]` met les workflows en `action_required` et la PR reste BLOCKED sans aucun check |

Routage des agents `.github/fireworks` (balayeur) : `FIREWORKS_BASE_URL` et
`FIREWORKS_MODEL` (les deux doivent figurer dans le bloc `env:` du job
matriciel de `pr-auto-merge.yml`, sinon ils n'arrivent jamais à l'agent), avec
**`FIREWORKS_AGENT_RESOLVE=0`** : il n'y a qu'un seul résolveur de conflits —
celui d'InferHub. Les agents fireworks ne font que le rebase, le scope et les
tests, jamais la résolution.

Déclencheurs de `conflict-resolver.yml` : cron `*/10`, fin du workflow `ci`
(`workflow_run`) et `workflow_dispatch` avec `-f pr=N` (vide = toutes les PR
`CONFLICTING`, 20 listées au plus). Le push de l'agent part avec
`AUTOMERGE_PAT` et `--force-with-lease=<branche>:<sha>` : si la tête a bougé
entre-temps, le push échoue sans rien casser.

## Garde-fous

- **Périmètre interdit** : `.github/` et `.mergify.yml` ne sont jamais touchés
  (`REFUSED_PREFIXES`) — un conflit là-dedans exige une main humaine.
- **Labels d'arrêt** : `hold` ou `intervention-humaine` sur la PR → l'agent
  saute, sans bruit.
- **Plafond par run** : 3 PR maximum traitées par passage du balayeur.
- **Quota** (`quota.py`, empreintes dans `~/.cache/inferhub-agent`) : cooldown
  de 20 min **par SHA de tête**, plafond global de 10 saisines par heure, et
  3 saisines par PR et par 30 min (leçon du 29/10 : une PR rebasée en boucle
  avait mangé tout le quota horaire).
- **Porte de compilation** (`compilation_gate.py`) : une résolution qui ne
  compile pas n'est **jamais poussée** — la branche reste intacte, la PR reste
  `DIRTY`, le compte rendu cite les erreurs du compilateur. Une porte qui ne
  peut pas s'exécuter ne bloque rien et le dit. Coupe-circuit :
  `CONFLICT_COMPILE_GATE=0`.
- **Union sans modèle** (`union_journal.py`) : un conflit d'ajout pur dans un
  journal (`CHANGELOG.md`) est résolu déterministement — les deux côtés sont
  réunis, zéro appel LLM. Un bloc qui remplace une ligne commune reste au
  modèle : c'est un vrai désaccord.
- **Limites d'entrée** : 100 fichiers, 200 Ko par fichier, 20 conflits
  élémentaires par fichier, 12 000 caractères par conflit, 10 rounds, budget
  temps borné — au-delà, `AgentError` et compte rendu, jamais de push.

## Test de bout en bout reproductible

1. Deux branches modifient **le même paragraphe** d'un même document.
2. Merger la première (file Mergify).
3. La seconde passe `CONFLICTING` (vérifier : `gh pr view <N> --json mergeable`).
4. Réveiller l'agent : `gh workflow run conflict-resolver.yml -f pr=<N>`.
5. Attendu : l'agent rebase sur `main`, garde les **deux** apports, pousse avec
   bail (`--force-with-lease`), commente la PR (résolution + porte de
   compilation), et la file Mergify merge dès que `ci`, `ci-budget` et
   `couche0` sont verts.

## Les 5 pièges connus

1. **L'URL complète, malgré le nom de la variable.** `INFERHUB_BASE_URL` est
   utilisée comme endpoint **complet** : avec `https://api.inferhub.dev/v1`,
   chaque résolution meurt en HTTP 404. `normalize_api_url()` accepte une base
   nue, une base `/v1`, un slash final ou l'endpoint complet.
2. **`combo/cheap` rute vers un modèle de raisonnement.** Si le budget de
   tokens part dans `reasoning_content`, `message.content` revient **vide** →
   lever `AgentError` (« réponse InferHub sans contenu ») au lieu de pousser un
   fichier résolu vide.
3. **Le quota estampille avant l'appel.** `quota.autoriser()` pose l'empreinte
   **avant** l'appel modèle : une erreur de transport grillait le cooldown de
   20 min. `quota.release_stamp(pr, sha)` rend l'empreinte quand l'échec est un
   appel InferHub ou un contenu vide.
4. **Après un échec, changer le SHA de tête.** Le cooldown est par SHA : pousser
   un commit vide (`git commit --allow-empty`) pour changer la tête, sinon le
   balayeur saute la PR jusqu'à expiration des 20 min.
5. **Une PR `DIRTY` est invisible des déclencheurs ordinaires.** Pas de run
   `pull_request` (pas de merge ref), et le cron ne ticke pas sur un dépôt
   récent. Réveil fiable : `gh workflow run conflict-resolver.yml -f pr=<N>`,
   ou `gh workflow run "CI" --ref main` (la fin de CI réveille la chaîne via
   `workflow_run`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `.github/workflows/conflict-resolver.yml` | le balayeur : liste, clone, rebase, appelle l'agent, pousse |
| `.github/inferhub/conflict_agent.py` | le résolveur : un conflit à la fois, push avec bail, compte rendu |
| `.github/inferhub/quota.py` | cooldown par SHA, plafond horaire, 3 par PR / 30 min |
| `.github/inferhub/compilation_gate.py` | ne pousse jamais une résolution qui ne compile pas |
| `.github/inferhub/union_journal.py` | union déterministe des journaux, sans modèle |
| `.github/inferhub/test_*.py` | l'agent se teste lui-même en CI (stdlib, sans réseau) |
