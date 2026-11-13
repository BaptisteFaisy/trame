# RECETTE — le détail des vingt points

> Compagnon de [`RECETTE.md`](RECETTE.md) : pour chacun des vingt points du §24,
> la commande exacte, le résultat mesuré, le code visé et la limite honnête.
> Mesuré le 13 novembre 2026 sur `main` @
> `7c468f7bdb33d9d731b71551e2d30a8e7174e657` : `npx vitest run` donne **49
> fichiers, 428 tests verts** (≈7 s à chaud).

## Comment lire une fiche

- **Commande** : recopiée telle quelle, un fichier précis à chaque fois. Le
  filtre `-t` est une **expression** comparée au titre des tests : `§24.1`
  attraperait `§24.15` et `§24.16`, `§24.2` attraperait `§24.20`. Les numéros
  sont donc écrits en entier.
- **Résultat** : « 3 verts » veut dire `Tests 3 passed` ; le reste du fichier
  est ignoré par le filtre et compte en `skipped`. C'est la sortie réelle de la
  commande, pas une estimation.
- **Limite commune, dite une fois** : aucun test ne touche un compte Atlassian.
  Les ports — Teamwork Graph, Confluence, LLM, horloge, file — sont des doubles
  en mémoire (`tests/helpers/fake-*.ts`). Un `vert` prouve un calcul, un
  view-model ou un handler ; il ne prouve pas un appel réseau réel.
- Les fiches ne répètent pas cette limite ; elles ne disent que les manques
  **propres** au point.

### 1. Couverture avec effectif et force par critère

- **Vérifie** : un ticket à trois critères et deux tests exécutés affiche une
  couverture qui porte l'effectif et la force de chaque maille.
- **Commande** : `npx vitest run tests/viewmodel/weave-map.test.ts -t '§24.1'`
  → **1 vert** (4 ignorés) — « §24.1 montre les fils, les passages et les trous ».
- **Aussi** : `npx vitest run tests/handlers/screens.test.ts` → **3 verts** (la
  matrice des onze écrans).
- **Où** : `src/viewmodel/weave-map.ts` (fil, passage, maille, trou),
  `src/domain/coverage.ts` (`computeCoverage`), `src/domain/percent.ts`.
- **Limite** : l'effectif est prouvé sur le view-model et le domaine ; l'écran
  UI Kit 2 lui-même reste le registre (voir `RECETTE.md` §4).

### 2. La force suit la forme de l'acte de vérification

- **Vérifie** : un test automatisé exécuté est compté « machine », une
  attestation « attestée », un commentaire « déclarée ».
- **Commande** : `npx vitest run tests/domain/coverage.test.ts -t '§24.2'`
  → **4 verts** (17 ignorés).
- **Aussi** : `tests/ingest/comments-mapping.test.ts -t '§24.2'` → 2 verts ;
  `tests/ingest/graph-mapping.test.ts -t '§24.2'` → 1 ;
  `tests/ingest/pipeline.test.ts -t '§24.2'` → 8 ;
  `tests/actions/get-coverage.test.ts -t '§24.2'` → 3.
- **Où** : `DEFAULT_STRENGTH_BY_FORM` et `STRENGTH_RANK` dans `src/defaults.ts`.

### 3. Les trois axes sont décomposés et jamais fusionnés

- **Vérifie** : force, type de liaison et fraîcheur sont trois lignes
  distinctes ; la provisoire n'entre pas dans la déclarée.
- **Commande** : `npx vitest run tests/domain/coverage.test.ts -t '§24.3'`
  → **5 verts** (16 ignorés).
- **Où** : `src/domain/coverage.ts`, `tests/domain/coverage.test.ts`.

### 4. Une perforation porte ses deux dates et son classement

- **Vérifie** : un critère modifié après son test est listé en perforation avec
  la date du critère et celle de la vérification, classé fraîche (< 7 j), sèche
  (> 30 j) ou multiple (3 changements).
- **Commande** : `npx vitest run tests/domain/perforations.test.ts -t '§24.4'`
  → **7 verts** (7 ignorés).
- **Aussi** : `tests/actions/list-perforations.test.ts -t '§24.4'` → 3 verts ;
  `tests/actions/get-criterion.test.ts -t '§24.4'` → 1.
- **Où** : `src/domain/perforations.ts`, seuils `PERFORATION_*` de
  `src/defaults.ts`.

### 5. Un test désactivé fait disparaître sa couverture

- **Vérifie** : la couverture affichée baisse quand un test est ignoré ; le fil
  détendu est listé avec son impact chiffré.
- **Commande** : `npx vitest run tests/domain/dangling.test.ts -t '§24.5'`
  → **3 verts** (8 ignorés).
- **Aussi** : `tests/domain/coverage.test.ts -t '§24.5'` → 1 vert ;
  `tests/actions/list-dangling.test.ts -t '§24.5'` → 2 verts.
- **Où** : `src/domain/dangling.ts`, `src/domain/coverage.ts`.

### 6. Un critère supprimé fait apparaître un fil détendu

- **Vérifie** : le critère supprimé produit un fil détendu avec sa raison ; il
  ne retire que sa propre maille.
- **Commande** : `npx vitest run tests/domain/dangling.test.ts -t '§24.6'`
  → **2 verts** (9 ignorés).
- **Aussi** : `tests/actions/list-dangling.test.ts -t '§24.6'` → 1 vert.
- **Où** : `src/domain/dangling.ts` (`detectDangling`).

### 7. Une liaison dérivée au-dessus du seuil est provisoire

- **Vérifie** : une liaison dérivée à 0,91 est « provisoire » et n'entre pas
  dans la couverture déclarée ; à 0,62 elle reste une proposition et le critère
  redevient un trou.
- **Commande** : `npx vitest run tests/domain/coverage.test.ts -t '§24.7'`
  → **3 verts** (18 ignorés).
- **Aussi** : `tests/domain/bulletin.test.ts -t '§24.7'` → 1 vert ;
  `tests/domain/links.test.ts -t '§24.7'` → 1 ;
  `tests/actions/get-coverage.test.ts -t '§24.7'` → 2.
- **Où** : `DERIVED_LINK_THRESHOLD = 0.85` et `DERIVED_LINK_FLOOR = 0.5` dans
  `src/defaults.ts`, consommés par `src/domain/links.ts`.

### 8. Une liaison dérivée confirmée devient déclarée

- **Vérifie** : la confirmation renforce les jetons partagés de la confiance
  apprise, la liaison devient déclarée et entre dans l'historique du critère.
- **Commande** : `npx vitest run tests/domain/links.test.ts -t '§24.8'`
  → **1 vert** (14 ignorés).
- **Aussi** : `tests/actions/confirm-link.test.ts -t '§24.8'` → 2 verts ;
  `tests/actions/get-criterion.test.ts -t '§24.8'` → 1 (l'historique).
- **Où** : `src/domain/confidence.ts`, `src/domain/links.ts`, action
  `src/actions/confirm-link.ts`.

### 9. Une liaison dérivée rejetée affaiblit la suggestion suivante

- **Vérifie** : un rejet affaiblit les jetons partagés, donc la suggestion
  suivante du même type.
- **Commande** : `npx vitest run tests/domain/links.test.ts -t '§24.9'`
  → **1 vert** (14 ignorés).
- **Aussi** : `tests/domain/proposals.test.ts -t '§24.9'` → 4 verts ;
  `tests/actions/reject-link.test.ts -t '§24.9'` → 3.
- **Où** : `src/domain/confidence.ts`, `src/domain/proposals.ts`, action
  `src/actions/reject-link.ts`.

### 10. Un critère infalsifiable est compté à part

- **Vérifie** : un critère infalsifiable n'est ni trou ni couverture ; une
  reformulation vérifiable (mesure + percentile) est proposée.
- **Commande** : `npx vitest run tests/domain/falsifiability.test.ts -t '§24.10'`
  → **4 verts** (16 ignorés).
- **Aussi** : `tests/actions/list-unverifiable.test.ts -t '§24.10'` → 3 verts ;
  `tests/actions/propose-reformulation.test.ts -t '§24.10'` → 3.
- **Où** : `src/domain/falsifiability.ts`, `src/domain/reformulation.ts`.
- **Limite** : la reformulation est **calculée** (règle déterministe), pas
  générée par un modèle ; la génération LLM renvoie `NOT_IMPLEMENTED`
  (voir `RECETTE.md` §4).

### 11. Un trou est priorisé par le métré, calcul affiché

- **Vérifie** : le classement suit le métré, le score est borné dans [0, 1] et
  affiché avec ses trois termes, recalculés terme par terme.
- **Commande** : `npx vitest run tests/domain/holes.test.ts -t '§24.11'`
  → **4 verts** (20 ignorés).
- **Aussi** : `tests/domain/metric.test.ts -t '§24.11'` → 5 verts ;
  `tests/actions/list-holes.test.ts -t '§24.11'` → 2.
- **Où** : `src/domain/holes.ts`, `src/domain/metric.ts`, poids de
  `src/defaults.ts`.

### 12. Une zone qui a déjà cassé remonte dans le classement

- **Vérifie** : le trou d'une zone à risque passe devant celui d'une zone
  calme ; le score observé de la zone est affiché avec sa raison.
- **Commande** : `npx vitest run tests/domain/holes.test.ts -t '§24.12'`
  → **5 verts** (19 ignorés).
- **Aussi** : `tests/actions/list-holes.test.ts -t '§24.12'` → 1 vert ;
  `npx vitest run tests/domain/zones.test.ts` → 12 verts (le calcul des zones).
- **Où** : `src/domain/zones.ts`, `src/domain/metric.ts`.

### 13. Un bulletin daté et comparable au témoin précédent

- **Vérifie** : le bulletin porte sa date et celle du témoin précédent ; deux
  témoins se comparent d'un sprint à l'autre.
- **Commande** : `npx vitest run tests/domain/bulletin.test.ts -t '§24.13'`
  → **4 verts** (8 ignorés).
- **Aussi** : `tests/actions/get-bulletin.test.ts -t '§24.13'` → 2 verts.
- **Où** : `src/domain/bulletin.ts`, `src/domain/witness.ts`,
  `src/domain/timeline.ts`.

### 14. Le certificat déclare ce qui n'est pas couvert

- **Vérifie** : le certificat liste les actes (type, date, acteur, force), les
  perforations et fils détendus, les infalsifiables, et déclare explicitement
  ce qui n'est pas couvert.
- **Commande** : `npx vitest run tests/domain/certificate.test.ts -t '§24.14'`
  → **1 vert** (3 ignorés ; fichier : 4 tests).
- **Aussi** : `tests/actions/publish-certificate.test.ts -t '§24.14'` → 2 verts ;
  `tests/actions/get-certificate.test.ts -t '§24.14'` → 3 ;
  `tests/handlers/screens.test.ts -t '§24.14'` → 1.
- **Où** : `src/domain/certificate.ts` (`buildCertificate`,
  `certificateToMarkdown`), action `src/actions/publish-certificate.ts`.
- **Limite** : la page est **générée** (Markdown, avec sa section « ce qui
  n'est PAS couvert ») et publiée via le port Confluence ; l'adaptateur réel
  `src/ingest/confluence.ts` n'est pas câblé (`publishCertificate` → `null`),
  donc hors test l'action répond `publication impossible` et le repli du §21
  s'applique — certificat affiché dans l'app, exporté à la main. Les deux
  branches sont testées (page publiée ; refus, jamais une page vide).

### 15. Un droit manquant n'est jamais compté comme un trou

- **Vérifie** : un droit absent sur `test-execution` apparaît comme angle mort
  (`no-right`), et aucun trou n'est attribué à ce motif.
- **Commande** : `npx vitest run tests/ingest/probe.test.ts -t '§24.15'`
  → **6 verts** (3 ignorés).
- **Aussi** : `tests/domain/coverage.test.ts -t '§24.15'` → 1 vert ;
  `tests/actions/get-coverage.test.ts -t '§24.15'` → 2.
- **Où** : `src/ingest/graph.ts` (`probeWith`), `src/ingest/graph-queries.ts`
  (`probeCaseFor`), écran `src/handlers/visibility.ts`.

### 16. Un projet sans critère affiche « aucun critère écrit »

- **Vérifie** : l'absence de critère n'est pas rendue par « 0 % ».
- **Commande** : `npx vitest run tests/domain/coverage.test.ts -t '§24.16'`
  → **2 verts** (19 ignorés).
- **Aussi** : `tests/domain/bulletin.test.ts -t '§24.16'` → 1 vert ;
  `tests/handlers/screens.test.ts -t '§24.16'` → 1 (le bulletin rend
  `no-criterion-written`) ; `tests/actions/get-coverage.test.ts -t '§24.16'` → 1.
- **Où** : `src/domain/coverage.ts`, `src/viewmodel/bulletin.ts`.

### 17. La convention de nommage lie de façon déterministe

- **Vérifie** : un test nommé `PROJ-12.testShouldRetry` est rattaché à `PROJ-12`
  sans passer par le modèle ; la reconnaissance est déterministe.
- **Commande** : `npx vitest run tests/domain/links.test.ts -t '§24.17'`
  → **2 verts** (13 ignorés).
- **Aussi** : `tests/ingest/bitbucket-mapping.test.ts -t '§24.17'` → 2 verts
  (la conversion Bitbucket).
- **Où** : `src/domain/links.ts` (chemin par convention),
  `src/ingest/bitbucket-mapping.ts`.

### 18. Le recalcul ne reprend que ce qui a changé

- **Vérifie** : modifier un critère ne relance que les liaisons concernées ; un
  texte inchangé ne rappelle jamais le modèle.
- **Commande** : `npx vitest run tests/actions/recompute.test.ts -t '§24.18'`
  → **1 vert** (3 ignorés) — le recalcul repart du **curseur** de la tranche
  `links` et ne refait que ce qui a changé depuis.
- **Aussi** : `npx vitest run tests/collect/fingerprint.test.ts` → **10 verts**
  (l'empreinte qui sert de clé de cache) ;
  `npx vitest run tests/handlers/triggers.test.ts` → **14 verts** (les quatre
  tranches, le curseur qui avance).
- **Où** : `src/actions/recompute.ts`, `src/handlers/consumer.ts`,
  `src/collect/fingerprint.ts`, `src/ingest/llm.ts` (cache
  `opération:empreinte` + budget réel).
- **Limite** : deux mécanismes distincts, deux preuves distinctes — le
  **recalcul par tranches bornées par le curseur** (test nominatif) et le
  **cache par empreinte** (empreinte + budget). La similarité qui consommerait
  ce cache ne propose rien : `suggestLinks` renvoie le vide.

### 19. Aucun écran, export ni outil ne contient de statistique par personne

- **Vérifie** : aucune figure rapportée ne porte de champ de personne ; un
  filtre par personne est refusé.
- **Commande** : `npx vitest run tests/actions/get-coverage.test.ts -t '§24.19'`
  → **2 verts** (8 ignorés) : « un filtre par personne est refusé » et « la
  réponse ne porte aucun champ de personne ».
- **Aussi** : `npx vitest run tests/contract/honesty.test.ts` → **10 verts**
  (dont « keeps person fields out of every reported figure ») ;
  `npx vitest run tests/db/persistence.test.ts -t 'aucune statistique par personne'`
  → 1 vert.
- **Où** : `readPersonFilter` dans `src/actions/common.ts` (appelé par toutes
  les actions), `src/types.ts`, `src/db/schema.ts`, `src/ports.ts`.

### 20. Un critère contenant une clé n'est pas indexé

- **Vérifie** : un critère contenant une clé n'est pas retourné par
  l'extraction ; le signalement ne contient jamais la valeur, seulement la
  famille.
- **Commande** : `npx vitest run tests/collect/extraction.test.ts -t '§24.20'`
  → **2 verts** (25 ignorés ; fichier : 27 tests).
- **Aussi** : `npx vitest run tests/domain/secrets.test.ts` → **18 verts** (le
  détecteur complet).
- **Où** : `flagSecrets` dans `src/collect/index.ts`, `src/domain/secrets.ts`,
  signalement branché dans `src/handlers/events.ts`.